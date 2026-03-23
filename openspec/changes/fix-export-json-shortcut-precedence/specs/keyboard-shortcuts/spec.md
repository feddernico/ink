## MODIFIED Requirements

### Requirement: Keyboard Shortcuts for Common Operations
The application SHALL provide standard keyboard shortcuts for frequently used operations accessible through the menu bar.

#### Scenario: Save shortcut
- **WHEN** a user presses the platform-appropriate plain save shortcut (Ctrl+S on Windows/Linux, Cmd+S on Mac)
- **THEN** the saveCurrentNote functionality is triggered
- **AND** the shortcut displayed in the menu reflects the user's platform

#### Scenario: Export JSON shortcut
- **WHEN** a user presses the platform-appropriate export shortcut (Ctrl+Shift+S on Windows/Linux, Cmd+Shift+S on Mac)
- **THEN** the exportAsJson functionality is triggered
- **AND** the shortcut displayed in the menu reflects the user's platform
- **AND** saveCurrentNote is not triggered for that same key press

### Requirement: Shortcut Key Conflict Resolution
The application SHALL resolve overlapping shortcut chords so the documented action still runs in every supported focus state.

#### Scenario: Focused editor does not swallow export chord
- **WHEN** the editor textarea has focus and a user presses Ctrl+Shift+S on Windows/Linux or Cmd+Shift+S on Mac
- **THEN** the exportAsJson functionality is triggered
- **AND** the focused-editor save handler does not intercept the chord as plain save

#### Scenario: Focused editor still saves with plain save chord
- **WHEN** the editor textarea has focus and a user presses Ctrl+S on Windows/Linux or Cmd+S on Mac
- **THEN** the saveCurrentNote functionality is triggered
- **AND** no export action is triggered
