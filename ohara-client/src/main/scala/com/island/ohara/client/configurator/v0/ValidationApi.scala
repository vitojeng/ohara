package com.island.ohara.client.configurator.v0
import spray.json.DefaultJsonProtocol.{jsonFormat1, jsonFormat3, _}
import spray.json.{JsNumber, JsObject, JsString, JsValue, RootJsonFormat}

import scala.concurrent.Future
object ValidationApi {
  val VALIDATION_PREFIX_PATH: String = "validate"
  val VALIDATION_HDFS_PREFIX_PATH: String = "hdfs"
  final case class HdfsValidationRequest(uri: String)
  implicit val HDFS_VALIDATION_REQUEST_JSON_FORMAT: RootJsonFormat[HdfsValidationRequest] = jsonFormat1(
    HdfsValidationRequest)

  val VALIDATION_RDB_PREFIX_PATH: String = "rdb"
  final case class RdbValidationRequest(url: String, user: String, password: String)
  implicit val RDB_VALIDATION_REQUEST_JSON_FORMAT: RootJsonFormat[RdbValidationRequest] = jsonFormat3(
    RdbValidationRequest)

  val VALIDATION_FTP_PREFIX_PATH: String = "ftp"
  final case class FtpValidationRequest(hostname: String, port: Int, user: String, password: String)
  implicit val FTP_VALIDATION_REQUEST_JSON_FORMAT: RootJsonFormat[FtpValidationRequest] =
    new RootJsonFormat[FtpValidationRequest] {
      override def read(json: JsValue): FtpValidationRequest =
        json.asJsObject.getFields("hostname", "port", "user", "password") match {
          case Seq(JsString(hostname), JsNumber(port), JsString(user), JsString(password)) =>
            FtpValidationRequest(hostname, port.toInt, user, password)
          // we will convert a Map[String, String] to FtpValidationRequest in kafka connector so this method can save us from spray's ClassCastException
          // TODO: we should not support the wrong json data... by chia
          case Seq(JsString(hostname), JsString(port), JsString(user), JsString(password)) =>
            FtpValidationRequest(hostname, port.toInt, user, password)
          case _ =>
            throw new UnsupportedOperationException(
              s"invalid format from ${classOf[FtpValidationRequest].getSimpleName}")
        }

      override def write(obj: FtpValidationRequest): JsValue = JsObject(
        "hostname" -> JsString(obj.hostname),
        "port" -> JsNumber(obj.port),
        "user" -> JsString(obj.user),
        "password" -> JsString(obj.password)
      )
    }

  final case class ValidationReport(hostname: String, message: String, pass: Boolean)
  implicit val VALIDATION_REPORT_JSON_FORMAT: RootJsonFormat[ValidationReport] = jsonFormat3(ValidationReport)

  sealed abstract class Access(prefix: String) extends BasicAccess(prefix) {
    def verify(request: HdfsValidationRequest): Future[Seq[ValidationReport]]
    def verify(request: RdbValidationRequest): Future[Seq[ValidationReport]]
    def verify(request: FtpValidationRequest): Future[Seq[ValidationReport]]
  }

  def access(): Access = new Access(VALIDATION_PREFIX_PATH) {
    private[this] def url(prefix: String): String = s"http://${_hostname}:${_port}/${_version}/${_prefixPath}/$prefix"
    override def verify(request: HdfsValidationRequest): Future[Seq[ValidationReport]] =
      exec.put[HdfsValidationRequest, Seq[ValidationReport]](url(VALIDATION_HDFS_PREFIX_PATH), request)
    override def verify(request: RdbValidationRequest): Future[Seq[ValidationReport]] =
      exec.put[RdbValidationRequest, Seq[ValidationReport]](url(VALIDATION_RDB_PREFIX_PATH), request)
    override def verify(request: FtpValidationRequest): Future[Seq[ValidationReport]] =
      exec.put[FtpValidationRequest, Seq[ValidationReport]](url(VALIDATION_FTP_PREFIX_PATH), request)
  }
}
