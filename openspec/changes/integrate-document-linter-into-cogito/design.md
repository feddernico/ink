## Context
Ink exposes Cogito and the Document Linter as mutually exclusive side panels. The linter explains what is strong or weak in the whole document, while Cogito asks questions about the latest sentence. Their separate entrypoints make related feedback feel like separate products and prevent Cogito from using the linter's deterministic findings to focus its coaching.

The existing analysis engine, report builder, question parser, model selection, and markdown insertion behavior are useful boundaries and should remain independently testable. This change unifies their presentation and orchestration rather than merging all logic into one large module.

## Goals / Non-Goals
- Goals:
  - Provide one top-right Cogito entrypoint for document assessment and coaching.
  - Show a clear, understandable document-strength summary before or alongside AI coaching.
  - Let Cogito focus its three questions using deterministic linter findings.
  - Preserve editing, line navigation, rerun-on-change, report export, and question insertion.
  - Keep linting usable when WebLLM is unavailable or still loading.
- Non-Goals:
  - Automatically rewriting the user's prose.
  - Automatically applying linter suggestions.
  - Replacing the deterministic linter with an LLM-based score.
  - Changing the linter scoring rules or report schema except where presentation context requires it.
  - Loading a language model merely to display document strength.

## Decisions
- Decision: Use the existing Cogito menu bar button as the only writing-assistance entrypoint.
  - Rationale: Cogito is the broader concept and can naturally contain both diagnosis and coaching.
- Decision: Render one side panel with two explicit areas: **Document strength** and **Improve with Cogito**.
  - Rationale: a linear assess-then-improve flow is clearer than two competing panels while keeping each responsibility visible.
- Decision: Keep `analyzeDocumentText()` and `buildDocumentLinterReport()` as deterministic linter contracts, and keep Cogito generation in its dedicated module.
  - Rationale: the unified experience should not create a monolithic controller or make analysis dependent on AI availability.
- Decision: Supply Cogito with a compact, structured summary of the latest linter analysis plus the latest sentence.
  - Rationale: coaching should target observable weaknesses while preserving the current local context that makes questions specific.
- Decision: Preserve the strict JSON response contract containing exactly three questions and the explicit insert action.
  - Rationale: the change should improve relevance without turning Cogito into an auto-writer.
- Decision: Run document analysis on explicit user action by default and preserve the existing rerun-on-change option.
  - Rationale: this retains predictable cost and timing while allowing users who want live feedback to opt in.
- Decision: Debounce rerun-on-change by 300 ms and bound model context to the latest 1,200 sentence characters plus compact linter lines.
  - Rationale: analysis should run once after a typing burst, and unusually long unpunctuated drafts should not inflate WebLLM input.
- Decision: If no current analysis exists, Cogito question generation may run with latest-sentence context alone and the UI should invite the user to analyze for more focused coaching.
  - Rationale: analysis improves Cogito but should not become a hard dependency that blocks the existing coaching flow.

## Risks / Trade-offs
- The unified panel may become visually dense.
  - Mitigation: use clear section headings, compact score summaries, and progressive disclosure for detailed category and section feedback.
- Linter output may consume too much model context.
  - Mitigation: pass only structured high-priority findings and strengths, not the rendered report or full analysis object.
- Rerun-on-change may update findings while generated questions are still visible.
  - Mitigation: mark coaching as based on an earlier analysis snapshot and require explicit regeneration rather than silently replacing questions.
- Removing the standalone button may surprise existing users.
  - Mitigation: keep all linter functions visible under the Cogito panel and use document-strength language in Cogito's accessible description and empty state.
- A combined controller could increase coupling.
  - Mitigation: retain separate analysis and generation modules, with app-level orchestration passing only typed summaries between them.

## Migration Plan
1. Restructure the template and styles around one Cogito panel containing document-strength and coaching sections.
2. Remove the standalone Linter button and its independent panel visibility state.
3. Rewire Document Linter controls and rendering into the Cogito panel while preserving analyzer/report contracts.
4. Add a compact analysis-to-Cogito context mapper and extend the fixed prompt input without changing the three-question output schema.
5. Update DOM types, controller orchestration, tests, documentation, and generated single-file output.
6. Verify the unified panel in Source, Split, Preview, and responsive layouts.

## Resolved Questions
- Detailed linter categories and section notes remain expanded in the initial implementation so all existing feedback stays directly accessible.
- Opening Cogito retains an explicit first-run Analyze action. The coaching flow remains available without analysis and explains that analysis will make its questions more focused.
