# ink
<p align="center">
  <img src="assets/branding/logo.svg" alt="Ink logo" width="128" />
</p>

Ink is a functional and minimalistic webapp to write documents in markdown and export them.

## Repo Structure

The structure of the repo is as follows:

```
src/
  app.ts         (Thin app entrypoint)
  app/           (Feature modules: bootstrap, dom, fs-api, types)
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
