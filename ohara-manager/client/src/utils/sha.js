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

import sha from 'sha.js';
import { get, join, isEmpty, map } from 'lodash';

const defaultHashOptions = {
  algorithm: 'sha256',
  encode: 'hex',
  maxLength: 8,
};

export const hash = (input = '', options = defaultHashOptions) =>
  sha(options.algorithm)
    .update(input)
    .digest(options.encode)
    .substring(0, options.maxLength + 1);

export const hashBy = (object, paths = []) => {
  if (isEmpty(paths)) throw new Error('The paths must not be an empty.');
  return hash(join(map(paths, path => get(object, path))));
};

export const hashWith = (...args) => hash(join(args));

export const hashByGroupAndName = (group, name) => hash(`${group}${name}`);
