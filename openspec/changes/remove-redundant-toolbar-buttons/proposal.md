# Change: Remove Redundant Toolbar Buttons

## Why

Following the introduction of the office-style menu bar (File, Edit, Import/Export) and its associated keyboard shortcuts, five toolbar buttons are now fully redundant. Every action they expose is reachable via the menu or a keyboard shortcut:

| Button | Menu equivalent | Keyboard shortcut |
|--------|----------------|-------------------|
| 📄 New Note (`#newNoteBtn`) | File > New Note | Cmd/Ctrl+E |
| 📁+ New Folder (`#newFolderBtn`) | File > New Folder | — |
| 🗂️ Open Workspace (`#openFolderBtn`) | File > Open Workspace | Cmd/Ctrl+Shift+O |
| JSON (`#exportJsonBtn`) | Import/Export > Export JSON | Cmd/Ctrl+Shift+S |
| MD (`#exportMdBtn`) | Import/Export > Export Markdown | Cmd/Ctrl+Shift+M |

Keeping duplicate controls adds visual noise, increases the cognitive load on new users deciding which path to take, and complicates the DOM and event-listener surface without providing any additional capability. Removing them simplifies the interface and makes the menu bar the single, consistent entry point for all commands.

## What Changes

- Remove the `#newNoteBtn`, `#newFolderBtn`, and `#openFolderBtn` icon buttons from the sidebar header row in `ink.template.html`.
- Remove the `#exportJsonBtn` and `#exportMdBtn` ghost buttons from the editor header status area in `ink.template.html`.
- Remove the corresponding DOM references from `src/app/dom.ts` (`DomRefs` type and `getDomRefs()` return value).
- Remove the event-listener registrations for the five buttons from `src/app/bootstrap.ts` (`attachEventListeners()`).
- Remove the button enable/disable state management calls for `exportJsonBtn` and `exportMdBtn` from any method that currently sets their `disabled` property.
- Update `src/app/types.ts` if the removed references are declared in `DomRefs`.
- Retain all existing buttons that are NOT fully covered by the menu: `#saveBtn` (primary action with dirty-state feedback), `#sortBtn`, `#refreshBtn`, and `#sidebarToggleBtn`.
- Rebuild `dist/` and `ink-app.html`.

## Impact

- Affected specs: `ui-cleanup`
- Affected code:
  - `ink.template.html` — five button elements removed
  - `src/app/dom.ts` — five DOM references removed
  - `src/app/types.ts` — five fields removed from `DomRefs`
  - `src/app/bootstrap.ts` — event listeners and disabled-state calls removed
  - `dist/app.min.js` (rebuilt)
  - `dist/styles.min.css` (rebuilt)
  - `ink-app.html` (rebuilt)
