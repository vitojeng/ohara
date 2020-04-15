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

import { TestScheduler } from 'rxjs/testing';

import deleteBrokerEpic from '../broker/deleteBrokerEpic';
import { entity as brokerEntity } from 'api/__mocks__/brokerApi';
import * as actions from 'store/actions';
import { getId } from 'utils/object';

jest.mock('api/brokerApi');

const makeTestScheduler = () =>
  new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });

it('delete broker should be worked correctly', () => {
  makeTestScheduler().run(helpers => {
    const { hot, expectObservable, expectSubscriptions, flush } = helpers;

    const input = '   ^-a        ';
    const expected = '--a 999ms u';
    const subs = '    ^----------';

    const action$ = hot(input, {
      a: {
        type: actions.deleteBroker.TRIGGER,
        payload: brokerEntity,
      },
    });
    const output$ = deleteBrokerEpic(action$);

    expectObservable(output$).toBe(expected, {
      a: {
        type: actions.deleteBroker.REQUEST,
        payload: {
          brokerId: getId(brokerEntity),
        },
      },
      u: {
        type: actions.deleteBroker.SUCCESS,
        payload: {
          brokerId: getId(brokerEntity),
        },
      },
    });

    expectSubscriptions(action$.subscriptions).toBe(subs);

    flush();
  });
});

it('delete multiple brokers should be worked correctly', () => {
  makeTestScheduler().run(helpers => {
    const { hot, expectObservable, expectSubscriptions, flush } = helpers;

    const input = '   ^-ab         ';
    const expected = '--ab 998ms uv';
    const subs = '    ^------------';
    const anotherBrokerEntity = { ...brokerEntity, name: 'bk01' };

    const action$ = hot(input, {
      a: {
        type: actions.deleteBroker.TRIGGER,
        payload: brokerEntity,
      },
      b: {
        type: actions.deleteBroker.TRIGGER,
        payload: anotherBrokerEntity,
      },
    });
    const output$ = deleteBrokerEpic(action$);

    expectObservable(output$).toBe(expected, {
      a: {
        type: actions.deleteBroker.REQUEST,
        payload: {
          brokerId: getId(brokerEntity),
        },
      },
      u: {
        type: actions.deleteBroker.SUCCESS,
        payload: {
          brokerId: getId(brokerEntity),
        },
      },
      b: {
        type: actions.deleteBroker.REQUEST,
        payload: {
          brokerId: getId(anotherBrokerEntity),
        },
      },
      v: {
        type: actions.deleteBroker.SUCCESS,
        payload: {
          brokerId: getId(anotherBrokerEntity),
        },
      },
    });

    expectSubscriptions(action$.subscriptions).toBe(subs);

    flush();
  });
});

it('delete same broker within period should be created once only', () => {
  makeTestScheduler().run(helpers => {
    const { hot, expectObservable, expectSubscriptions, flush } = helpers;

    const input = '   ^-aa 10s a---';
    const expected = '--a 999ms u--';
    const subs = '    ^------------';

    const action$ = hot(input, {
      a: {
        type: actions.deleteBroker.TRIGGER,
        payload: brokerEntity,
      },
    });
    const output$ = deleteBrokerEpic(action$);

    expectObservable(output$).toBe(expected, {
      a: {
        type: actions.deleteBroker.REQUEST,
        payload: {
          brokerId: getId(brokerEntity),
        },
      },
      u: {
        type: actions.deleteBroker.SUCCESS,
        payload: {
          brokerId: getId(brokerEntity),
        },
      },
    });

    expectSubscriptions(action$.subscriptions).toBe(subs);

    flush();
  });
});
