/*
 * Copyright 2019 is-land
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.island.ohara.client.configurator.v0
import com.island.ohara.client.kafka.Enum
import com.island.ohara.common.data.{Column, DataType}
import com.island.ohara.kafka.connector.json.{ConnectorFormatter, PropGroups, SettingDefinition, StringList}
import spray.json.{JsArray, JsNull, JsNumber, JsObject, JsString, JsValue, RootJsonFormat}

import scala.collection.JavaConverters._
import scala.concurrent.{ExecutionContext, Future}

object ConnectorApi {
  val CONNECTORS_PREFIX_PATH: String = "connectors"
  val START_COMMAND: String = "start"
  val STOP_COMMAND: String = "stop"
  val PAUSE_COMMAND: String = "pause"
  val RESUME_COMMAND: String = "resume"

  /**
    * In this APIs we have to integrate json format between scala (spray-json) and java (jackson).
    * The JsNull generated by spray-json confuse jackson to generate many "null" object. We remove the key related to
    * JsNull in order to avoid passing null to jackson.
    */
  private[this] def noJsNull(fields: Map[String, JsValue]): Map[String, JsValue] = fields.filter {
    _._2 match {
      case JsNull => false
      case _      => true
    }
  }

  /**
    * The name is a part of "Restful APIs" so "DON'T" change it arbitrarily
    */
  abstract sealed class ConnectorState(val name: String)
  object ConnectorState extends Enum[ConnectorState] {
    case object UNASSIGNED extends ConnectorState("UNASSIGNED")
    case object RUNNING extends ConnectorState("RUNNING")
    case object PAUSED extends ConnectorState("PAUSED")
    case object FAILED extends ConnectorState("FAILED")
    case object DESTROYED extends ConnectorState("DESTROYED")
  }
  // TODO: remove this format after ohara manager starts to use new APIs
  implicit val COLUMN_JSON_FORMAT: RootJsonFormat[Column] = new RootJsonFormat[Column] {
    override def read(json: JsValue): Column = json.asJsObject.getFields("name", "newName", "dataType", "order") match {
      case Seq(JsString(n), JsString(nn), JsString(t), JsNumber(o)) =>
        Column.builder().name(n).newName(nn).dataType(DataType.valueOf(t.toUpperCase())).order(o.toInt).build()
      case Seq(JsString(n), JsNull, JsString(t), JsNumber(o)) =>
        Column.builder().name(n).newName(n).dataType(DataType.valueOf(t.toUpperCase())).order(o.toInt).build()
      case Seq(JsString(n), JsString(t), JsNumber(o)) =>
        Column.builder().name(n).newName(n).dataType(DataType.valueOf(t.toUpperCase)).order(o.toInt).build()
      case _ => throw new UnsupportedOperationException(s"invalid format from ${classOf[Column].getSimpleName}")
    }
    override def write(obj: Column): JsValue = JsObject(
      "name" -> JsString(obj.name),
      "newName" -> JsString(obj.newName),
      "dataType" -> JsString(obj.dataType.name),
      "order" -> JsNumber(obj.order)
    )
  }

  final case class ConnectorCreationRequest(settings: Map[String, JsValue]) {

    /**
      * Convert all json value to plain string. It keeps the json format but all stuff are in string.
      */
    def plain: Map[String, String] = noJsNull(settings).map {
      case (k, v) =>
        k -> (v match {
          case JsString(value) => value
          case _               => v.toString()
        })
    }
    def className: String = plain.getOrElse(
      SettingDefinition.CONNECTOR_CLASS_DEFINITION.key(),
      plain.getOrElse("className",
                      throw new NoSuchElementException(
                        s"Can't find either ${SettingDefinition.CONNECTOR_CLASS_DEFINITION.key()} or className"))
    )
    def columns: Seq[Column] = plain
      .get(SettingDefinition.COLUMNS_DEFINITION.key())
      .map(s => PropGroups.ofJson(s).toColumns.asScala)
      .getOrElse(Seq.empty)
    def numberOfTasks: Option[Int] = plain.get(SettingDefinition.NUMBER_OF_TASKS_DEFINITION.key()).map(_.toInt)
    def workerClusterName: Option[String] = plain.get(SettingDefinition.WORKER_CLUSTER_NAME_DEFINITION.key())
    def topicNames: Seq[String] =
      plain
        .get(SettingDefinition.TOPIC_NAMES_DEFINITION.key())
        .map(s => StringList.ofJson(s).asScala)
        .getOrElse(Seq.empty)
  }

  object ConnectorCreationRequest {
    import spray.json._

    /**
      * this is a helper method to initialize ConnectorCreationRequest with common settings.
      */
    def apply(className: Option[String],
              columns: Seq[Column],
              topicNames: Seq[String],
              numberOfTasks: Option[Int],
              settings: Map[String, String],
              workerClusterName: Option[String]): ConnectorCreationRequest = ConnectorCreationRequest(
      settings = settings.map {
        case (k, v) => k -> JsString(v)
      } ++ Map(
        SettingDefinition.CONNECTOR_CLASS_DEFINITION.key() -> className.map(JsString(_)),
        SettingDefinition.COLUMNS_DEFINITION
          .key() -> (if (columns.isEmpty) None
                     else Some(PropGroups.ofColumns(columns.asJava).toJsonString.parseJson)),
        SettingDefinition.TOPIC_NAMES_DEFINITION.key() -> (if (topicNames.isEmpty) None
                                                           else
                                                             Some(
                                                               StringList.toJsonString(topicNames.asJava).parseJson)),
        SettingDefinition.NUMBER_OF_TASKS_DEFINITION.key() -> numberOfTasks.map(JsNumber(_)),
        SettingDefinition.WORKER_CLUSTER_NAME_DEFINITION.key() -> workerClusterName.map(JsString(_))
      ).filter(_._2.nonEmpty).map(e => e._1 -> e._2.get)
    )
  }

  implicit val CONNECTOR_CREATION_REQUEST_JSON_FORMAT: RootJsonFormat[ConnectorCreationRequest] =
    new RootJsonFormat[ConnectorCreationRequest] {
      import spray.json._
      override def write(obj: ConnectorCreationRequest): JsValue = JsObject(noJsNull(obj.settings))

      /**
        * we write custom unmarshal to support old api
        * This is a ugly but required process since we cn't betray ohara manager after we adopt the new APIs.
        * We do the following process.
        * 1) remove all known keyword from a copy of input. (since we will re-assign it later)
        * 2) convert the fileds by old way
        * 3) re-assign the value by new APIs
        * 4) merge remaining arguments from input
        * TODO: remove this ugly convert after ohara manager starts to use new APIs
        */
      override def read(json: JsValue): ConnectorCreationRequest = {
        val fields: Map[String, JsValue] = noJsNull(json.asJsObject.fields)
        val setting = collection.mutable.Map(fields.toSeq: _*)
        setting.remove("className")
        setting.remove("schema")
        setting.remove("topics")
        setting.remove("numberOfTasks")
        setting.remove("workerClusterName")
        setting.remove("settings")
        val request = ConnectorCreationRequest(
          className = fields.get("className").map(_.asInstanceOf[JsString].value),
          columns = fields
            .get("schema")
            .map(_.asInstanceOf[JsArray].elements.map(COLUMN_JSON_FORMAT.read))
            .getOrElse(Seq.empty),
          topicNames = fields
            .get("topics")
            .map(_.asInstanceOf[JsArray].elements.map(_.asInstanceOf[JsString].value))
            .getOrElse(Vector.empty),
          numberOfTasks = fields.get("numberOfTasks").map(_.asInstanceOf[JsNumber].value.toInt),
          settings = fields
            .get("settings")
            .map(_.asInstanceOf[JsObject].fields.map {
              case (k, v) => k -> v.asInstanceOf[JsString].value
            })
            .getOrElse(Map.empty),
          workerClusterName = fields.get("workerClusterName").map(_.asInstanceOf[JsString].value)
        )
        request.copy(settings = request.settings ++ setting)
      }
    }

  /**
    * this is what we store in configurator
    */
  final case class ConnectorDescription(id: String,
                                        settings: Map[String, JsValue],
                                        state: Option[ConnectorState],
                                        error: Option[String],
                                        lastModified: Long)
      extends Data {

    /**
      * Convert all json value to plain string. It keeps the json format but all stuff are in string.
      */
    def plain: Map[String, String] = noJsNull(settings).map {
      case (k, v) =>
        k -> (v match {
          case JsString(value) => value
          case _               => v.toString()
        })
    }

    /**
      * In starting connector, the name of connector is replaced by connector id.
      * That is to say, the name should be same with id. However, user may "set" their custom name and we should
      * display the custom name by default.
      * @return name
      */
    override def name: String = plain.getOrElse(ConnectorFormatter.NAME_KEY, id)
    override def kind: String = "connector"
    def className: String = plain.getOrElse(
      SettingDefinition.CONNECTOR_CLASS_DEFINITION.key(),
      plain.getOrElse("className",
                      throw new NoSuchElementException(
                        s"Can't find either ${SettingDefinition.CONNECTOR_CLASS_DEFINITION.key()} or className"))
    )
    def columns: Seq[Column] = plain
      .get(SettingDefinition.COLUMNS_DEFINITION.key())
      .map(s => PropGroups.ofJson(s).toColumns.asScala)
      .getOrElse(Seq.empty)
    def numberOfTasks: Int = plain(SettingDefinition.NUMBER_OF_TASKS_DEFINITION.key()).toInt
    def workerClusterName: String = plain(SettingDefinition.WORKER_CLUSTER_NAME_DEFINITION.key())
    def topicNames: Seq[String] =
      plain
        .get(SettingDefinition.TOPIC_NAMES_DEFINITION.key())
        .map(s => StringList.ofJson(s).asScala)
        .getOrElse(Seq.empty)
  }

  implicit val CONNECTOR_STATE_JSON_FORMAT: RootJsonFormat[ConnectorState] =
    new RootJsonFormat[ConnectorState] {
      override def write(obj: ConnectorState): JsValue = JsString(obj.name)
      override def read(json: JsValue): ConnectorState =
        ConnectorState.forName(json.asInstanceOf[JsString].value)
    }

  /**
    * we write custom unmarshal to support old api
    * TODO: remove this ugly convert after ohara manager starts to use new APIs
    */
  implicit val CONNECTOR_DESCRIPTION_JSON_FORMAT: RootJsonFormat[ConnectorDescription] =
    new RootJsonFormat[ConnectorDescription] {
      override def read(json: JsValue): ConnectorDescription = {
        val fields: Map[String, JsValue] = noJsNull(json.asJsObject.fields)
        ConnectorDescription(
          id = fields("id").asInstanceOf[JsString].value,
          settings = fields.get("settings").map(_.asInstanceOf[JsObject].fields).getOrElse(Map.empty),
          state = fields.get("state").map(_.asInstanceOf[JsString]).map(CONNECTOR_STATE_JSON_FORMAT.read),
          error = fields.get("error").map(_.asInstanceOf[JsString].value),
          lastModified = fields("lastModified").asInstanceOf[JsNumber].value.toLong
        )
      }

      override def write(obj: ConnectorDescription): JsValue = JsObject(
        "id" -> JsString(obj.id),
        "settings" -> JsObject(obj.settings),
        "state" -> obj.state.map(CONNECTOR_STATE_JSON_FORMAT.write).getOrElse(JsNull),
        "error" -> obj.error.map(JsString(_)).getOrElse(JsNull),
        "lastModified" -> JsNumber(obj.lastModified),
        // TODO: remove this (https://github.com/oharastream/ohara/issues/518) by chia
        "name" -> obj.plain.get(ConnectorFormatter.NAME_KEY).map(JsString(_)).getOrElse(JsNull),
        "schema" -> JsArray(obj.columns.map(COLUMN_JSON_FORMAT.write).toVector),
        "className" -> obj.plain
          .get(SettingDefinition.CONNECTOR_CLASS_DEFINITION.key())
          .map(JsString(_))
          .getOrElse(JsNull),
        "topics" -> JsArray(obj.topicNames.map(JsString(_)).toVector),
        "numberOfTasks" -> obj.plain
          .get(SettingDefinition.NUMBER_OF_TASKS_DEFINITION.key())
          .map(JsNumber(_))
          .getOrElse(JsNull),
        "workerClusterName" -> obj.plain
          .get(SettingDefinition.WORKER_CLUSTER_NAME_DEFINITION.key())
          .map(JsString(_))
          .getOrElse(JsNull),
        "configs" -> JsObject(obj.settings.filter(_._2.isInstanceOf[JsString]))
      )
    }
  class Access private[v0]
      extends com.island.ohara.client.configurator.v0.Access[ConnectorCreationRequest, ConnectorDescription](
        CONNECTORS_PREFIX_PATH) {

    private[this] def actionUrl(id: String, action: String): String =
      s"http://${_hostname}:${_port}/${_version}/${_prefixPath}/$id/$action"

    /**
      * start to run a connector on worker cluster.
      *
      * @param id connector's id
      * @return the configuration of connector
      */
    def start(id: String)(implicit executionContext: ExecutionContext): Future[ConnectorDescription] =
      exec.put[ConnectorDescription, ErrorApi.Error](actionUrl(id, START_COMMAND))

    /**
      * stop and remove a running connector.
      *
      * @param id connector's id
      * @return the configuration of connector
      */
    def stop(id: String)(implicit executionContext: ExecutionContext): Future[ConnectorDescription] =
      exec.put[ConnectorDescription, ErrorApi.Error](actionUrl(id, STOP_COMMAND))

    /**
      * pause a running connector
      *
      * @param id connector's id
      * @return the configuration of connector
      */
    def pause(id: String)(implicit executionContext: ExecutionContext): Future[ConnectorDescription] =
      exec.put[ConnectorDescription, ErrorApi.Error](actionUrl(id, PAUSE_COMMAND))

    /**
      * resume a paused connector
      *
      * @param id connector's id
      * @return the configuration of connector
      */
    def resume(id: String)(implicit executionContext: ExecutionContext): Future[ConnectorDescription] =
      exec.put[ConnectorDescription, ErrorApi.Error](actionUrl(id, RESUME_COMMAND))
  }

  def access(): Access = new Access
}
