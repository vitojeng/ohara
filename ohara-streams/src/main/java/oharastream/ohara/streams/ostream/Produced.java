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

package oharastream.ohara.streams.ostream;

public class Produced<K, V> {

  private final Serde<K> key;
  private final Serde<V> value;

  Produced(Serde<K> key, Serde<V> value) {
    this.key = key;
    this.value = value;
  }

  org.apache.kafka.streams.kstream.Produced<K, V> get() {
    return org.apache.kafka.streams.kstream.Produced.with(this.key, this.value);
  }
}
