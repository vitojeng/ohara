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

import { string, array, number, object, option } from '../utils/validation';

export const request = () => {
  const group = [string];
  const name = [string];
  const endpoints = [array, option];
  const tags = [object, option];

  return {
    name,
    group,
    endpoints,
    tags,
  };
};

export const response = () => {
  const group = [string];
  const name = [string];
  const endpoints = [array];
  const objects = [array];
  const lastModified = [number];
  const tags = [object];

  return {
    group,
    name,
    endpoints,
    objects,
    lastModified,
    tags,
  };
};
