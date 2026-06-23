# Change: Integrate Document Linter into Cogito

## Why
Cogito and the Document Linter currently compete as separate top-right actions and separate side panels even though they serve one writing workflow: understand the document's quality, then improve it. Combining them gives writers one clear place to assess document strength and receive focused coaching without choosing between overlapping tools.

## What Changes
- Remove the standalone **Linter** menu bar button and keep **Cogito** as the single writing-assistance entrypoint.
- Replace the separate Cogito and Document Linter panels with one unified Cogito panel.
- Add a **Document strength** area inside Cogito that presents the linter's overall score, strengths, prioritized issues, category scores, and section-level feedback.
- Keep document analysis deterministic and available without loading the Cogito language model.
- Keep linter controls such as manual analysis, rerun-on-change, line navigation, and markdown report export within the unified panel.
- Add an **Improve with Cogito** area that generates exactly three question-only coaching prompts informed by the current document analysis and the writer's latest sentence.
- Preserve the existing Cogito model selection, recoverable model-loading states, explicit question insertion, and canonical AI markdown block format.
- Update unit and end-to-end coverage around the unified entrypoint, analysis flow, coaching flow, and removal of the standalone Linter UI.

## Impact
- Affected specs: `cogito-mode`, `document-linter`
- Affected code: `ink.template.html`, panel layout styles, DOM references/types, app-controller orchestration, UI event wiring, Cogito prompt context, Document Linter controller, QUnit tests, Cypress tests, and user/agent guidance
- Runtime dependency: no new dependency; deterministic linting remains client-side and Cogito continues to load WebLLM on demand
- Breaking changes: the standalone Linter button and independently toggled Document Linter panel are removed
