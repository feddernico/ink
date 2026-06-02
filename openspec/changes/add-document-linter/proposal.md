# Change: Add Document Linter

## Why
Writers need editorial feedback on their documents to improve clarity, flow, scannability, and engagement. While Ink provides markdown editing functionality, there's no built-in tool for analyzing prose structure and providing actionable writing suggestions. This change adds a linting + review app that analyzes the currently open document to provide writing suggestions.

## What Changes
- Add a new Document Linter feature that analyzes the currently open markdown document
- Parse front matter (if present), headings, prose, code chunks, callouts, lists, and links
- Ignore or downweight code chunks to focus on human-facing text
- Return actionable suggestions grouped into clarity, flow, scannability, and engagement
- Implement rule-based tests plus a scoring layer for analysis
- Generate suggestions tied to exact lines or sections like a code review
- Build as a small web app with three stages: parse, analyze, generate suggestions
- Include a practical rules engine with checks like readability.max_sentence_length, structure.heading_depth_jump, etc.
- Create a simple single-page app with score panel and inline suggestions in the editor
- Implement markdown-aware parsing to isolate prose from code
- Use rule-based checks first, with optional LLM suggestions second
- Output section-by-section report plus optional "improved draft" mode

## Impact
- Affected specs: document-linter (new capability)
- Affected code: New frontend interface, parsing logic, rule engine, suggestion generator
- Runtime dependency: None (client-side only)
- Breaking changes: none (feature is additive and opt-in)