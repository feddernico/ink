## Context
Cogito Mode introduces local AI-assisted questioning into the markdown editor. The feature must preserve user authorship by asking questions only, never drafting prose. The output contract is strict and machine-validated to keep behavior deterministic.

## Goals / Non-Goals
- Goals:
  - Provide a discoverable Cogito Mode entrypoint as a top-right menu bar button with a thinking-man glyphicon.
  - Generate exactly three coaching questions grounded in the user's latest sentence.
  - Keep generation non-blocking and local to the browser runtime via web-llm.
  - Insert selected questions in a recognizable markdown AI block.
- Non-Goals:
  - Generating full paragraphs, rewrites, or sentence suggestions.
  - Automatic insertion of generated questions without user action.
  - Server-side AI inference.

## Decisions
- Decision: Add Cogito Mode activation to the menu bar's top-right button cluster and use the thinking-man glyphicon from the existing glyphicon set.
  - Rationale: keeps feature discovery obvious while aligning with current icon system.
- Decision: Integrate `https://esm.run/@mlc-ai/web-llm` behind a dedicated client adapter module.
  - Rationale: isolates fast-changing AI runtime concerns from editor core logic.
- Decision: Keep prompt text fixed and versioned in code.
  - Rationale: preserves predictable behavior and testability.
- Decision: Validate model responses as JSON and require exactly three non-empty question strings.
  - Rationale: prevents malformed or verbose model outputs from corrupting UX.
- Decision: Insert question blocks with a canonical two-line structure:
  - `> ### AI`
  - `<question>`
  - Rationale: gives users clear provenance markers for AI-generated prompts.

## Risks / Trade-offs
- Runtime/model load latency may be noticeable on first use.
  - Mitigation: explicit loading state and deferred model initialization when Cogito Mode opens.
- JSON-only output may still be violated by model drift.
  - Mitigation: schema validation plus retry/fail-soft messaging.
- Browser/device limitations may prevent reliable local inference.
  - Mitigation: graceful disable state with explanatory copy and no editor disruption.
- Icon semantics may be interpreted differently across users.
  - Mitigation: add accessible label/tooltip text such as "Cogito Mode" to the icon button.

## Migration Plan
1. Add top-right menu bar button scaffolding and wire it to Cogito Mode panel visibility.
2. Add feature scaffolding and side panel hidden by default.
3. Land LLM adapter with mocked tests for parser/validator behavior.
4. Wire generation and insertion actions behind toggle-controlled UI.
5. Add docs and e2e checks; keep feature opt-in until validated.

## Open Questions
- Which specific glyphicon class best matches the "thinking man" expectation in this project?
- Which local model profile should be the default for quality vs startup time?
- Should the three generated questions refresh automatically after every sentence boundary, or only on explicit user request?
