# ink
<p align="center">
  <img src="assets/branding/logo.svg" alt="Ink logo" width="128" />
</p>

Ink is a functional and minimalistic webapp to write documents in markdown and export them.

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Sass](https://img.shields.io/badge/Sass-SCSS-CC6699?logo=sass&logoColor=white)
![Cypress](https://img.shields.io/badge/Tested%20with-Cypress-17202C?logo=cypress&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/Deployed%20on-GitHub%20Pages-222222?logo=github&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Quick Demo

![](assets/demo/ink-demo.gif)

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
  record-demo.js
  export-demo-assets.js
  generate-favicons.js
  watch.js
  inject.js  (Compatibility alias)
  build.js   (Compatibility alias)
assets/
  branding/
    logo.svg
    favicon.svg
  demo/
    ink-demo.webm
    ink-demo.mp4
    ink-demo.gif
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

## Cogito Writing Assistance

Cogito is the single writing-assistance entrypoint in the top-right menu bar. Its side panel combines:

- **Document strength**: deterministic analysis of clarity, structure, readability, engagement, and section-level priorities. Analysis can be run manually, rerun after edits, navigated by line, and exported as Markdown.
- **Improve with Cogito**: exactly three question-only coaching prompts grounded in the latest sentence. When document analysis is available, Cogito uses a compact summary of its priorities and strengths to focus those questions.

Document analysis does not require the language model. Cogito's local WebLLM model is loaded only when coaching questions are generated, and generated questions are never inserted without an explicit user action.

## Branding Assets

- Canonical logo source: `assets/branding/logo.svg`
- Generated favicon: `assets/branding/favicon.svg`
- Regenerate favicon after logo updates: `npm run build:favicon`

`npm run build` also regenerates favicon assets before assembling `ink-app.html`.

## Demo Capture

The project can record the first-use Ink flow as a reusable video asset:

```bash
npm run demo:record
```

The command starts the local test server, launches headless Chrome against the full Ink viewport, and writes a clean app-only recording to `assets/demo/ink-demo.webm`. When macOS `avconvert` can convert the browser recording, it also writes `assets/demo/ink-demo.mp4`. The demo shows opening a workspace, creating `getting-started.md`, writing markdown slowly, saving, and switching to the rendered preview.

To generate a GIF from the recorded video, install `ffmpeg` and run:

```bash
npm run demo:gif
```

GIF output is written to `assets/demo/ink-demo.gif`. Keep the MP4 as the canonical demo asset because it is smaller and clearer than a full-app GIF.

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
