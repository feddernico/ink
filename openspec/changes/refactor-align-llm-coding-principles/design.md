## Context
Ink is intentionally lightweight and single-file at runtime. The refactor must preserve behavior while making source code easier for LLMs to read, regenerate, and safely modify.

## Goals / Non-Goals
- Goals:
  - Reduce cognitive load in `src/app.ts` by splitting by feature boundaries.
  - Remove stale/dead paths that create false complexity.
  - Improve naming so build and runtime responsibilities are explicit.
  - Keep behavior and user workflow unchanged.
- Non-Goals:
  - Framework migration.
  - UX redesign.
  - New product features.

## Decisions
- Decision: Refactor in phases (High -> Medium -> Low) with behavior-preserving checkpoints.
  - Rationale: minimizes regression risk and keeps scope manageable.
- Decision: Keep a thin composition entrypoint and move concerns into small modules.
  - Rationale: supports predictable regeneration and targeted testing.
- Decision: Do not force changes where current code is already clear (for example `src/tags.ts`).
  - Rationale: avoids churn and preserves momentum.

## Risks / Trade-offs
- Risk: File splits can break implicit state assumptions.
  - Mitigation: define explicit typed state contracts and test around open/save/refresh flows.
- Risk: Renaming scripts can disrupt local habits.
  - Mitigation: keep temporary aliases and document migration in README.

## Migration Plan
1. Remove dead code and duplicate timers in `src/app.ts`.
2. Introduce module boundaries for workspace scan, editor operations, and rendering.
3. Rename build scripts/files with compatibility aliases.
4. Re-run build + QUnit + Cypress and update docs.

## Open Questions
- Should `sync:from-ink-app` be restored (by adding script) or removed from docs/scripts?
- Should `src/storage.ts` remain a test fixture in `src/` or move to a dedicated test-support path?
