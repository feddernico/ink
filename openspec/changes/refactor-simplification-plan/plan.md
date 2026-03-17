# Refactor and Simplification Plan

## Audit Summary (Current Coupling)
- `src/app/bootstrap.ts` (~1335 lines) concentrates UI wiring, state mutation, File System Access API flows, tree rendering, preview rendering, and menu/shortcut behavior in one class. This is the primary coupling hotspot.
- `src/app/dom.ts`, `src/app/fs-api.ts`, `src/app/types.ts`, and `src/app/utils.ts` are already small, stable modules, but the higher-level orchestration still lives in `bootstrap.ts`.
- Build pipeline entry is `build/compile-and-assemble.js`, while `build/build.js` and `build/inject.js` act as compatibility aliases for older names. This creates naming ambiguity without functional separation.
- The test build script (`npm run build:test`) bundles multiple small modules into `dist/test/*` with repeated `esbuild` invocations, which is explicit but manually duplicated.

## High Priority (Safety + Clarity)
1. Split `InkApp` in `src/app/bootstrap.ts` into small feature modules with explicit interfaces.
   - Suggested modules: `menu-actions.ts`, `workspace-io.ts`, `tree-render.ts`, `editor-preview.ts`, `toast-status.ts`, `auto-refresh.ts`.
   - Keep a single `AppState` and pass it explicitly into each module to avoid hidden coupling.
2. Flatten UI event wiring into a dedicated initializer.
   - Move `attachEventListeners`, `attachMenuEventListeners`, and keyboard shortcuts into a `ui-events.ts` module that accepts `DomRefs`, `AppState`, and a small set of action callbacks.
3. Make state transitions explicit and sequential.
   - Extract high-risk mutation flows (open workspace, refresh, save, save-as, close workspace) into functions that return updated state or mutate a specific slice, then re-render.
   - This keeps control flow linear and reduces the chance of side effects crossing feature boundaries.

## Medium Priority (Structure + Naming)
1. Rename `bootstrap.ts` to a clearer responsibility label.
   - Suggested: `app-controller.ts` (or `app-core.ts`) while keeping `src/app.ts` as the only entrypoint.
2. Consolidate build script naming to reduce ambiguity.
   - Choose one canonical entry (`build/compile-and-assemble.js`) and update `README.md` + `openspec/project.md` to reference it.
   - Keep `build/build.js` and `build/inject.js` as temporary aliases only if needed for compatibility.
3. Consolidate repeated `esbuild` calls in `npm run build:test`.
   - Introduce a small build helper (e.g., `build/build-test.js`) that centralizes the esbuild config for test bundles and reduces duplication.

## Low Priority (Cleanup)
1. Re-evaluate `dist/test/*` as committed artifacts.
   - If they are only generated outputs, consider excluding them from source control after verifying no workflows depend on committed copies.
2. Remove tiny utility duplication when the same logic appears in multiple spots.
   - Example targets: repeated toast message formatting, repeated tree render error handling.

## Deletions / Renames / Restructures
- **Rename**: `src/app/bootstrap.ts` -> `src/app/app-controller.ts` (keep `src/app.ts` as entrypoint).
- **Restructure**: Extract feature modules from `bootstrap.ts` into separate files under `src/app/` with explicit, flat function exports.
- **Delete (optional, only after confirming no external usage)**: `build/build.js` and `build/inject.js` once documentation and scripts use the canonical build entry.
- **Restructure**: Move test build steps into a dedicated build helper (e.g., `build/build-test.js`) and have `npm run build:test` call it.

## Areas to Keep Unchanged (Avoid Churn)
- `src/app/dom.ts`, `src/app/fs-api.ts`, `src/app/utils.ts`, `src/app/types.ts` are already narrow and should remain stable.
- `src/app.ts` should remain a tiny entrypoint that delegates to app initialization.
- `build/compile-and-assemble.js` should stay the canonical build pipeline entry unless a larger build redesign is approved.
- `ink.template.html` and `src/styles.scss` should not be refactored during maintainability-only changes.

## Guardrails
- Preserve user-visible behavior (workspace open/save/edit, sidebar interactions, preview rendering) while refactoring.
- Keep build output as a single self-contained `ink-app.html`.
