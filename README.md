# ink
<p align="center">
  <img src="assets/branding/logo.svg" alt="Ink logo" width="128" />
</p>

Ink is a functional and minimalistic webapp to write documents in markdown and export them.

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Sass](https://img.shields.io/badge/Sass-SCSS-CC6699?logo=sass&logoColor=white)
![Vite](https://img.shields.io/badge/Built%20with-Vite-646CFF?logo=vite&logoColor=white)
![Cypress](https://img.shields.io/badge/Tested%20with-Cypress-17202C?logo=cypress&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/Deployed%20on-GitHub%20Pages-222222?logo=github&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Repo Structure

The structure of the repo is as follows:

```
src/
  app.ts         (Thin app entrypoint)
  app/           (Feature modules: app-controller, ui-events, workspace-io, tree-render, dom, fs-api, types)
  tags.ts        (Tag/frontmatter parsing utilities)
  test-support/
    storage-fixture.ts  (Test-only storage helpers)
  styles.scss    (The app styles, in SCSS)
dist/
  app.min.js
  styles.min.css
ink.template.html  (The HTML template source)
ink-app.html       (The final single-page app, with inline <style> and <script>)
build/
  assemble-single-file.js
  compile-and-assemble.js
  build-test.js
  generate-favicons.js
  watch.js
  inject.js  (Compatibility alias)
  build.js   (Compatibility alias)
assets/
  branding/
    logo.svg
    favicon.svg
tests/
  qunit/
cypress/
  e2e/
repomix-output.xml  (This can be used to discuss about the project with an AI chatbot)
```

## Building Process

The workflow uses `esbuild` and `sass`.

- Build once: `npm run build`
- Build on file changes: `npm run watch`
- Makefile wrappers:
  - `make build`
  - `make watch`

The webapp is released as a single HTML file (`ink-app.html`).

Canonical build entrypoint: `build/compile-and-assemble.js` (used by `npm run build`).

## Branding Assets

- Canonical logo source: `assets/branding/logo.svg`
- Generated favicon: `assets/branding/favicon.svg`
- Regenerate favicon after logo updates: `npm run build:favicon`

`npm run build` also regenerates favicon assets before assembling `ink-app.html`.

## Workflow Cheat Sheet

Use this sequence when working on the app:

1. Install dependencies (first time only): `npm install`
2. Edit source files:
   - `src/app.ts`
   - `src/tags.ts`
   - `src/styles.scss`
   - `ink.template.html`
3. Rebuild output: `npm run build`
4. Open/use `ink-app.html`

If you want automatic rebuilds while editing:

1. Run: `npm run watch`
2. Keep editing source files
3. `ink-app.html` will be regenerated after changes

## Testing

Automated testing includes both QUnit and Cypress.

- QUnit: `npm run test:qunit`
- Cypress end-to-end: `npm run test:cypress`
- Full suite: `npm test`

The Cypress flow test verifies:

1. Open/select a workspace
2. Create a new markdown file
3. Enter markdown content
4. Save and verify persisted content

## Keyboard Shortcuts

- **Ctrl/Cmd + E**: Create a new note
- **Ctrl/Cmd + Shift + O**: Open a workspace
- **Ctrl/Cmd + S**: Save the current note
- **Ctrl/Cmd + L**: Refresh the workspace
- **Ctrl/Cmd + Shift + S**: Export all notes as JSON
- **Ctrl/Cmd + Shift + M**: Export the current note as Markdown
