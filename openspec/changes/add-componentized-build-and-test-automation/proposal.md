# Change: Componentized Build Pipeline and Automated Test Coverage

## Why
The current project state does not provide a stable, repeatable workflow for maintaining separate HTML, TypeScript, and SASS sources, and it lacks automated regression tests for critical editor behavior. This makes changes risky and manual verification time-consuming.

## What Changes
- Define a componentized source layout that keeps interaction logic in TypeScript, styles in SASS, and UI structure in an HTML template.
- Define a deterministic build pipeline that compiles TypeScript and SASS into distributable assets and injects them into the single-file app output.
- Define watch-mode and one-shot build commands so developers can rebuild the app whenever files change.
- Add QUnit unit/integration coverage for core application behavior.
- Add Cypress end-to-end coverage for the user flow: selecting a workspace, creating a new file, adding markdown content, and saving.
- Define minimum acceptance checks for local validation before release.

## Impact
- Affected specs: `build-pipeline`, `testing`
- Affected code:
  - `package.json`
  - `Makefile`
  - `src/app.ts`
  - `src/styles.scss`
  - `ink.template.html` (or current HTML template source)
  - `build/inject.js`
  - `dist/` build outputs
  - `tests/qunit/` (new)
  - `cypress/` (new)
