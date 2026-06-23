## 1. Unified panel structure
- [x] 1.1 Remove the standalone Linter menu bar button and retain Cogito as the single writing-assistance entrypoint.
- [x] 1.2 Replace the separate Cogito and Document Linter sidebars with one Cogito panel containing Document strength and Improve with Cogito sections.
- [x] 1.3 Update panel styles and responsive layouts so the unified panel works in Source, Split, and Preview modes.
- [x] 1.4 Update accessible labels, descriptions, status copy, and focus behavior for the combined experience.

## 2. Document strength integration
- [x] 2.1 Render the existing overall score, strengths, priorities, category scores, and section feedback in the Document strength area.
- [x] 2.2 Preserve manual Analyze, rerun-on-change, clickable line navigation, and markdown report export inside Cogito.
- [x] 2.3 Keep `analyzeDocumentText()` and `buildDocumentLinterReport()` stable and independent from WebLLM availability.
- [x] 2.4 Remove obsolete standalone panel visibility state, CSS classes, DOM references, and toggle event wiring.

## 3. Cogito coaching integration
- [x] 3.1 Add a typed mapper that reduces the latest linter analysis to compact strengths and prioritized improvement context.
- [x] 3.2 Extend Cogito generation input with the compact analysis context while preserving latest-sentence grounding.
- [x] 3.3 Preserve the strict JSON-only response with exactly three questions, model selection, error states, and explicit markdown insertion.
- [x] 3.4 Indicate when generated questions use an older analysis snapshot and require explicit regeneration after analysis changes.

## 4. Validation
- [x] 4.1 Update QUnit tests for DOM/controller behavior, analysis context mapping, prompt construction, and retained report contracts.
- [x] 4.2 Replace separate Cogito and Document Linter Cypress flows with coverage for the unified entrypoint and full assess-then-improve workflow.
- [x] 4.3 Add assertions that no standalone Linter button or independently toggled linter panel remains.
- [x] 4.4 Run lint, build, QUnit, and Cypress checks and manually smoke-test responsive panel behavior.

## 5. Documentation
- [x] 5.1 Update user-facing documentation to explain document strength and Cogito coaching as one workflow.
- [x] 5.2 Update repository agent guidance to describe the unified panel boundaries and preserved analyzer/generation contracts.
