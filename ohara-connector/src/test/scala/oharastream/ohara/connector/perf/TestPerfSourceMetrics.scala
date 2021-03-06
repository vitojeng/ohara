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

package oharastream.ohara.connector.perf

import oharastream.ohara.client.kafka.ConnectorAdmin
import oharastream.ohara.common.setting.{ConnectorKey, TopicKey}
import oharastream.ohara.common.util.CommonUtils
import oharastream.ohara.metrics.BeanChannel
import oharastream.ohara.testing.WithBrokerWorker
import org.junit.Test
import org.scalatest.Matchers._

import scala.collection.JavaConverters._
import scala.concurrent.Await
import scala.concurrent.duration._
class TestPerfSourceMetrics extends WithBrokerWorker {
  private[this] val connectorAdmin = ConnectorAdmin(testUtil.workersConnProps)

  private[this] val props = PerfSourceProps(
    batch = 5,
    freq = 5 seconds,
    cellSize = 10
  )

  @Test
  def test(): Unit = {
    val topicKey     = TopicKey.of(CommonUtils.randomString(5), CommonUtils.randomString(5))
    val connectorKey = ConnectorKey.of(CommonUtils.randomString(5), CommonUtils.randomString(5))
    Await.result(
      connectorAdmin
        .connectorCreator()
        .topicKey(topicKey)
        .connectorClass(classOf[PerfSource])
        .numberOfTasks(1)
        .connectorKey(connectorKey)
        .settings(props.toMap)
        .create(),
      10 seconds
    )
    CommonUtils.await(() => {
      !BeanChannel.local().counterMBeans().isEmpty
    }, java.time.Duration.ofSeconds(30))
    val counters = BeanChannel.local().counterMBeans()
    counters.size should not be 0
    counters.asScala.foreach { counter =>
      counter.getStartTime should not be 0
      CommonUtils.requireNonEmpty(counter.getUnit)
      CommonUtils.requireNonEmpty(counter.getDocument)
    }
  }
}
