# Change: Add Office-Style Menu Bar

## Why

The ink markdown note-taking application currently lacks a proper office-style menu bar (File, Edit, Import/Export) that users expect from desktop applications. This makes common operations like opening workspaces, creating files/folders, and exporting content less discoverable and accessible. Adding a menu bar will improve user experience by providing familiar navigation patterns and keyboard shortcuts.

## What Changes

- **BREAKING**: Add a new menu bar component with File, Edit, and Import/Export sections
- Integrate existing functionality (open workspace, create files/folders, export) into menu items
- Add keyboard shortcuts for common operations (Ctrl/Cmd+N, Ctrl/Cmd+O, Ctrl/Cmd+S, etc.)
- Maintain existing button functionality while adding menu alternatives
- Add accessibility attributes and proper ARIA labeling
- Update UI layout to accommodate menu bar

## Impact

- Affected specs: `menu-bar`, `keyboard-shortcuts`, `accessibility`
- Affected code: `src/app/bootstrap.ts`, `src/app/dom.ts`, `src/app/types.ts`, `ink-app.html`
- New files: Menu component implementation, CSS styles, comprehensive tests
- User experience: Improved discoverability of features, familiar desktop application patterns
- Backward compatibility: All existing functionality preserved, menu adds new access points