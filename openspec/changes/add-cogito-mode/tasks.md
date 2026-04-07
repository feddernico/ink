## 1. Implementation
- [ ] 1.1 Add a Cogito Mode menu bar button in the top-right action area using a thinking-man glyphicon.
- [ ] 1.2 Add Cogito Mode feature toggle behavior from the menu bar button and side-panel shell in the editor layout.
- [ ] 1.3 Implement a web-llm client module that loads `@mlc-ai/web-llm` and exposes `generateQuestionsFromLastSentence(text)`.
- [ ] 1.4 Enforce strict prompt and output contract: exactly 3 questions via JSON `{ "questions": ["...", "...", "..."] }`.
- [ ] 1.5 Add extraction logic for the user's latest sentence and pass only that context to the question generator.
- [ ] 1.6 Render three generated questions in the side panel with per-question insert actions.
- [ ] 1.7 Implement markdown insertion with the required AI block format:
  - `> ### AI`
  - `<question>`
- [ ] 1.8 Add loading, ready, and error UI states for model init/inference failures without blocking editing.
- [ ] 1.9 Add unit tests for sentence extraction, JSON validation, and insertion formatting.
- [ ] 1.10 Add end-to-end coverage for opening Cogito Mode from the top-right button, generating questions, and inserting each question into the document.

## 2. Documentation
- [ ] 2.1 Document where to find the top-right Cogito Mode button and what the thinking-man icon represents.
- [ ] 2.2 Document Cogito Mode behavior and AI block format in user-facing docs.
- [ ] 2.3 Document model/runtime constraints and graceful degradation behavior for unsupported environments.
