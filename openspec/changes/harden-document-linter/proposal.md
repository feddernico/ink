# Change: Harden Document Linter

## Why
The Document Linter rewrite (`improve-document-linter-output`) shipped a markdown-aware report and a useful overview, but several rough edges remain that limit trust in the output:

- The analyzer is wrapped in a fake 100ms `setTimeout` for no real reason, which makes the async path untestable and misleading.
- Sentence tokenization is duplicated in two places with two different regexes, so the analyzer and the report can disagree.
- The engagement score is hard-coded to 68 with tiny adjustments, so the score doesn't track content quality.
- Strengths detection depends on a literal phrase ("this chapter is about") and a hand-picked list of ancient-Near-East place names, so most documents surface no strengths.
- `parseMarkdownBlocks` does not handle ordered lists, Setext-style headings, indented code blocks, or fenced code without a closing fence.
- The "section that needs attention" lookup in `buildOverview` uses a loose regex over note text, silently coupling two pieces of code.
- Test coverage is thin: no edge-case parsing tests, no isolated section-builder test, no snapshot test for the exported Markdown report, no controller-level tests.

This change addresses the bug-class and coverage-class issues so the linter is reliable enough to build on (e.g. with a "rerun on change" toggle or a localization layer) in a follow-up.

## What Changes
- Make the analysis pipeline deterministic and properly testable: remove the artificial `setTimeout`, unify sentence tokenization, deduplicate the pseudo-section-label logic, and replace the regex-based overview lookup with an explicit flag.
- Replace the hard-coded engagement baseline with signal-based heuristics, and add an aggregate overall score to the panel and the exported report.
- Generalize the strengths heuristics so strong writing surfaces positive feedback regardless of topic.
- Broaden `parseMarkdownBlocks` to cover ordered lists, Setext headings, indented code, and unterminated fenced code.
- Expand QUnit coverage: parsing edge cases, isolated section builder, snapshot test for the Markdown report, empty/heading-only documents, and a JSDOM-based controller test.
- Extract the suggestion and overview copy into a small message module so it can be localized later (no new translations shipped here).
- Keep the existing panel HTML shape and Markdown report format as the contract; this change tightens internals and tests, not the public surface.

## Impact
- Affected specs: document-linter
- Affected code: `src/app/document-linter/document-linter.ts`, `tests/qunit/document-linter.test.js`
- Runtime dependency: None
- Breaking changes: none
