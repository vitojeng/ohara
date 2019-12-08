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

package com.island.ohara.connector.perf
import com.island.ohara.common.annotations.VisibleForTesting
import com.island.ohara.common.data.Column
import com.island.ohara.common.util.CommonUtils
import com.island.ohara.kafka.connector.{RowSourceRecord, RowSourceTask, TaskSetting}

import scala.collection.JavaConverters._

class PerfSourceTask extends RowSourceTask {
  private[this] var props: PerfSourceProps = _
  private[this] var topics: Seq[String]    = _
  @VisibleForTesting
  private[perf] var schema: Seq[Column] = _
  private[this] var lastPoll: Long      = -1
  @VisibleForTesting
  override protected def _start(settings: TaskSetting): Unit = {
    this.props = PerfSourceProps(settings)
    this.topics = settings.topicNames().asScala
    this.schema = settings.columns.asScala
    if (schema.isEmpty) schema = DEFAULT_SCHEMA
  }

  override protected def _stop(): Unit = {}

  override protected def _poll(): java.util.List[RowSourceRecord] = {
    val current = CommonUtils.current()
    if (current - lastPoll > props.freq.toMillis) {
      val records = topics.map(RowSourceRecord.builder().row(row(schema)).topicName(_).build())
      lastPoll = current
      (0 until props.batch).flatMap(_ => records).asJava
    } else Seq.empty.asJava
  }
}
