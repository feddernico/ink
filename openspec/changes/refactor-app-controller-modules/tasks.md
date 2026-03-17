## 1. Implementation
- [x] 1.1 Map `InkApp` responsibilities to module boundaries from the refactor plan.
- [x] 1.2 Extract feature modules (menu actions, workspace IO, tree render, editor preview, toast/status, auto-refresh) with explicit exports.
- [x] 1.3 Add `ui-events.ts` to register UI event listeners and shortcuts via injected callbacks.
- [x] 1.4 Rename `bootstrap.ts` to the chosen controller filename and update imports/exports.
- [x] 1.5 Introduce `build/build-test.js` and update `npm run build:test` to use it.
- [x] 1.6 Update documentation to reference `build/compile-and-assemble.js` as the canonical build entry.
- [x] 1.7 Run build/test verification and smoke checks for workspace open/save/preview flows (automated via Cypress).
