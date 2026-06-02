## 1. Implementation

## 1. Analyzer correctness
- [x] 1.1 Remove the artificial 100ms `setTimeout` in `runAnalysis`; make analysis synchronous (or use a real async path such as `requestIdleCallback` if a non-blocking UI is needed)
- [x] 1.2 Unify sentence tokenization — `countSentences` and `splitSentences` should use one helper with one rule
- [x] 1.3 Deduplicate `detectPseudoSectionLabel` and the inline label check inside `buildDocumentSections`
- [x] 1.4 Replace the regex-based "section that needs attention" lookup in `buildOverview` with an explicit `needsAttention` flag on the section note

## 2. Scoring
- [x] 2.1 Replace the hard-coded engagement baseline (currently 68) with heuristics derived from observable signals (opening verb energy, presence of a question, directive verbs, ratio of passive voice, etc.)
- [x] 2.2 Add an aggregate "Overall" score (weighted mean or simple min) to both the panel and the exported report

## 3. Strengths detection
- [x] 3.1 Generalize the "this chapter is about" / mnemonic / place-name heuristics into generic detectors (dates, numbers, named entities, mnemonic patterns like "Remember…", parallel list items)
- [x] 3.2 Ensure strong writing that doesn't trigger the literal phrases still surfaces at least one strength

## 4. Parsing coverage
- [x] 4.1 Extend `parseMarkdownBlocks` to handle ordered lists (`1.`, `2.`, …)
- [x] 4.2 Extend `parseMarkdownBlocks` to handle Setext-style headings (`===`, `---`)
- [x] 4.3 Extend `parseMarkdownBlocks` to handle indented code blocks and fenced code without a closing fence
- [x] 4.4 Decide on a behavior for the implicit "Lead" section when a document starts with code or a quote, and name/document it

## 5. Test coverage
- [x] 5.1 Add QUnit tests for `parseMarkdownBlocks` edge cases: nested lists, ordered lists, multi-paragraph blockquotes, code without a closing fence, headings without a space
- [x] 5.2 Add QUnit tests for `buildDocumentSections` in isolation (not just via end-to-end analyzer tests)
- [x] 5.3 Add a snapshot test for `buildDocumentLinterReport` Markdown output
- [x] 5.4 Add tests for empty, single-word, and heading-only documents
- [x] 5.5 Add tests for the controller (`createDocumentLinterController`) using a JSDOM harness — assert panel HTML shape, toast/status callbacks, and "no content" guard
- [x] 5.6 Add a test that proves list items are not miscounted as sentences (markdown-aware classification)

## 6. Maintainability
- [x] 6.1 Extract all suggestion and overview copy into a `messages.ts` (or equivalent) module so non-English UI is possible later
- [x] 6.2 Document the sentence-tokenizer limitation in a code comment near the helper
