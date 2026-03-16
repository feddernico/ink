import { defineConfig } from "cypress";

export default defineConfig({
  video: false,
  e2e: {
    baseUrl: "http://127.0.0.1:4173",
    specPattern: "cypress/e2e/**/*.cy.js",
    setupNodeEvents(on, config) {
      require("@cypress/code-coverage/task")(on, config);
      return config;
    },
  },
});
