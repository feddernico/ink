# Change: Update Menu Shortcuts for Platform Awareness

## Why

The menu bar currently displays incorrect keyboard shortcuts that don't account for platform differences between macOS (Cmd key) and Windows/Linux (Ctrl key). Additionally, the "Import/Export" menu should be renamed to just "Export" and restructured as a submenu under the File menu for better organization.

## What Changes

- Add platform detection to determine if user is on macOS or Windows/Linux
- Update keyboard shortcut display to show Cmd+E on macOS and Ctrl+E on Windows/Linux
- Rename "Import/Export" menu to "Export" 
- Move Export items (JSON, Markdown) to be a submenu under File menu
- Update all shortcut displays throughout the menu to be platform-aware
- Update keyboard-shortcuts spec scenarios to ensure platform-aware behavior is documented

## Non-Regression Guarantees

- All existing menu functionality must continue to work (New Note, New Folder, Open/Close Workspace, Save, Refresh, Sort, Collapse Sidebar)
- All keyboard shortcuts must continue to trigger the correct actions
- Theme switching must continue to work
- The export functionality (JSON and Markdown) must continue to work exactly as before
- The UI layout and styling must remain consistent

## Testing Requirements

- Add Cypress tests for platform-aware shortcut detection
- Add Cypress tests for Export submenu visibility and functionality
- Add tests to verify all menu items still trigger correct actions after restructuring
- Add tests to verify keyboard shortcuts work on both Mac and Windows/Linux platforms

## Impact

- Affected specs: `menu-bar`, `keyboard-shortcuts`
- Affected code: Menu rendering in `src/app/dom.ts` or `src/app/bootstrap.ts`
- User experience: Shortcuts will correctly reflect user's platform
