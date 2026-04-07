# Change: Add Cogito Mode Question Assistant

## Why
Writers can lose momentum when they need critical prompts to challenge or deepen what they just wrote. A local side-panel coach that asks targeted questions based on the latest sentence can improve reflection without auto-writing content for the user.

## What Changes
- Add a new **Cogito Mode** in the editor that runs an in-browser LLM using `https://esm.run/@mlc-ai/web-llm`.
- Add a dedicated Cogito Mode button in the menu bar's top-right action area, using a thinking-man glyphicon as the button icon.
- Generate exactly three coaching questions from the user's most recent sentence using a fixed JSON-only prompt contract.
- Display generated questions in a right-side panel, with per-question insertion into the active markdown document.
- Insert selected questions into the document using a standardized AI block format:
  - `> ### AI`
  - `Question here`
- Add robust validation, fallback handling, and non-blocking UI status for model loading/inference failures.

## Impact
- Affected specs: `cogito-mode` (new capability)
- Affected code: menu bar actions UI, editor layout/panel UI, markdown insertion flows, client LLM integration module, and app controller wiring
- Runtime dependency: web-llm loaded from ESM URL at runtime
- Breaking changes: none (feature is additive and opt-in)
