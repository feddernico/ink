## 1. Implementation

- [x] 1.1 Add platform detection utility function to detect macOS vs Windows/Linux
- [x] 1.2 Update menu rendering to use platform-appropriate modifier (Cmd vs Ctrl) at initialization
- [x] 1.3 Rename "Import/Export" menu to "Export" in the menu structure
- [x] 1.4 Move Export JSON and Export Markdown items under File menu as submenu
- [x] 1.5 Update keyboard shortcut scenarios in spec to reflect platform-aware behavior

## 2. Regression Prevention

- [x] 2.1 Verify all File menu items work (New Note, New Folder, Open/Close Workspace, Exit)
- [x] 2.2 Verify all Edit menu items work (Save, Save As, Refresh, Sort, Collapse Sidebar)
- [x] 2.3 Verify all View menu items work (theme switching)
- [x] 2.4 Verify Export submenu items work (Export JSON, Export Markdown)
- [x] 2.5 Verify keyboard shortcuts still trigger correct actions
- [x] 2.6 Verify existing toolbar buttons still work alongside menu

## 3. Testing

- [x] 3.1 Add Cypress test for platform detection (mock navigator.platform)
- [x] 3.2 Add Cypress test for correct shortcut display on macOS
- [x] 3.3 Add Cypress test for correct shortcut display on Windows/Linux
- [x] 3.4 Add Cypress test for Export submenu visibility under File menu
- [x] 3.5 Add Cypress test for Export JSON functionality via menu
- [x] 3.6 Add Cypress test for Export Markdown functionality via menu
- [x] 3.7 Add Cypress test for keyboard shortcut triggers (Cmd+E, Ctrl+E, etc.)

## 4. Validation

- [x] 4.1 Verify shortcuts display correctly on macOS (Cmd)
- [x] 4.2 Verify shortcuts display correctly on Windows/Linux (Ctrl)
- [x] 4.3 Verify Export submenu appears under File menu
- [x] 4.4 Verify existing menu functionality still works
