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

import { string, number, array, object } from '../utils/validation';
import { createBody, getCluster } from '../utils/definitionsUtils';

export const request = params => {
  const definitions = getCluster(params);
  const body = createBody(definitions);
  return body;
};

export const response = () => {
  const aliveNodes = [array];
  const state = [string];
  const error = [string];
  const lastModified = [number];
  const settings = [object];

  return { aliveNodes, state, error, lastModified, settings };
};