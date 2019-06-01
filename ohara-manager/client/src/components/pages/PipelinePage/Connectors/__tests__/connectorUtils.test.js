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

import * as generate from 'utils/generate';
import * as utils from '../connectorUtils';
describe('getCurrTopicId()', () => {
  it('gets the right topic id', () => {
    const originals = generate.topics(3);

    // set the target to the randomly generated topics
    const target = originals[2];

    const id = utils.getCurrTopicId({ originals, target: target.name });
    expect(id).toBe(target.id);
  });

  it('returns an empty array if param originals is empty', () => {
    const originals = [];
    const target = generate.name();

    const result = utils.getCurrTopicId({ originals, target });
    expect(Array.isArray(result)).toBe(true);
  });

  it('returns any empty array if param target is null', () => {
    const originals = generate.topics(2);
    const target = null;

    const result = utils.getCurrTopicId({ originals, target });
    expect(Array.isArray(result)).toBe(true);
  });

  it('returns an empty array if the given target is == `Please select...`', () => {
    const originals = generate.topics(2);
    const target = 'Please select...';

    const result = utils.getCurrTopicId({ originals, target });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('getCurrTopicName()', () => {
  it('gets the right topic name', () => {
    const originals = generate.topics(3);
    const targetTopic = originals[1];
    const target = [targetTopic.id];

    const topicName = utils.getCurrTopicName({ originals, target });
    expect(topicName).toBe(targetTopic.name);
  });
});

describe('addColumn()', () => {
  it('adds a new column to empty column array', () => {
    const configs = { columns: [] };
    const parentValues = { name: generate.name() };
    const newColumn = generate.columnRows(1);

    const update = utils.addColumn({
      configs,
      update: { ...newColumn[0], parentValues },
    });

    const expected = {
      columns: [
        {
          order: 1,
          name: newColumn[0].columnName,
          newName: newColumn[0].newColumnName,
          dataType: newColumn[0].currType,
        },
      ],
      ...parentValues,
    };
    expect(update).toEqual(expected);
  });

  it('adds a new column to an existing column array', () => {
    const columns = generate.columnRows(2);
    const otherKey = generate.number();
    const configs = { columns, otherKey };
    const parentValues = { name: generate.name() };

    const newColumn = generate.columnRows(1);
    const update = utils.addColumn({
      configs,
      update: { ...newColumn[0], parentValues },
    });

    const expected = {
      columns: [
        ...columns,
        {
          order: 2,
          name: newColumn[0].columnName,
          newName: newColumn[0].newColumnName,
          dataType: newColumn[0].currType,
        },
      ],
      ...parentValues,
    };

    expect(update).toEqual(expected);
  });
});

describe('switchType()', () => {
  it('returns `text` if the given type is `STRING`', () => {
    expect(utils.switchType('STRING')).toBe('text');
  });

  it('returns `number` if the given type is `INT`', () => {
    expect(utils.switchType('INT')).toBe('number');
  });

  it('returns `PASSWORD` if the given type is `password`', () => {
    expect(utils.switchType('PASSWORD')).toBe('password');
  });

  it(`returns null if there's no match`, () => {
    expect(utils.switchType('')).toBe(null);
    expect(utils.switchType(null)).toBe(null);
    expect(utils.switchType(undefined)).toBe(null);
  });
});

describe('changeToken()', () => {
  it('replace token `.` with `_`', () => {
    const values = {
      'abc.efg.dfx.dfs': 'abcefg',
      'nope.nah.sdkl.ljdsf': 'nopenah',
    };

    const expected = {
      abc_efg_dfx_dfs: 'abcefg',
      nope_nah_sdkl_ljdsf: 'nopenah',
    };

    expect(
      utils.changeToken({ values, targetToken: '.', replaceToken: '_' }),
    ).toEqual(expected);
  });

  it('replace token `` with `.`', () => {
    const values = {
      qwe_kjlksd_kjlsjf_dfs: 'sdfxdf',
      nope_nah: 'sdf',
    };

    const expected = {
      'qwe.kjlksd.kjlsjf.dfs': 'sdfxdf',
      'nope.nah': 'sdf',
    };

    expect(
      utils.changeToken({ values, targetToken: '_', replaceToken: '.' }),
    ).toEqual(expected);
  });
});

describe('groupBy()', () => {
  it('returns grouped items', () => {
    const json = [
      { key: 'a', name: 'Name1' },
      { key: 'a', name: 'Name2' },
      { key: 'a', name: 'Name3' },
      { key: 'b', name: 'Name4' },
      { key: 'b', name: 'Name5' },
      { key: 'b', name: 'Name6' },
    ];

    const groupJson = [
      [
        { key: 'a', name: 'Name1' },
        { key: 'a', name: 'Name2' },
        { key: 'a', name: 'Name3' },
      ],
      [
        { key: 'b', name: 'Name4' },
        { key: 'b', name: 'Name5' },
        { key: 'b', name: 'Name6' },
      ],
    ];

    const group = utils.groupBy(json, item => {
      return [item.key];
    });

    expect(group).toEqual(groupJson);
  });
});