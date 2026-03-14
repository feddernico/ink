## 1. HTML Template

- [ ] 1.1 Remove the `#newNoteBtn` button element (`📄`) from the sidebar header icon row in `ink.template.html`.
- [ ] 1.2 Remove the `#newFolderBtn` button element (`📁+`) from the sidebar header icon row in `ink.template.html`.
- [ ] 1.3 Remove the `#openFolderBtn` button element (`🗂️`) from the sidebar header icon row in `ink.template.html`.
- [ ] 1.4 Remove the enclosing `<div class="row">` wrapper for those three icon buttons if it becomes empty.
- [ ] 1.5 Remove the `#saveBtn` button element from the editor header status area in `ink.template.html`.
- [ ] 1.6 Remove the `#exportJsonBtn` button element (`JSON`) from the editor header status area in `ink.template.html`.
- [ ] 1.7 Remove the `#exportMdBtn` button element (`MD`) from the editor header status area in `ink.template.html`.

## 2. TypeScript — Types

- [ ] 2.1 Remove `newNoteBtn`, `newFolderBtn`, `openFolderBtn`, `saveBtn`, `exportJsonBtn`, and `exportMdBtn` fields from the `DomRefs` interface in `src/app/types.ts`.

## 3. TypeScript — DOM References

- [ ] 3.1 Remove `newNoteBtn`, `newFolderBtn`, `openFolderBtn`, `saveBtn`, `exportJsonBtn`, and `exportMdBtn` from the `getDomRefs()` return object in `src/app/dom.ts`.

## 4. TypeScript — Bootstrap / Event Listeners and State Management

- [ ] 4.1 Remove the `this.els.newNoteBtn.addEventListener(...)` block from `attachEventListeners()` in `src/app/bootstrap.ts`.
- [ ] 4.2 Remove the `this.els.newFolderBtn.addEventListener(...)` block from `attachEventListeners()`.
- [ ] 4.3 Remove the `this.els.openFolderBtn.addEventListener(...)` block from `attachEventListeners()`.
- [ ] 4.4 Remove the `this.els.saveBtn.addEventListener(...)` block from `attachEventListeners()`.
- [ ] 4.5 Remove the `this.els.exportJsonBtn.addEventListener(...)` block from `attachEventListeners()`.
- [ ] 4.6 Remove the `this.els.exportMdBtn.addEventListener(...)` block from `attachEventListeners()`.
- [ ] 4.7 Remove all `this.els.saveBtn.disabled = ...` assignments throughout `bootstrap.ts` (including in `updateDirtyUi()`, `openWorkspace()`, and `closeWorkspace()`).
- [ ] 4.8 Remove all `this.els.exportJsonBtn.disabled = ...` assignments throughout `bootstrap.ts`.
- [ ] 4.9 Remove all `this.els.exportMdBtn.disabled = ...` assignments throughout `bootstrap.ts`.

## 5. Tests — New QUnit Tests

- [ ] 5.1 Add a QUnit test asserting that `#saveBtn` is not present in `ink-app.html`.
- [ ] 5.2 Add a QUnit test asserting that `#exportJsonBtn` is not present in `ink-app.html`.
- [ ] 5.3 Add a QUnit test asserting that `#exportMdBtn` is not present in `ink-app.html`.
- [ ] 5.4 Add a QUnit test asserting that `#newNoteBtn`, `#newFolderBtn`, and `#openFolderBtn` are not present in `ink-app.html`.
- [ ] 5.5 Add a QUnit test asserting that the dirty-dot indicator (`#dirtyDot`) is still present in `ink-app.html` after button removal.
- [ ] 5.6 Add a QUnit test asserting that the status badge (`#statusBadge`) is still present in `ink-app.html` after button removal.

## 6. Tests — New Cypress Tests

- [ ] 6.1 Add a Cypress test confirming the Save button is absent from the editor header.
- [ ] 6.2 Add a Cypress test confirming that Cmd/Ctrl+S still saves the current note successfully.
- [ ] 6.3 Add a Cypress test confirming the dirty-dot indicator appears after editing and disappears after saving via keyboard shortcut.
- [ ] 6.4 Add a Cypress test confirming that the File menu New Note and New Folder items still function correctly.
- [ ] 6.5 Add a Cypress test confirming that Import/Export > Export JSON and Export Markdown items still function correctly.

## 7. Build and Verification

- [ ] 7.1 Run `npm run build` and confirm zero TypeScript compilation errors.
- [ ] 7.2 Run `npm run test:qunit` and confirm all tests pass (baseline: 32 / 32).
- [ ] 7.3 Run `npm run test:cypress` and confirm all existing and new Cypress tests pass.
- [ ] 7.4 Verify visually that the sidebar header no longer shows the three icon buttons.
- [ ] 7.5 Verify visually that the editor header status area shows only the dirty-dot indicator and status badge.
- [ ] 7.6 Verify the dirty-dot indicator and "Unsaved changes" status badge correctly reflect unsaved state.
- [ ] 7.7 Verify all remaining menu and keyboard-shortcut paths for the removed buttons continue to work end-to-end.
