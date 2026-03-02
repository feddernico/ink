# Change: LLM-Aligned Maintainability Refactor Plan

## Why
The current codebase works, but it has several maintainability risks that reduce predictability and regenerability for LLM-driven development. The biggest issue is concentration of behavior in one large file, plus stale scripts and dead code paths that make intent harder to reason about.

## What Changes
- Create a phased refactor plan aligned to project coding principles: clarity, pragmatism, rigor.
- Prioritize only high-value changes and explicitly avoid churn where behavior is already clear and stable.
- Define concrete rename/restructure/delete targets backed by repository evidence.
- Add acceptance criteria so refactor work can be verified without changing product behavior.

### High Priority
- Split `src/app.ts` into small feature modules with a thin entrypoint (`main` + feature-oriented files).
- Remove duplicated auto-refresh behavior (currently both `startAutoRefresh()` timer and a separate global `setInterval` run every 10s).
- Fix stale/broken tooling contract: `sync:from-ink-app` references `build/sync-from-ink-app.js`, but the file is missing.
- Remove dead fields/utilities in `src/app.ts`:
  - `searchScanDebounceTimer`
  - `lastContentSearchToken`
  - `sleep()`
  - `humanDate()`
  - `debounce()`

### Medium Priority
- Rename ambiguous build scripts for intent clarity:
  - `build/inject.js` -> `build/assemble-single-file.js`
  - `build/build.js` -> `build/compile-and-assemble.js`
- Extract File System Access API handling into a dedicated module (permissions, handles, scan traversal) to reduce coupling with UI rendering.
- Replace broad `any` usage in app state with narrow interfaces for notes, tree nodes, and workspace handles.
- Remove redundant DOM lookups in `src/app.ts` where elements are already captured once.

### Low Priority
- Decide whether test-only storage logic should be renamed for intent:
  - `src/storage.ts` -> `src/test-support/storage-fixture.ts` (if kept test-only)
- Decide whether generated test bundles should stay committed:
  - `dist/test/*` can be generated during `npm run build:test` and excluded from source control.
- Tighten Cypress scaffolding comments/config only if it improves signal-to-noise (avoid cosmetic edits).

### Keep As-Is (No Change Needed)
- `src/tags.ts` is already small, explicit, and testable.
- Build pipeline remains lightweight and appropriate for single-file distribution constraints.
- Existing QUnit and Cypress coverage should be retained and expanded only around touched refactor areas.

## Impact
- Affected specs: `codebase-maintainability`
- Affected code:
  - `src/app.ts`
  - `src/storage.ts` (rename/rehome decision)
  - `build/build.js`
  - `build/inject.js`
  - `package.json`
  - `README.md`
  - `Makefile` (if command wrappers change)
  - `tests/qunit/*`
  - `cypress/*`
