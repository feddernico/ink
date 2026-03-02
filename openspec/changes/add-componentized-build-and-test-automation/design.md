## Context
Ink targets a single-file HTML distribution while development should remain modular and maintainable. The desired workflow requires clear source separation (TypeScript, SASS, HTML template), predictable build outputs, and automated tests that guard core document editing behavior.

## Goals / Non-Goals
- Goals:
  - Keep source-of-truth files separated by concern: logic, presentation, and template markup.
  - Preserve single-file distributable output for runtime usage.
  - Provide reliable local build and test commands.
  - Cover the critical authoring flow with both fast in-browser tests (QUnit) and browser-driven tests (Cypress).
- Non-Goals:
  - Migrating to a framework (React/Vue/etc.).
  - Introducing a backend service.
  - Redesigning editor UX beyond what is required for testability and flow support.

## Decisions
- Decision: Use TypeScript compilation via existing `esbuild` and SASS compilation via `sass`, with a final injection step into a template file.
  - Rationale: aligns with current lightweight toolchain and single-file output constraint.
- Decision: Expose build commands through `npm scripts` and keep `Makefile` as optional convenience wrapper.
  - Rationale: `npm scripts` are portable and integrate well with QUnit/Cypress commands.
- Decision: Add QUnit tests for app-level behaviors that do not require full browser orchestration.
  - Rationale: fast feedback for logic and DOM interactions.
- Decision: Add Cypress tests for full user workflow and persistence interactions.
  - Rationale: validates user-visible behavior across realistic browser execution.

## Risks / Trade-offs
- Tooling overhead increases with dual test frameworks.
  - Mitigation: keep QUnit focused on fast logic checks; reserve Cypress for key end-to-end flows.
- Workspace/file APIs can be difficult to test directly in browsers.
  - Mitigation: define test seams and controlled fixtures/stubs for deterministic execution.

## Migration Plan
1. Introduce source file structure and build scripts aligned with README conventions.
2. Ensure one-shot and watch build commands generate expected dist artifacts and single-file output.
3. Add QUnit harness and baseline test suite.
4. Add Cypress project config and e2e scenario for workspace→new file→edit→save.
5. Update documentation with developer commands and required prerequisites.

## Open Questions
- Should Cypress execute against a local static server command defined in `package.json`, or an externally started server? Local static server
- What test seam should be canonical for workspace selection in Cypress (UI picker vs injected test fixture API)? UI picker