# Change: Improve Document Linter Output Quality

## Why
The current Document Linter output is technically correct but too generic to be useful on real study and writing notes. It over-flags list items as long sentences, repeats low-signal style warnings, and does not surface a clear priority order or a concise summary that helps the reader act quickly.

## What Changes
- Upgrade the linter report to prioritize the most useful feedback first
- Make sentence and paragraph analysis markdown-aware so list items, headings, and quoted callouts are not misclassified as generic prose
- Add a stronger summary layer that highlights the top issues, strongest sections, and what to fix first
- Add section-level analysis so the linter can reason about headings, label-style section starts, and dense sub-parts of a document
- Reduce dull, repetitive phrasing in favor of more specific, content-aware suggestions
- Keep the report export in markdown, but make the exported structure more editorial and easier to scan

## Impact
- Affected specs: document-linter
- Affected code: Document Linter analysis pipeline, markdown report builder, export output
- Runtime dependency: None
- Breaking changes: none
