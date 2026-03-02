## 1. High Priority (Safety + Clarity)
- [x] 1.1 Remove duplicate auto-refresh scheduling and keep one refresh control path.
- [x] 1.2 Remove dead fields/utilities from `src/app.ts` (`searchScanDebounceTimer`, `lastContentSearchToken`, `sleep`, `humanDate`, `debounce`).
- [x] 1.3 Resolve broken `sync:from-ink-app` contract by either restoring `build/sync-from-ink-app.js` or removing stale script/docs.
- [x] 1.4 Split `src/app.ts` into a small entrypoint plus feature modules with explicit interfaces.

## 2. Medium Priority (Structure + Naming)
- [x] 2.1 Rename build scripts/files for clearer responsibility and keep compatibility aliases during migration.
- [x] 2.2 Extract File System Access API logic into a dedicated module.
- [x] 2.3 Replace broad `any` usage in app state/types with narrower interfaces.
- [x] 2.4 Remove redundant element re-queries in app initialization.

## 3. Low Priority (Cleanup)
- [x] 3.1 Decide whether to rename/rehome `src/storage.ts` as test-support-only code.
- [x] 3.2 Decide whether `dist/test/*` should be generated-only and excluded from source control. (Decision: keep committed for now to preserve current repository pattern with generated distribution artifacts under `dist/`.)
- [x] 3.3 Clean minor Cypress scaffolding noise only when it improves maintainability.

## 4. Validation
- [x] 4.1 `npm run build` succeeds and produces a working `ink-app.html`.
- [x] 4.2 `npm run test:qunit` passes.
- [x] 4.3 `npm run test:cypress` passes.
- [x] 4.4 README and script references match actual files/commands.
