# Copilot Instructions

- Maintainability work should follow the refactor plan in `openspec/changes/refactor-simplification-plan/plan.md`.
- The refactor implementation proposal lives in `openspec/changes/refactor-app-controller-modules/` and should be followed before touching app controller or build scripts.
- Prefer small, explicit modules with flat control flow and minimal indirection.
- Keep `src/app.ts` as a tiny entrypoint and preserve single-file build output (`ink-app.html`).
- Local git hooks are tracked under `.githooks/`; keep lint-plus-repomix pre-commit automation there and point setup docs at `git config core.hooksPath .githooks` instead of ad hoc hook creation snippets.
- Regression coverage for refactor-sensitive flows lives in `cypress/e2e/workspace-actions.cy.js` and `tests/qunit/fs-api.test.js`.
- The app controller is in `src/app/app-controller.ts`, with UI wiring in `src/app/ui-events.ts` and workspace flows in `src/app/workspace-io.ts`.
- Top menu visuals are authored directly in `ink.template.html`; when adding icons to dropdown rows, keep the text in a nested `.menu-label-text` span so dynamic updates like the Sort label do not remove the icon.
- Keyboard shortcut precedence lives in `src/app/ui-events.ts`; editor-scoped handlers must not swallow longer chords like Cmd/Ctrl+Shift+S that are reserved for export.
- Test bundles are built via `build/build-test.js`.
- Dependency security overrides live in `package.json` under `overrides` (immutable pinned to 5.1.5+).
- GitHub workflows should stay triggerable for PRs and use job-level docs-only gating rather than workflow-level path filters so required checks do not remain pending.
- The release workflow must keep `package.json` and `package-lock.json` versions aligned with the generated GitHub release tag before creating the tag and release.
- Contributor-facing workflow and validation steps now live in `CONTRIBUTING.md`; keep build, test, and single-file output guidance aligned with that document when project workflows change.
- Cogito Mode work is tracked in `openspec/changes/add-cogito-mode/`; preserve the strict three-question JSON contract and the markdown insertion block format (`> ### AI` then question text) when implementing it.
- Cogito Mode entrypoint must be a top-right menu bar button using a thinking-man glyphicon with accessible Cogito labeling.
- Cogito runtime integration lives in `src/app/cogito.ts`; keep the prompt contract and JSON parsing helpers (`extractLastSentence`, `parseCogitoQuestionPayload`, `formatCogitoQuestionBlock`) stable and covered by QUnit tests.
- Cypress end-to-end coverage for Cogito uses a test-only `globalThis.__INK_TEST_WEBLLM__` override; preserve that seam so the full panel/generate/insert flow remains deterministic under test.
