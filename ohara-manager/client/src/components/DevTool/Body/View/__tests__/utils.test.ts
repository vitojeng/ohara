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

import { convertToString } from '../utils';

it('should convert primitive value and `null` to string', () => {
  const num = 1;
  const str = 'abc';
  const truthy = true;
  const falsy = false;

  const nul = null;

  expect(convertToString(num)).toBe('1');
  expect(convertToString(str)).toBe('abc');
  expect(convertToString(truthy)).toBe('true');
  expect(convertToString(falsy)).toBe('false');

  expect(convertToString(nul)).toBe('null');
});

it('should return null when `undefined` is supplied', () => {
  expect(convertToString(undefined)).toBe(null);
});

it('should render structured value like object and array', () => {
  const obj = { a: 1, b: 'b' };
  const arr = ['a', 'b'];
  expect(convertToString(obj)).toBe('{"a":1,"b":"b"}');
  expect(convertToString(arr)).toBe('["a","b"]');
});

it('should return null when an empty object and array are given', () => {
  expect(convertToString({})).toBe(null);
  expect(convertToString([])).toBe(null);
});
