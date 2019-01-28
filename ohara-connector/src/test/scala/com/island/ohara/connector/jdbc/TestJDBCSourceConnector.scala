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

package com.island.ohara.connector.jdbc

import java.sql.Statement

import com.island.ohara.client.DatabaseClient
import com.island.ohara.client.configurator.v0.QueryApi.RdbColumn
import com.island.ohara.client.kafka.WorkerClient
import com.island.ohara.common.data.{Cell, Row, Serializer}
import com.island.ohara.connector.jdbc.source._
import com.island.ohara.integration.{Database, With3Brokers3Workers}
import com.island.ohara.kafka.Consumer
import org.junit.{Before, Test}
import org.scalatest.Matchers

import scala.collection.JavaConverters._
import scala.concurrent.Await
import scala.concurrent.duration._

/**
  * Test the JDBC Source Connector
  */
class TestJDBCSourceConnector extends With3Brokers3Workers with Matchers {
  private[this] val db = Database.of()
  private[this] val client = DatabaseClient(db.url, db.user, db.password)
  private[this] val tableName = "table1"
  private[this] val timestampColumnName = "column1"
  private[this] val workerClient = WorkerClient(testUtil.workersConnProps)

  @Before
  def setup(): Unit = {
    val column1 = RdbColumn("column1", "TIMESTAMP", true)
    val column2 = RdbColumn("column2", "varchar(45)", false)
    val column3 = RdbColumn("column3", "VARCHAR(45)", false)
    val column4 = RdbColumn("column4", "integer", false)

    client.createTable(tableName, Seq(column1, column2, column3, column4))
    val statement: Statement = db.connection.createStatement()

    statement.executeUpdate(
      s"INSERT INTO $tableName(column1,column2,column3,column4) VALUES('2018-09-01 00:00:00', 'a11', 'a12', 1)")
    statement.executeUpdate(
      s"INSERT INTO $tableName(column1,column2,column3,column4) VALUES('2018-09-01 00:00:01', 'a21', 'a22', 2)")
    statement.executeUpdate(
      s"INSERT INTO $tableName(column1,column2,column3,column4) VALUES('2018-09-01 00:00:02', 'a31', 'a32', 3)")
    statement.executeUpdate(
      s"INSERT INTO $tableName(column1,column2,column3,column4) VALUES(NOW() + INTERVAL 3 MINUTE, 'a41', 'a42', 4)")
    statement.executeUpdate(
      s"INSERT INTO $tableName(column1,column2,column3,column4) VALUES(NOW() + INTERVAL 1 DAY, 'a51', 'a52', 5)")
  }
  @Test
  def testJDBCSourceConnector(): Unit = {
    val connectorName: String = "JDBC-Source-Connector-Test"
    val topicName: String = "topic-test-1"

    Await.result(
      workerClient
        .connectorCreator()
        .name(connectorName)
        .connectorClass(classOf[JDBCSourceConnector])
        .topic(topicName)
        .numberOfTasks(1)
        .configs(props.toMap)
        .disableConverter()
        .create(),
      10 seconds
    )

    val consumer =
      Consumer
        .builder()
        .topicName(topicName)
        .offsetFromBegin()
        .connectionProps(testUtil.brokersConnProps)
        .build(Serializer.BYTES, Serializer.ROW)
    try {
      val record = consumer.poll(java.time.Duration.ofSeconds(30), 3).asScala
      val row0: Row = record.head.value.get
      row0.size shouldBe 4
      row0.cell(0).toString shouldBe Cell.of("column1", "2018-09-01 00:00:00.0").toString
      row0.cell(1) shouldBe Cell.of("column2", "a11")
      row0.cell(2) shouldBe Cell.of("column3", "a12")
      row0.cell(3).toString shouldBe Cell.of("column4", "1").toString

      val row1: Row = record(1).value.get
      row1.size shouldBe 4
      row1.cell(0).toString shouldBe Cell.of("column1", "2018-09-01 00:00:01.0").toString
      row1.cell(1) shouldBe Cell.of("column2", "a21")
      row1.cell(2) shouldBe Cell.of("column3", "a22")
      row1.cell(3).toString shouldBe Cell.of("column4", "2").toString

      val row2: Row = record(2).value.get
      row2.size shouldBe 4
      row2.cell(0).toString shouldBe Cell.of("column1", "2018-09-01 00:00:02.0").toString
      row2.cell(1) shouldBe Cell.of("column2", "a31")
      row2.cell(2) shouldBe Cell.of("column3", "a32")
      row2.cell(3).toString shouldBe Cell.of("column4", "3").toString
      record.size shouldBe 3

    } finally consumer.close()
  }

  private[this] val props = JDBCSourceConnectorConfig(
    Map(DB_URL -> db.url,
        DB_USERNAME -> db.user,
        DB_PASSWORD -> db.password,
        DB_TABLENAME -> tableName,
        TIMESTAMP_COLUMN_NAME -> timestampColumnName,
        DB_SCHEMA_PATTERN -> ""))
}
