import { INVALID_USER } from '../../src/constants/cypress';
import * as MESSAGES from '../../src/constants/messages';
import * as URLS from '../../src/constants/urls';

describe('Login', () => {
  beforeEach(() => {
    cy.visit(URLS.LOGIN);
  });

  it('goes to login page', () => {
    cy.location('pathname').should('eq', URLS.LOGIN);
  });

  it('shows an error message when log in info is not provided', () => {
    cy.getByText('Login').click();
    cy.get('.toast-error').should('have.length', 1);
  });

  it('shows an error message when logging in with wrong username or password', () => {
    cy.getByTestId('username').type(INVALID_USER.username);
    cy.getByTestId('password').type(INVALID_USER.password);
    cy.getByText('Login').click();
    cy.get('.toast-error').should('have.length', 1);
  });

  it('redirects to home and displays a success message', () => {
    cy.loginWithUi();

    cy.get('.toast-success').should('contain', MESSAGES.LOGIN_SUCCESS);
    cy.location('pathname').should('eq', URLS.PIPELINE);
  });

  it('changes login text based on user login status', () => {
    cy.getByTestId('login-state').should('contain', 'Log in');
    cy.loginWithUi();

    cy.getByTestId('login-state').should('contain', 'Log out');
  });

  it('logs out successfully', () => {
    cy.loginWithUi();

    cy.get('.toast-success').should('contain', MESSAGES.LOGIN_SUCCESS);
    cy.getByTestId('login-state').click({ force: true });

    // TODO: A better way to assert this
    cy.get('.toast-success').should('contain', MESSAGES.LOGOUT_SUCCESS);
    cy.getByTestId('login-state').should('contain', 'Log in');
  });
});
