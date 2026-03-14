## 1. HTML Template

- [ ] 1.1 Remove the `#newNoteBtn` button element (`📄`) from the sidebar header icon row in `ink.template.html`.
- [ ] 1.2 Remove the `#newFolderBtn` button element (`📁+`) from the sidebar header icon row in `ink.template.html`.
- [ ] 1.3 Remove the `#openFolderBtn` button element (`🗂️`) from the sidebar header icon row in `ink.template.html`.
- [ ] 1.4 Remove the enclosing `<div class="row">` wrapper for those three icon buttons if it becomes empty.
- [ ] 1.5 Remove the `#exportJsonBtn` button element (`JSON`) from the editor header status area in `ink.template.html`.
- [ ] 1.6 Remove the `#exportMdBtn` button element (`MD`) from the editor header status area in `ink.template.html`.

## 2. TypeScript — Types

- [ ] 2.1 Remove `newNoteBtn`, `newFolderBtn`, `openFolderBtn`, `exportJsonBtn`, and `exportMdBtn` fields from the `DomRefs` interface in `src/app/types.ts`.

## 3. TypeScript — DOM References

- [ ] 3.1 Remove `newNoteBtn`, `newFolderBtn`, `openFolderBtn`, `exportJsonBtn`, and `exportMdBtn` from the `getDomRefs()` return object in `src/app/dom.ts`.

## 4. TypeScript — Bootstrap / Event Listeners

- [ ] 4.1 Remove the `this.els.newNoteBtn.addEventListener(...)` block from `attachEventListeners()` in `src/app/bootstrap.ts`.
- [ ] 4.2 Remove the `this.els.newFolderBtn.addEventListener(...)` block from `attachEventListeners()`.
- [ ] 4.3 Remove the `this.els.openFolderBtn.addEventListener(...)` block from `attachEventListeners()`.
- [ ] 4.4 Remove the `this.els.exportJsonBtn.addEventListener(...)` block from `attachEventListeners()`.
- [ ] 4.5 Remove the `this.els.exportMdBtn.addEventListener(...)` block from `attachEventListeners()`.
- [ ] 4.6 Remove all `this.els.exportJsonBtn.disabled = ...` assignments throughout `bootstrap.ts`.
- [ ] 4.7 Remove all `this.els.exportMdBtn.disabled = ...` assignments throughout `bootstrap.ts`.

## 5. Build and Verification

- [ ] 5.1 Run `npm run build` and confirm zero TypeScript compilation errors.
- [ ] 5.2 Verify the sidebar header no longer shows the three icon buttons.
- [ ] 5.3 Verify the editor header status area shows only the Save button and status badge.
- [ ] 5.4 Verify New Note, New Folder, and Open Workspace still work via the File menu and their keyboard shortcuts.
- [ ] 5.5 Verify Export JSON and Export Markdown still work via the Import/Export menu and their keyboard shortcuts.
- [ ] 5.6 Verify the Save button dirty-state feedback (enabled/disabled, dot indicator) continues to function correctly.
- [ ] 5.7 Run existing QUnit and Cypress tests and confirm no regressions.
