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

import startWorkerEpic from '../../worker/startWorkerEpic';
import * as workerApi from 'api/workerApi';
import { entity as workerEntity } from 'api/__mocks__/workerApi';
import * as actions from 'store/actions';
import { getId } from 'utils/object';
import { SERVICE_STATE } from 'api/apiInterface/clusterInterface';
import { of } from 'rxjs';

jest.mock('api/workerApi');

const wkId = getId(workerEntity);

const makeTestScheduler = () =>
  new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });

beforeEach(() => {
  // ensure the mock data is as expected before each test
  jest.restoreAllMocks();
});

it('start worker should be worked correctly', () => {
  makeTestScheduler().run(helpers => {
    const { hot, expectObservable, expectSubscriptions, flush } = helpers;

    const input = '   ^-a        ';
    const expected = '--a 499ms v';
    const subs = '    ^----------';

    const action$ = hot(input, {
      a: {
        type: actions.startWorker.TRIGGER,
        payload: workerEntity,
      },
    });
    const output$ = startWorkerEpic(action$);

    expectObservable(output$).toBe(expected, {
      a: {
        type: actions.startWorker.REQUEST,
        payload: {
          workerId: wkId,
        },
      },
      v: {
        type: actions.startWorker.SUCCESS,
        payload: {
          workerId: wkId,
          entities: {
            workers: {
              [wkId]: { ...workerEntity, state: 'RUNNING' },
            },
          },
          result: wkId,
        },
      },
    });

    expectSubscriptions(action$.subscriptions).toBe(subs);

    flush();
  });
});

it('start worker failed after reach retry limit', () => {
  // mock a 20 times "failed started" results
  const spyGet = jest.spyOn(workerApi, 'get');
  for (let i = 0; i < 20; i++) {
    spyGet.mockReturnValueOnce(
      of({
        status: 200,
        title: 'retry mock get data',
        data: {},
      }),
    );
  }
  // get result finally
  spyGet.mockReturnValueOnce(
    of({
      status: 200,
      title: 'retry mock get data',
      data: { ...workerEntity, state: SERVICE_STATE.RUNNING },
    }),
  );

  makeTestScheduler().run(helpers => {
    const { hot, expectObservable, expectSubscriptions, flush } = helpers;

    const input = '   ^-a          ';
    // we failed after retry 11 times (11 * 2000ms = 22s)
    const expected = '--a 21999ms v';
    const subs = '    ^------------';

    const action$ = hot(input, {
      a: {
        type: actions.startWorker.TRIGGER,
        payload: workerEntity,
      },
    });
    const output$ = startWorkerEpic(action$);

    expectObservable(output$).toBe(expected, {
      a: {
        type: actions.startWorker.REQUEST,
        payload: {
          workerId: wkId,
        },
      },
      v: {
        type: actions.startWorker.FAILURE,
        payload: 'exceed max retry times',
      },
    });

    expectSubscriptions(action$.subscriptions).toBe(subs);

    flush();
  });
});

it('start worker multiple times should be worked once', () => {
  makeTestScheduler().run(helpers => {
    const { hot, expectObservable, expectSubscriptions, flush } = helpers;

    const input = '   ^-a---a 1s a 10s ';
    const expected = '--a       499ms v';
    const subs = '    ^----------------';

    const action$ = hot(input, {
      a: {
        type: actions.startWorker.TRIGGER,
        payload: workerEntity,
      },
    });
    const output$ = startWorkerEpic(action$);

    expectObservable(output$).toBe(expected, {
      a: {
        type: actions.startWorker.REQUEST,
        payload: {
          workerId: wkId,
        },
      },
      v: {
        type: actions.startWorker.SUCCESS,
        payload: {
          workerId: wkId,
          entities: {
            workers: {
              [wkId]: { ...workerEntity, state: 'RUNNING' },
            },
          },
          result: wkId,
        },
      },
    });

    expectSubscriptions(action$.subscriptions).toBe(subs);

    flush();
  });
});

it('start different worker should be worked correctly', () => {
  makeTestScheduler().run(helpers => {
    const { hot, expectObservable, expectSubscriptions, flush } = helpers;

    const anotherWorkerEntity = {
      ...workerEntity,
      name: 'anotherwk',
      group: 'default',
      xms: 1111,
      xmx: 2222,
      clientPort: 3333,
    };
    const input = '   ^-a--b           ';
    const expected = '--a--b 496ms y--z';
    const subs = '    ^----------------';

    const action$ = hot(input, {
      a: {
        type: actions.startWorker.TRIGGER,
        payload: workerEntity,
      },
      b: {
        type: actions.startWorker.TRIGGER,
        payload: anotherWorkerEntity,
      },
    });
    const output$ = startWorkerEpic(action$);

    expectObservable(output$).toBe(expected, {
      a: {
        type: actions.startWorker.REQUEST,
        payload: {
          workerId: wkId,
        },
      },
      b: {
        type: actions.startWorker.REQUEST,
        payload: {
          workerId: getId(anotherWorkerEntity),
        },
      },
      y: {
        type: actions.startWorker.SUCCESS,
        payload: {
          workerId: wkId,
          entities: {
            workers: {
              [wkId]: { ...workerEntity, state: 'RUNNING' },
            },
          },
          result: wkId,
        },
      },
      z: {
        type: actions.startWorker.SUCCESS,
        payload: {
          workerId: getId(anotherWorkerEntity),
          entities: {
            workers: {
              [getId(anotherWorkerEntity)]: {
                ...anotherWorkerEntity,
                state: 'RUNNING',
              },
            },
          },
          result: getId(anotherWorkerEntity),
        },
      },
    });

    expectSubscriptions(action$.subscriptions).toBe(subs);

    flush();
  });
});
