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

package oharastream.ohara.configurator

import oharastream.ohara.client.configurator.v0.{
  BrokerApi,
  ConnectorApi,
  FileInfoApi,
  PipelineApi,
  StreamApi,
  TopicApi,
  WorkerApi
}
import oharastream.ohara.common.data.Serializer
import oharastream.ohara.common.util.{CommonUtils, Releasable}
import oharastream.ohara.configurator.route.RouteUtils
import oharastream.ohara.kafka.Producer
import oharastream.ohara.metrics.BeanChannel
import oharastream.ohara.testing.WithBrokerWorker
import org.junit.{After, Test}
import org.scalatest.Matchers._
import spray.json.{JsNumber, JsString}

import scala.collection.JavaConverters._
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.duration._
import scala.concurrent.{Await, Future}
class TestMetrics extends WithBrokerWorker {
  private[this] val configurator =
    Configurator.builder.fake(testUtil.brokersConnProps, testUtil().workersConnProps()).build()

  private[this] val connectorApi = ConnectorApi.access.hostname(configurator.hostname).port(configurator.port)
  private[this] val topicApi     = TopicApi.access.hostname(configurator.hostname).port(configurator.port)
  private[this] val streamApi    = StreamApi.access.hostname(configurator.hostname).port(configurator.port)
  private[this] val fileApi      = FileInfoApi.access.hostname(configurator.hostname).port(configurator.port)

  private[this] val workerClusterInfo = result(
    WorkerApi.access.hostname(configurator.hostname).port(configurator.port).list()
  ).head

  private[this] val nodeNames = workerClusterInfo.nodeNames

  private[this] def result[T](f: Future[T]): T = Await.result(f, 15 seconds)

  private[this] def assertNoMetricsForTopic(topicId: String): Unit =
    CommonUtils.await(
      () => BeanChannel.local().topicMeters().asScala.count(_.topicName() == topicId) == 0,
      java.time.Duration.ofSeconds(20)
    )

  @Test
  def testTopic(): Unit = {
    val topic = result(
      topicApi.request
        .name(CommonUtils.randomString(10))
        .brokerClusterKey(
          result(BrokerApi.access.hostname(configurator.hostname).port(configurator.port).list()).head.key
        )
        .create()
    )
    result(topicApi.start(topic.key))
    val producer = Producer
      .builder()
      .connectionProps(testUtil().brokersConnProps())
      .keySerializer(Serializer.STRING)
      .valueSerializer(Serializer.STRING)
      .build()
    try {
      producer
        .sender()
        .topicName(topic.key.topicNameOnKafka)
        .key(CommonUtils.randomString())
        .value(CommonUtils.randomString())
        .send()
        .get()
    } finally producer.close()

    CommonUtils.await(
      () => {
        val meters = result(topicApi.get(topic.key)).metrics.meters
        // metrics should have queryTime also
        meters.nonEmpty && meters.head.queryTime > 0
      },
      java.time.Duration.ofSeconds(20)
    )

    result(topicApi.stop(topic.key))
    result(topicApi.delete(topic.key))

    assertNoMetricsForTopic(topic.name)
  }

  @Test
  def testConnector(): Unit = {
    val topic = result(
      topicApi.request
        .name(CommonUtils.randomString(10))
        .brokerClusterKey(
          result(BrokerApi.access.hostname(configurator.hostname).port(configurator.port).list()).head.key
        )
        .create()
    )
    result(topicApi.start(topic.key))

    val sink = result(
      connectorApi.request
        .name(CommonUtils.randomString(10))
        .className(classOf[FallibleSink].getName)
        .topicKey(topic.key)
        .numberOfTasks(1)
        .workerClusterKey(workerClusterInfo.key)
        .create()
    )

    sink.metrics.meters.size shouldBe 0

    result(connectorApi.start(sink.key))

    CommonUtils.await(
      () => {
        val meters = result(connectorApi.get(sink.key)).metrics.meters
        // custom metrics should have queryTime and startTime also
        meters.nonEmpty &&
        meters.head.queryTime > 0 &&
        meters.head.startTime.isDefined &&
        meters.head.lastModified.isDefined &&
        meters.head.valueInPerSec.isDefined
      },
      java.time.Duration.ofSeconds(20)
    )

    result(connectorApi.stop(sink.key))

    CommonUtils.await(() => {
      result(connectorApi.get(sink.key)).metrics.meters.isEmpty
    }, java.time.Duration.ofSeconds(20))
  }

  @Test
  def testPipeline(): Unit = {
    val topicName = CommonUtils.randomString(10)
    val topic = result(
      topicApi.request
        .name(topicName)
        .brokerClusterKey(
          result(BrokerApi.access.hostname(configurator.hostname).port(configurator.port).list()).head.key
        )
        .create()
    )
    result(topicApi.start(topic.key))

    val sink = result(
      connectorApi.request
        .name(CommonUtils.randomString(10))
        .className(classOf[FallibleSink].getName)
        .topicKey(topic.key)
        .numberOfTasks(1)
        .workerClusterKey(workerClusterInfo.key)
        .create()
    )

    val pipelineApi = PipelineApi.access.hostname(configurator.hostname).port(configurator.port)

    val pipeline = result(
      pipelineApi.request.name(CommonUtils.randomString(10)).endpoint(topic).endpoint(sink).create()
    )

    pipeline.objects.filter(_.key == sink.key).head.metrics.meters.size shouldBe 0
    result(connectorApi.start(sink.key))

    // the connector is running so we should "see" the beans.
    CommonUtils.await(
      () => result(pipelineApi.get(pipeline.key)).objects.filter(_.key == sink.key).head.metrics.meters.nonEmpty,
      java.time.Duration.ofSeconds(20)
    )

    result(connectorApi.stop(sink.key))

    // the connector is stopped so we should NOT "see" the beans.
    CommonUtils.await(
      () => result(pipelineApi.get(pipeline.key)).objects.filter(_.key == sink.key).head.metrics.meters.isEmpty,
      java.time.Duration.ofSeconds(20)
    )
  }

  @Test
  def testTopicMeterInPerfSource(): Unit = {
    val topicName = CommonUtils.randomString(10)
    val topic = result(
      topicApi.request
        .name(topicName)
        .brokerClusterKey(
          result(BrokerApi.access.hostname(configurator.hostname).port(configurator.port).list()).head.key
        )
        .create()
    )
    result(topicApi.start(topic.key))

    val source = result(
      connectorApi.request
        .name(CommonUtils.randomString(10))
        .className("oharastream.ohara.connector.perf.PerfSource")
        .topicKey(topic.key)
        .numberOfTasks(1)
        .settings(
          Map("perf.batch" -> JsNumber(1), "perf.frequence" -> JsString(java.time.Duration.ofSeconds(1).toString))
        )
        .workerClusterKey(workerClusterInfo.key)
        .create()
    )

    val pipelineApi = PipelineApi.access.hostname(configurator.hostname).port(configurator.port)

    val pipeline = result(
      pipelineApi.request.name(CommonUtils.randomString(10)).endpoint(topic).endpoint(source).create()
    )

    pipeline.objects.filter(_.key == source.key).head.metrics.meters.size shouldBe 0
    result(connectorApi.start(source.key))

    // the connector is running so we should "see" the beans.
    CommonUtils.await(
      () => result(pipelineApi.get(pipeline.key)).objects.filter(_.key == source.key).head.metrics.meters.nonEmpty,
      java.time.Duration.ofSeconds(20)
    )

    CommonUtils.await(
      () => result(pipelineApi.get(pipeline.key)).objects.filter(_.key == topic.key).head.metrics.meters.nonEmpty,
      java.time.Duration.ofSeconds(20)
    )

    result(connectorApi.stop(source.key))

    // the connector is stopped so we should NOT "see" the beans.
    CommonUtils.await(
      () => result(pipelineApi.get(pipeline.key)).objects.filter(_.key == source.key).head.metrics.meters.isEmpty,
      java.time.Duration.ofSeconds(20)
    )

    // remove topic
    result(connectorApi.delete(source.key))
    CommonUtils.await(
      () => !result(pipelineApi.get(pipeline.key)).objects.exists(_.key == source.key),
      java.time.Duration.ofSeconds(30)
    )
  }

  @Test
  def testStreamMeterInPipeline(): Unit = {
    val wkInfo  = result(configurator.serviceCollie.workerCollie.clusters()).head
    val jar     = RouteUtils.streamFile
    val jarInfo = result(fileApi.request.file(jar).group(wkInfo.name).upload())
    jarInfo.name shouldBe jar.getName

    val t1 = result(
      topicApi.request
        .name(CommonUtils.randomString(10))
        .brokerClusterKey(
          result(BrokerApi.access.hostname(configurator.hostname).port(configurator.port).list()).head.key
        )
        .create()
    )
    val t2 = result(
      topicApi.request
        .name(CommonUtils.randomString(10))
        .brokerClusterKey(
          result(BrokerApi.access.hostname(configurator.hostname).port(configurator.port).list()).head.key
        )
        .create()
    )
    result(topicApi.start(t1.key))
    result(topicApi.start(t2.key))

    val stream = result(
      streamApi.request
        .jarKey(jarInfo.key)
        .fromTopicKey(t1.key)
        .toTopicKey(t2.key)
        .brokerClusterKey(
          result(BrokerApi.access.hostname(configurator.hostname).port(configurator.port).list()).head.key
        )
        .nodeNames(nodeNames)
        .create()
    )

    val pipelineApi = PipelineApi.access.hostname(configurator.hostname).port(configurator.port)

    val pipeline = result(
      pipelineApi.request
        .name(CommonUtils.randomString(10))
        .endpoint(t1)
        .endpoint(t2)
        .endpoint(stream)
        .create()
    )

    pipeline.objects.filter(_.key == stream.key).head.metrics.meters.size shouldBe 0

    result(streamApi.start(stream.key))
    // the stream is running so we should "see" the beans.
    CommonUtils.await(
      () => result(pipelineApi.get(pipeline.key)).objects.filter(_.key == stream.key).head.metrics.meters.nonEmpty,
      java.time.Duration.ofSeconds(20)
    )

    result(streamApi.stop(stream.key))
    // the stream is stopped so we should NOT "see" the beans.
    CommonUtils.await(
      () => result(pipelineApi.get(pipeline.key)).objects.filter(_.key == stream.key).head.metrics.meters.isEmpty,
      java.time.Duration.ofSeconds(20)
    )
  }

  @After
  def tearDown(): Unit = Releasable.close(configurator)
}
