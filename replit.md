# Ink - Markdown Editor Web App

## Overview
Ink is a functional and minimalistic single-page web application for writing documents in markdown and exporting them.

## Architecture
- **Type**: Static frontend-only SPA (no backend)
- **Language**: TypeScript (compiled via esbuild)
- **Styles**: SCSS (compiled via sass)
- **Output**: Single HTML file (`ink-app.html`) with all JS and CSS inlined

## Project Structure
- `src/app.ts` - App entrypoint
- `src/app/` - Feature modules (bootstrap, dom, fs-api, types)
- `src/tags.ts` - Tag/frontmatter parsing utilities
- `src/styles.scss` - SCSS styles
- `ink.template.html` - HTML template source
- `ink-app.html` - Final built single-page app (served directly)
- `build/` - Build scripts (esbuild + sass)
- `dist/` - Intermediate compiled output
- `assets/branding/` - Logo and favicon SVGs

## Build
```bash
npm install
npm run build       # One-time build
npm run watch       # Auto-rebuild on changes
```

## Serving (Development)
Workflow "Start application" runs:
```
npx http-server . -p 5000 -s
```
App is accessible at: `http://localhost:5000/ink-app.html`

## Deployment
- Target: Static site
- Build command: `npm run build`
- Public directory: `.` (root, serves `ink-app.html`)

## Testing
- QUnit unit tests: `npm run test:qunit`
- Cypress e2e tests: `npm run test:cypress`
- Full suite: `npm test`
