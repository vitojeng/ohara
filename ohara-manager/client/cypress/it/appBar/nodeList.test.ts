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

describe('App Bar', () => {
  before(() => cy.deleteAllServices());

  beforeEach(() => {
    cy.visit('/');

    // Close the intro dialog
    cy.findByTestId('close-intro-button').click();

    // Open node list
    cy.findByTitle(/node list/i)
      .should('exist')
      .click();
  });

  context('Node List', () => {
    it('should be able to add a random node in node list', () => {
      const hostname = generate.serviceName();
      const port = generate.port().toString();
      const userName = generate.userName();
      const password = generate.password();

      // create a node
      cy.findByTitle(/create node/i).click();

      // cancel create node
      cy.findByText('CANCEL').click();

      // Note: we replace this .click() by .trigger() in defaultCommands.ts
      // since the cypress command click could not found the button
      // open again
      cy.findByTitle(/create node/i).click();
      cy.findByLabelText(/hostname/i).type(hostname);
      cy.findByLabelText(/port/i).type(port);
      cy.findByLabelText(/user/i).type(userName);
      cy.findByLabelText(/password/i).type(password);
      cy.findByText('CREATE').click();

      // check the node information
      cy.findByTestId(`view-node-${hostname}`).click();
      cy.findAllByText(/^hostname$/i)
        .filter(':visible')
        .siblings('td')
        .contains(hostname)
        .should('exist');

      // press "ESC" back to node list
      cy.get('body:visible').trigger('keydown', { keyCode: 27, which: 27 });

      // update node user
      const newUserName = generate.userName();
      cy.findByTestId(`edit-node-${hostname}`).click();
      cy.get('input[name=user]').clear().type(newUserName);
      cy.findByText('SAVE').click();

      // check the node information again
      cy.findByTestId(`view-node-${hostname}`).click();
      cy.findAllByText(/^user$/i)
        .filter(':visible')
        .siblings('td')
        .contains(newUserName)
        .should('exist');

      // press "ESC" back to node list
      cy.get('body:visible').trigger('keydown', { keyCode: 27, which: 27 });

      // delete the fake node we just added
      cy.findByTestId(`delete-node-${hostname}`).click();
      // confirm dialog
      cy.findByTestId('confirm-button-DELETE').click();

      // will auto back to node list, and the node list should be empty
      cy.findByText(hostname).should('not.exist');
    });

    it('should able to edit a node', () => {
      const hostname = generate.serviceName();
      const port = generate.port().toString();
      const userName = generate.userName();
      const password = generate.password();

      // create a node
      cy.findByTitle(/create node/i).click();

      cy.findByLabelText(/hostname/i).type(hostname);
      cy.findByLabelText(/port/i).type(port);
      cy.findByLabelText(/user/i).type(userName);
      cy.findByLabelText(/password/i).type(password);
      cy.findByText('CREATE').click();

      // Edit the node
      const newUserName = generate.userName();
      const newPort = generate.port().toString();
      const newPassword = generate.password();
      cy.findByTestId(`edit-node-${hostname}`).click();

      // 1. Assert each field has the correct node info that we used during the creation
      // 2. Update the field with new values
      cy.findByLabelText(/hostname/i)
        .should('have.value', hostname)
        .and('be.disabled'); // hostname field is disabled by design

      cy.findByLabelText(/port/i)
        .should('have.value', port)
        .clear()
        .type(newPort);

      cy.findByLabelText(/user/i)
        .should('have.value', userName)
        .clear()
        .type(newUserName);

      cy.findByLabelText(/password/i)
        .should('have.value', password)
        .clear()
        .type(newPassword);
      cy.findByText('SAVE').click();

      // delete the fake node we just added
      cy.findByTestId(`delete-node-${hostname}`).click();
      // confirm dialog
      cy.findByTestId('confirm-button-DELETE').click();

      // will auto back to node list, and the node list should be empty
      cy.findByText(hostname).should('not.exist');
    });

    it('should able to filter nodes', () => {
      const hostname1 = generate.serviceName();
      cy.findByTitle('Create Node').should('be.visible').click();
      cy.findByLabelText(/hostname/i).type(hostname1);
      cy.findByLabelText(/port/i).type(generate.port().toString());
      cy.findByLabelText(/user/i).type(generate.userName());
      cy.findByLabelText(/password/i).type(generate.password());
      cy.findByText('CREATE').click();
      cy.findByText(hostname1).should('be.visible');

      cy.visit('/');
      cy.findByTestId('close-intro-button').click();
      cy.findByTitle('Node list').should('exist').click();

      const hostname2 = generate.serviceName();
      cy.findByTitle('Create Node').should('be.visible').click();
      cy.findByLabelText(/hostname/i).type(hostname2);
      cy.findByLabelText(/port/i).type(generate.port().toString());
      cy.findByLabelText(/user/i).type(generate.userName());
      cy.findByLabelText(/password/i).type(generate.password());
      cy.findByText('CREATE').click();
      cy.findByText(hostname2).should('be.visible');

      cy.findAllByPlaceholderText('Search').filter(':visible').type(hostname2);

      cy.findByText(hostname1).should('not.exist');
      cy.findByText(hostname2).should('exist');

      cy.findAllByPlaceholderText('Search')
        .filter(':visible')
        .clear()
        .type('fake');

      cy.findByText(hostname1).should('not.exist');
      cy.findByText(hostname2).should('not.exist');
    });

    it(`should not able to remove or edit a node when it's being used`, () => {
      const node = {
        hostname: generate.serviceName(),
        port: generate.port(),
        user: generate.userName(),
        password: generate.password(),
      };

      // create workspace
      cy.createWorkspace({ node });

      // click node list
      cy.findByTitle(/node list/i).click();

      // Since the node is being used by workspace1, the edit and remove buttons should
      // be disabled as well as displaying tooltips telling users why

      // Edit
      cy.findByTestId(`edit-node-${node.hostname}`).should(
        'have.class',
        'Mui-disabled',
      );

      cy.findByTitle(
        'Cannot edit a node which contains running services',
      ).should('exist');

      // Remove
      cy.findByTestId(`delete-node-${node.hostname}`).should(
        'have.class',
        'Mui-disabled',
      );

      cy.findByTitle(
        'Cannot remove a node which contains running services',
      ).should('exist');
    });
  });
});
