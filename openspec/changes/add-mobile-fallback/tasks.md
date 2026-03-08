## 1. Implementation
- [x] 1.1 Update `src/app/fs-api.ts` - Add function to check if FS API is available
- [x] 1.2 Update `src/app/bootstrap.ts` - Modify `openWorkspace()` to enter in-memory mode when FS API unavailable
- [x] 1.3 Add in-memory workspace state management (notes stored in memory, not on disk)
- [x] 1.4 Add "Export as JSON" button to UI (download all notes)
- [x] 1.5 Add "Export as Markdown" button to UI (download single note)
- [x] 1.6 Add UI indicator showing "Temporary Session" mode
- [x] 1.7 Update `ink-app.html` with new export buttons
- [x] 1.8 Update `src/styles.scss` with temporary session styles
- [x] 1.9 Test in-memory mode works without errors
- [x] 1.10 Test export JSON downloads correctly
- [x] 1.11 Test export Markdown downloads correctly

## 2. Cypress Tests
- [x] 2.1 Create `cypress/e2e/mobile-fallback.cy.js`
- [x] 2.2 Test: When FS API unavailable, app shows temporary session mode
- [x] 2.3 Test: User can create and edit notes in memory
- [x] 2.4 Test: Export JSON button downloads valid JSON file
- [x] 2.5 Test: Export Markdown button downloads valid .md file

## 3. QUnit Tests
- [x] 3.1 Create `tests/qunit/mobile-fallback.test.js`
- [x] 3.2 Test: isFileSystemApiAvailable() returns correct values based on browser
- [x] 3.3 Test: In-memory notes can be created and retrieved
- [x] 3.4 Test: JSON export formats notes correctly
- [x] 3.5 Test: Markdown export includes frontmatter and content
