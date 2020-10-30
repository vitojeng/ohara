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

import * as generate from '../../../src/utils/generate';
import { generateNodeIfNeeded } from '../../utils';
import { SettingSection, ElementParameters } from '../../types';
import { KIND } from '../../../src/const';
import {
  SOURCE,
  SINK,
} from './../../../src/api/apiInterface/connectorInterface';
describe('Delete workspace', () => {
  const node = generateNodeIfNeeded();

  before(() => {
    cy.deleteAllServices();
    cy.createWorkspace({ node });
  });

  beforeEach(() => cy.visit('/'));

  it('should be able to restart the same name workspace which just removed and re-created', () => {
    // Delete workspace1
    deleteWorkspace();

    // Create a new workspace
    cy.createWorkspace({ node });

    // click restart workspace should be OK
    cy.switchSettingSection(
      SettingSection.dangerZone,
      'Restart this workspace',
    );

    cy.findVisibleDialog().findByText('RESTART').click();

    cy.findVisibleDialog()
      .findByText('CLOSE')
      .parent('button')
      .should('be.enabled')
      .click();

    cy.location('pathname').should('equal', '/workspace1');
  });

  it('should prevent users from deleting a workspace which has running services in pipelines', () => {
    cy.createPipeline();

    const sourceName = generate.serviceName({ prefix: 'source' });
    const topicName = 'T1';

    cy.addElements([
      {
        name: sourceName,
        kind: KIND.source,
        className: SOURCE.perf,
      },
      {
        name: topicName,
        kind: KIND.topic,
      },
    ] as ElementParameters[]);

    cy.createConnections([sourceName, topicName]);
    cy.startPipeline('pipeline1');

    // Go to settings page and delete the workspace
    cy.switchSettingSection(SettingSection.dangerZone, 'Delete this workspace');

    // Should stop users from deleting
    cy.findVisibleDialog().within(() => {
      // The button should be disabled
      cy.findByText('DELETE')
        .parent('button')
        .should('be.disabled')
        .and('have.class', 'Mui-disabled');

      // Some instructions are given to users
      cy.findByText(
        'Oops, there are still some services running in your workspace. You should stop all pipelines under this workspace first and then you will be able to delete this workspace.',
      ).should('exist');
    });

    // clean up
    cy.visit('/');
    cy.stopAndDeleteAllPipelines();
  });

  it('should only delete services running within the workspace, not others', () => {
    const pipeline1 = 'pipeline1';
    const pipeline2 = 'pipeline2';
    const workspace1 = 'workspace1';
    const workspace2 = 'workspace2';

    const sourceName = generate.serviceName({ prefix: 'source' });
    cy.createPipeline(pipeline1);
    cy.addElement({
      name: sourceName,
      kind: KIND.source,
      className: SOURCE.jdbc,
    });

    const sinkName = generate.serviceName({ prefix: 'sink' });
    cy.createWorkspace({ workspaceName: workspace2, node });
    cy.createPipeline(pipeline2);
    cy.addElement({
      name: sinkName,
      kind: KIND.sink,
      className: SINK.smb,
    });

    cy.findByTitle(workspace1).should('exist').click();

    deleteWorkspace();

    cy.findByTitle(workspace1).should('not.exist');

    cy.location('pathname').should('eq', `/${workspace2}/${pipeline2}`);
    cy.findByText(pipeline2).should('exist');
    cy.get('#paper').findByText(sinkName).should('exist');

    // clean up
    cy.stopAndDeleteAllPipelines();
    cy.deleteAllServices();

    // Reset the state, there should be a pre-created workspace available to next test
    cy.createWorkspace({ workspaceName: workspace1, node });
  });

  it('should clean up local state when a workspace is deleted', () => {
    // Create a pipeline and add a ftp source connector
    const pipelineName = generate.serviceName({ prefix: 'pipe' });
    const sourceName = generate.serviceName({ prefix: 'source' });
    cy.createPipeline(pipelineName);

    cy.addElements([
      {
        name: sourceName,
        kind: KIND.source,
        className: SOURCE.ftp,
      },
    ] as ElementParameters[]);

    // Both pipeline and connector should exist
    cy.findByText(pipelineName).should('exist');
    cy.get('#paper').findByText(sourceName).should('exist');

    deleteWorkspace();

    // Create another workspace with the same name. Note that we're not using
    // `cy.createWorkspace` as that command includes a `cy.visit` which will "reload"
    // our app and therefore reset our state
    cy.findByTitle('Create a new workspace').click();
    cy.findByText('QUICK CREATE').should('exist').click();

    // Enter workspace name
    cy.findByDisplayValue('workspace', { exact: false })
      .clear()
      .type('workspace1');

    cy.findAllByText('NEXT').filter(':visible').click();

    // Select a node
    cy.contains('p:visible', 'Click here to select nodes').click();
    cy.addNode(node);

    // Set volume
    cy.findAllByText('NEXT').eq(1).filter(':visible').click();

    // Submit the form and create the workspace
    cy.findAllByText('SUBMIT').filter(':visible').click();

    // Wait until the workspace is created and close the dialog
    cy.findVisibleDialog()
      .findByText('CLOSE')
      .parent('button')
      .should('not.be.disabled')
      .click();

    // Both pipeline and connector should no longer exist
    cy.findByText(pipelineName).should('not.exist');
    cy.get('#paper').findByText(sourceName).should('not.exist');
  });
});

function deleteWorkspace(workspaceName: string | undefined = 'workspace1') {
  // Go to settings page and delete the workspace
  cy.switchSettingSection(SettingSection.dangerZone, 'Delete this workspace');

  // Confirm deletion
  cy.findVisibleDialog().within(() => {
    cy.get('input').type(workspaceName);
    cy.findByText('DELETE').parent('button').should('not.be.disabled').click();
  });

  // Wait until it's completed deleted
  cy.findByText('CLOSE').parent('button').should('not.be.disabled').click();
  cy.findByTestId('delete-workspace-progress-dialog').should('not.visible');
}
