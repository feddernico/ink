## 1. Implementation

- [x] 1.1 Update the editor keydown handler to reserve Cmd/Ctrl+Shift+S for JSON export instead of save
- [x] 1.2 Keep plain Cmd/Ctrl+S mapped to save in both editor-focused and global shortcut paths
- [x] 1.3 Keep shortcut handling linear so a single key chord triggers at most one action

## 2. Testing

- [x] 2.1 Add Cypress coverage for Cmd/Ctrl+Shift+S while `#editor` has focus
- [x] 2.2 Add Cypress coverage for Cmd/Ctrl+S while `#editor` has focus
- [x] 2.3 Verify the JSON export shortcut does not also trigger save side effects

## 3. Validation

- [x] 3.1 Run `openspec validate fix-export-json-shortcut-precedence --strict`
- [x] 3.2 Run the relevant automated shortcut regression tests after implementation
