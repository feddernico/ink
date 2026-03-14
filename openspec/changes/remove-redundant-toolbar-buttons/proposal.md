# Change: Remove Redundant Toolbar Buttons

## Why

Following the introduction of the office-style menu bar (File, Edit, Import/Export) and its associated keyboard shortcuts, six toolbar buttons are now fully redundant. Every action they expose is reachable via the menu or a keyboard shortcut:

| Button | Menu equivalent | Keyboard shortcut |
|--------|----------------|-------------------|
| 📄 New Note (`#newNoteBtn`) | File > New Note | Cmd/Ctrl+E |
| 📁+ New Folder (`#newFolderBtn`) | File > New Folder | — |
| 🗂️ Open Workspace (`#openFolderBtn`) | File > Open Workspace | Cmd/Ctrl+Shift+O |
| Save (`#saveBtn`) | Edit > Save | Cmd/Ctrl+S |
| JSON (`#exportJsonBtn`) | Import/Export > Export JSON | Cmd/Ctrl+Shift+S |
| MD (`#exportMdBtn`) | Import/Export > Export Markdown | Cmd/Ctrl+Shift+M |

Keeping duplicate controls adds visual noise, increases the cognitive load on new users deciding which path to take, and complicates the DOM and event-listener surface without providing any additional capability. Removing them simplifies the interface and makes the menu bar the single, consistent entry point for all commands.

The unsaved-changes state that the Save button currently expresses through its enabled/disabled condition is already communicated by two other mechanisms that will be retained: the red dirty-dot indicator (`#dirtyDot`) and the "Unsaved changes" status badge in the editor header.

## What Changes

- Remove `#newNoteBtn`, `#newFolderBtn`, and `#openFolderBtn` icon buttons from the sidebar header row in `ink.template.html`.
- Remove `#saveBtn`, `#exportJsonBtn`, and `#exportMdBtn` buttons from the editor header status area in `ink.template.html`.
- Remove the corresponding DOM references from `src/app/dom.ts` (`getDomRefs()` return value).
- Remove the six fields from the `DomRefs` interface in `src/app/types.ts`.
- Remove the event-listener registrations for the six buttons from `src/app/bootstrap.ts` (`attachEventListeners()`).
- Remove all `disabled` state management calls for `saveBtn`, `exportJsonBtn`, and `exportMdBtn` throughout `src/app/bootstrap.ts` (primarily in `updateDirtyUi()` and `openWorkspace()`/`closeWorkspace()`).
- Retain all buttons that are NOT fully covered by the menu: `#sortBtn`, `#refreshBtn`, and `#sidebarToggleBtn`.
- Retain the `#dirtyDot` indicator and the `#statusBadge` — these are not buttons and remain the sole visual signals for unsaved state.
- Rebuild `dist/` and `ink-app.html`.

## Impact

- Affected specs: `ui-cleanup`
- Affected code:
  - `ink.template.html` — six button elements removed
  - `src/app/dom.ts` — six DOM references removed
  - `src/app/types.ts` — six fields removed from `DomRefs`
  - `src/app/bootstrap.ts` — event listeners and disabled-state management removed
  - `dist/app.min.js` (rebuilt)
  - `dist/styles.min.css` (rebuilt)
  - `ink-app.html` (rebuilt)

## Test Baseline

QUnit suite confirmed at **32 / 32 passing** before any changes are made to this codebase. The implementation must not reduce this count.
