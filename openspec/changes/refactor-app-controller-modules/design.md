## Context
The refactor plan identifies `src/app/bootstrap.ts` as a coupling hotspot that mixes UI wiring, state mutation, File System Access API flows, and rendering. The build/test scripts also have ambiguous naming and duplicated configuration.

## Goals / Non-Goals
- Goals:
  - Decompose the controller into explicit feature modules with clear boundaries.
  - Keep state transitions linear and explicit through shared `AppState`.
  - Clarify build and test entrypoints while preserving single-file output.
- Non-Goals:
  - Change user-visible behavior, UI layout, or feature set.
  - Introduce new dependencies or build frameworks.

## Decisions
- Decision: Keep a single `AppState` object and pass it explicitly into modules.
- Decision: Centralize event registration in `ui-events.ts` with injected callbacks.
- Decision: Preserve `src/app.ts` as the sole entrypoint and rename the controller file only.
- Decision: Add a `build/build-test.js` helper to own test bundle configuration.

## Risks / Trade-offs
- Risk: Refactor could introduce regressions in shortcuts or file system flows.
  - Mitigation: Manual smoke testing of open/save/refresh and menu shortcuts after each extraction.

## Migration Plan
1. Extract modules one by one, keeping the controller as an orchestration layer.
2. Rename the controller file and update imports once module boundaries are stable.
3. Update build/test scripts and documentation last to avoid churn.

## Open Questions
- Resolved: use `app-controller.ts` as the controller filename.
