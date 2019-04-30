package com.island.ohara.shabondi

import akka.http.scaladsl.model.HttpRequest
import akka.http.scaladsl.testkit.ScalatestRouteTest
import com.island.ohara.common.rule.SmallTest
import org.junit.Test
import org.scalatest.concurrent.ScalaFutures
import org.scalatest.{Matchers, Suite}

class TestWebServer extends SmallTest with Matchers with Suite with ScalaFutures with ScalatestRouteTest {

  @Test
  def testSimple(): Unit = {
    val request = HttpRequest(uri = "/hello")

    request ~> WebServer.route ~> check {
      entityAs[String] should ===("<h2>Hello akka-http</h1>")
    }

  }
}
