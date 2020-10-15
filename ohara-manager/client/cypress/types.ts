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

import { KIND } from '../src/const';

export interface FixtureResponse {
  name: string;
  fileList: FileList;
  file: File;
  group: string;
  tags?: object;
}

export interface ElementParameters {
  name: string;
  kind: KIND.stream | KIND.topic | KIND.source | KIND.sink | KIND.shabondi;
  className?: string;
}

export enum SettingSection {
  topics = 'Topics',
  autofill = 'Autofill',
  zookeeper = 'Zookeeper',
  broker = 'Broker',
  worker = 'Worker',
  stream = 'Stream',
  nodes = 'Nodes',
  files = 'Files',
  dangerZone = 'Danger Zone',
}

export enum CellAction {
  link = 'link',
  config = 'config',
  remove = 'remove',
  start = 'start',
  stop = 'stop',
}
