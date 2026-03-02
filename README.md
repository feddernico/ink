# ink
Ink is a functional and minimalistic webapp to write documents in markdown and export them.

## Repo Structure

The structure of the repo is as follows:

```
src/
  app.ts         (The app interaction logic in TypeScript)
  tags.ts        (Tag/frontmatter parsing utilities)
  styles.scss    (The app styles, in SCSS)
dist/
  app.min.js
  styles.min.css
ink.template.html  (The HTML template source)
ink-app.html       (The final single-page app, with inline <style> and <script>)
build/
  inject.js
  build.js
  watch.js
  sync-from-ink-app.js
tests/
  qunit/
cypress/
  e2e/
```

## Building Process

The workflow uses `esbuild` and `sass`.

- Build once: `npm run build`
- Build on file changes: `npm run watch`
- Resync sources from current `ink-app.html`: `npm run sync:from-ink-app`
- Makefile wrappers:
  - `make build`
  - `make watch`

The webapp is released as a single HTML file (`ink-app.html`).

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

If `ink-app.html` is manually edited and you want to make it the source again:

1. Run: `npm run sync:from-ink-app`
2. This updates `src/app.ts`, `src/styles.scss`, and `ink.template.html`
3. Run `npm run build` to regenerate minified outputs

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
