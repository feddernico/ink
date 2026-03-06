## 1. Implementation
- [ ] 1.1 Update `src/app/fs-api.ts` - Add function to check if FS API is available
- [ ] 1.2 Update `src/app/bootstrap.ts` - Modify `openWorkspace()` to enter in-memory mode when FS API unavailable
- [ ] 1.3 Add in-memory workspace state management (notes stored in memory, not on disk)
- [ ] 1.4 Add "Export as JSON" button to UI (download all notes)
- [ ] 1.5 Add "Export as Markdown" button to UI (download single note)
- [ ] 1.6 Add UI indicator showing "Temporary Session" mode
- [ ] 1.7 Update `ink-app.html` with new export buttons
- [ ] 1.8 Update `src/styles.scss` with temporary session styles
- [ ] 1.9 Test in-memory mode works without errors
- [ ] 1.10 Test export JSON downloads correctly
- [ ] 1.11 Test export Markdown downloads correctly

## 2. Cypress Tests
- [ ] 2.1 Create `cypress/e2e/mobile-fallback.cy.js`
- [ ] 2.2 Test: When FS API unavailable, app shows temporary session mode
- [ ] 2.3 Test: User can create and edit notes in memory
- [ ] 2.4 Test: Export JSON button downloads valid JSON file
- [ ] 2.5 Test: Export Markdown button downloads valid .md file

## 3. QUnit Tests
- [ ] 3.1 Create `tests/qunit/mobile-fallback.test.js`
- [ ] 3.2 Test: isFileSystemApiAvailable() returns correct values based on browser
- [ ] 3.3 Test: In-memory notes can be created and retrieved
- [ ] 3.4 Test: JSON export formats notes correctly
- [ ] 3.5 Test: Markdown export includes frontmatter and content
