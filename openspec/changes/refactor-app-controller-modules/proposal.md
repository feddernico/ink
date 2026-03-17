# Change: Modularize app controller and build helpers

## Why
The refactor plan calls for separating the large controller module into explicit feature units and clarifying build/test entrypoints so the codebase stays predictable for LLM maintenance without changing behavior.

## What Changes
- Split `src/app/bootstrap.ts` into small feature modules with explicit interfaces and shared `AppState`.
- Introduce a dedicated `ui-events.ts` to centralize UI wiring and keyboard/menu shortcuts.
- Rename `bootstrap.ts` to a clearer controller name while keeping `src/app.ts` as the entrypoint.
- Add a test build helper and converge on `build/compile-and-assemble.js` as the canonical build entry.

## Impact
- Affected specs: codebase-maintainability
- Affected code: src/app/bootstrap.ts, src/app/*.ts, build/*.js, package.json, README.md
