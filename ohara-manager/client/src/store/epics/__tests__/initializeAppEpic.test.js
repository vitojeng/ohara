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

import { keyBy } from 'lodash';
import { TestScheduler } from 'rxjs/testing';

import initializeAppEpic from '../app/initializeAppEpic';
import * as actions from 'store/actions';

import { entities as workspaceEntities } from 'api/__mocks__/workspaceApi';
import { entities as pipelineEntities } from 'api/__mocks__/pipelineApi';

jest.mock('api/workspaceApi');
jest.mock('api/pipelineApi');

const testScheduler = () =>
  new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });

it('initial app correctly', () => {
  testScheduler().run(helpers => {
    const { hot, expectObservable, expectSubscriptions, flush } = helpers;

    const input = '   ^-a-|';
    // 6 frames shift after the latest action
    const expected = '--------(ab|)';
    const subs = '    ^---!';

    const action$ = hot(input, {
      a: {
        type: actions.initializeApp.TRIGGER,
        payload: {},
      },
    });
    const output$ = initializeAppEpic(action$);

    expectObservable(output$).toBe(expected, {
      a: {
        type: actions.initializeApp.SUCCESS,
        payload: {
          entities: {
            pipelines: keyBy(
              pipelineEntities,
              obj => `${obj.group}_${obj.name}`,
            ),
            workspaces: keyBy(
              workspaceEntities,
              obj => `${obj.group}_${obj.name}`,
            ),
          },
          result: pipelineEntities.map(obj => `${obj.group}_${obj.name}`),
        },
      },
      b: {
        type: actions.switchWorkspace.TRIGGER,
        payload: {},
      },
    });

    expectSubscriptions(action$.subscriptions).toBe(subs);

    flush();
  });
});

it('switch to existed workspace correctly', () => {
  testScheduler().run(helpers => {
    const { hot, expectObservable, expectSubscriptions, flush } = helpers;

    const switchData = {
      workspaceName: 'workspace1',
    };
    const input = '   ^-a-|';
    // 6 frames shift after the latest action
    const expected = '--------(ab|)';
    const subs = '    ^---!';

    const action$ = hot(input, {
      a: {
        type: actions.initializeApp.TRIGGER,
        payload: switchData,
      },
    });
    const output$ = initializeAppEpic(action$);

    expectObservable(output$).toBe(expected, {
      a: {
        type: actions.initializeApp.SUCCESS,
        payload: {
          entities: {
            pipelines: keyBy(
              pipelineEntities,
              obj => `${obj.group}_${obj.name}`,
            ),
            workspaces: keyBy(
              workspaceEntities,
              obj => `${obj.group}_${obj.name}`,
            ),
          },
          result: pipelineEntities.map(obj => `${obj.group}_${obj.name}`),
        },
      },
      b: {
        type: actions.switchWorkspace.TRIGGER,
        payload: {
          name: switchData.workspaceName,
        },
      },
    });

    expectSubscriptions(action$.subscriptions).toBe(subs);

    flush();
  });
});

it('switch to existed workspace and pipeline correctly', () => {
  testScheduler().run(helpers => {
    const { hot, expectObservable, expectSubscriptions, flush } = helpers;

    const switchData = {
      workspaceName: 'workspace1',
      pipelineName: 'p1',
    };
    const input = '   ^-a-|';
    // 6 frames shift after the latest action
    const expected = '--------(ab|)';
    const subs = '    ^---!';

    const action$ = hot(input, {
      a: {
        type: actions.initializeApp.TRIGGER,
        payload: switchData,
      },
    });
    const output$ = initializeAppEpic(action$);

    expectObservable(output$).toBe(expected, {
      a: {
        type: actions.initializeApp.SUCCESS,
        payload: {
          entities: {
            pipelines: keyBy(
              pipelineEntities,
              obj => `${obj.group}_${obj.name}`,
            ),
            workspaces: keyBy(
              workspaceEntities,
              obj => `${obj.group}_${obj.name}`,
            ),
          },
          result: pipelineEntities.map(obj => `${obj.group}_${obj.name}`),
        },
      },
      b: {
        type: actions.switchWorkspace.TRIGGER,
        payload: {
          name: switchData.workspaceName,
          pipelineName: switchData.pipelineName,
        },
      },
    });

    expectSubscriptions(action$.subscriptions).toBe(subs);

    flush();
  });
});

it('multiple actions will only used the latest action', () => {
  testScheduler().run(helpers => {
    const { hot, expectObservable, expectSubscriptions, flush } = helpers;

    const switchData = {
      workspaceName: 'workspace1',
      pipelineName: 'p1',
    };
    const input = '   ^-a--b-|';
    // 6 frames shift after the latest action
    const expected = '-----------(ab|)';
    const subs = '    ^------!';

    const action$ = hot(input, {
      a: {
        type: actions.initializeApp.TRIGGER,
        payload: switchData,
      },
      b: {
        type: actions.initializeApp.TRIGGER,
        payload: { ...switchData, workspaceName: 'workspace2' },
      },
    });
    const output$ = initializeAppEpic(action$);

    expectObservable(output$).toBe(expected, {
      a: {
        type: actions.initializeApp.SUCCESS,
        payload: {
          entities: {
            pipelines: keyBy(
              pipelineEntities,
              obj => `${obj.group}_${obj.name}`,
            ),
            workspaces: keyBy(
              workspaceEntities,
              obj => `${obj.group}_${obj.name}`,
            ),
          },
          result: pipelineEntities.map(obj => `${obj.group}_${obj.name}`),
        },
      },
      b: {
        type: actions.switchWorkspace.TRIGGER,
        payload: {
          name: 'workspace2',
          pipelineName: switchData.pipelineName,
        },
      },
    });

    expectSubscriptions(action$.subscriptions).toBe(subs);

    flush();
  });
});