# Change: Fix Export JSON Shortcut Precedence

## Why

The application advertises Cmd/Ctrl+Shift+S as the Export JSON shortcut, but when the editor has focus that chord is currently captured by the editor's Cmd/Ctrl+S save handler. This causes the current note to save instead of exporting all notes as JSON, which breaks the documented shortcut behavior.

## What Changes

- Ensure the editor-scoped save shortcut only handles the plain Cmd/Ctrl+S chord
- Preserve Cmd/Ctrl+Shift+S for Export JSON even when the editor has focus
- Document shortcut precedence so longer modified chords are not swallowed by shorter handlers
- Add regression coverage for focused-editor shortcut behavior

## Non-Regression Guarantees

- Plain Cmd/Ctrl+S continues to save the current note from the editor and window scope
- Cmd/Ctrl+Shift+S exports JSON from the editor and window scope
- Existing shortcuts for new note, open workspace, refresh, and markdown export continue to work
- The documented platform-aware shortcut labels remain unchanged

## Testing Requirements

- Add automated coverage for Cmd/Ctrl+Shift+S while the editor textarea has focus
- Add automated coverage confirming plain Cmd/Ctrl+S still saves while the editor textarea has focus
- Validate that shortcut handling does not trigger both save and export for a single key press

## Impact

- Affected specs: `keyboard-shortcuts`
- Affected code: `src/app/ui-events.ts`, focused-editor shortcut handling, Cypress shortcut regression coverage
- User experience: Export JSON matches the documented Cmd/Ctrl+Shift+S shortcut in all focus states
