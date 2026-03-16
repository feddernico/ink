import "./commands";
import "@cypress/code-coverage/support";

Cypress.on("uncaught:exception", () => false);
