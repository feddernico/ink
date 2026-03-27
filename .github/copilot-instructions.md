# Copilot Instructions

- Maintainability work should follow the refactor plan in `openspec/changes/refactor-simplification-plan/plan.md`.
- The refactor implementation proposal lives in `openspec/changes/refactor-app-controller-modules/` and should be followed before touching app controller or build scripts.
- Prefer small, explicit modules with flat control flow and minimal indirection.
- Keep `src/app.ts` as a tiny entrypoint and preserve single-file build output (`ink-app.html`).
- Regression coverage for refactor-sensitive flows lives in `cypress/e2e/workspace-actions.cy.js` and `tests/qunit/fs-api.test.js`.
- The app controller is in `src/app/app-controller.ts`, with UI wiring in `src/app/ui-events.ts` and workspace flows in `src/app/workspace-io.ts`.
- Keyboard shortcut precedence lives in `src/app/ui-events.ts`; editor-scoped handlers must not swallow longer chords like Cmd/Ctrl+Shift+S that are reserved for export.
- Test bundles are built via `build/build-test.js`.
- Dependency security overrides live in `package.json` under `overrides` (immutable pinned to 5.1.5+).
- GitHub workflows should stay triggerable for PRs and use job-level docs-only gating rather than workflow-level path filters so required checks do not remain pending.
- Contributor-facing workflow and validation steps now live in `CONTRIBUTING.md`; keep build, test, and single-file output guidance aligned with that document when project workflows change.
- Declarative WebMCP note creation lives in the `#webmcpNoteForm` form in `ink.template.html`; keep its submit path wired to `createNoteFromTool()` in `src/app/workspace-io.ts` so agent-invoked note creation stays in the single-page app and does not navigate away.
