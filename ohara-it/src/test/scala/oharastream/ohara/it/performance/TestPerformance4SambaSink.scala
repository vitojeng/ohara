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

package oharastream.ohara.it.performance

import oharastream.ohara.client.configurator.v0.ConnectorApi.ConnectorInfo
import oharastream.ohara.client.configurator.v0.TopicApi.TopicInfo
import oharastream.ohara.common.setting.ConnectorKey
import oharastream.ohara.common.util.CommonUtils
import oharastream.ohara.connector.smb.SmbSink
import oharastream.ohara.it.category.PerformanceGroup
import oharastream.ohara.kafka.connector.csv.CsvConnectorDefinitions
import org.junit.Test
import org.junit.experimental.categories.Category
import spray.json.JsString

@Category(Array(classOf[PerformanceGroup]))
class TestPerformance4SambaSink extends BasicTestPerformance4Samba {
  private[this] val outputDir: String    = "output"
  private[this] var topicInfo: TopicInfo = _

  @Test
  def test(): Unit = {
    topicInfo = createTopic()
    produce(topicInfo, sizeOfInputData)
    setupConnector(
      connectorKey = ConnectorKey.of("benchmark", CommonUtils.randomString(5)),
      className = classOf[SmbSink].getName(),
      settings = sambaSettings
        + (CsvConnectorDefinitions.OUTPUT_FOLDER_KEY -> JsString(createSambaFolder(outputDir)))
    )
    sleepUntilEnd()
  }

  override protected def afterStoppingConnectors(connectorInfos: Seq[ConnectorInfo], topicInfos: Seq[TopicInfo]): Unit =
    if (needDeleteData)
      topicInfos.foreach { topicInfo =>
        val path = s"${outputDir}/${topicInfo.topicNameOnKafka}"
        if (exists(path)) removeSambaFolder(path)
      }

  override protected def afterFrequencySleep(reports: Seq[PerformanceReport]): Unit = {
    produce(topicInfo, sizeOfDurationInputData)
  }
}
