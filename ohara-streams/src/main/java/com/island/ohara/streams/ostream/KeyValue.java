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

package com.island.ohara.streams.ostream;

/**
 * A key-value pair defined for a single record. This class extends from Apache Kafka {@code
 * KeyValue}
 *
 * @param <K> record key type
 * @param <V> record value type
 * @see org.apache.kafka.streams.KeyValue
 */
public class KeyValue<K, V> extends org.apache.kafka.streams.KeyValue<K, V> {
  // TODO : could we not extends the kafka class ?...by Sam

  /**
   * Create a new key-value pair.
   *
   * @param key the key
   * @param value the value
   */
  public KeyValue(K key, V value) {
    super(key, value);
  }
}
