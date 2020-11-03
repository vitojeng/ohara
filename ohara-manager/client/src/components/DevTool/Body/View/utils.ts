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

import { isObjectLike, isEmpty, isUndefined, isString } from 'lodash';

/**
 * Convert the input value to a string
 * @param {value}
 * @returns string | null
 * @example convertToString(123); // '123'
 * @example convertToString(['a', 'b']); // '["a","b"]'
 * @example convertToString({}); // null
 */
export const convertToString = (value: unknown): string | null => {
  if (isUndefined(value)) return null;
  // Empty Array and Object are not converted
  if (isObjectLike(value) && isEmpty(value)) return null;
  if (isString(value)) return value;
  if (isObjectLike(value)) return JSON.stringify(value);
  return String(value);
};
