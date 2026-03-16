## MODIFIED Requirements

### Requirement: Keyboard Shortcuts for Common Operations
The application SHALL provide standard keyboard shortcuts for frequently used operations accessible through the menu bar.

#### Scenario: New Note shortcut
- **WHEN** a user presses the platform-appropriate shortcut (Ctrl+E on Windows/Linux, Cmd+E on Mac)
- **THEN** the createNewNote functionality is triggered
- **AND** the same behavior as clicking "New Note" menu item occurs
- **AND** the shortcut displayed in the menu reflects the user's platform

#### Scenario: Open Workspace shortcut
- **WHEN** a user presses the platform-appropriate shortcut (Ctrl+Shift+O on Windows/Linux, Cmd+Shift+O on Mac)
- **THEN** the openWorkspace functionality is triggered
- **AND** the shortcut displayed in the menu reflects the user's platform

#### Scenario: Save shortcut
- **WHEN** a user presses the platform-appropriate shortcut (Ctrl+S on Windows/Linux, Cmd+S on Mac)
- **THEN** the saveCurrentNote functionality is triggered
- **AND** the shortcut displayed in the menu reflects the user's platform

#### Scenario: Refresh shortcut
- **WHEN** a user presses the platform-appropriate shortcut (Ctrl+L on Windows/Linux, Cmd+L on Mac)
- **THEN** the rescanWorkspace functionality is triggered
- **AND** the shortcut displayed in the menu reflects the user's platform

#### Scenario: Export JSON shortcut
- **WHEN** a user presses the platform-appropriate shortcut (Ctrl+Shift+S on Windows/Linux, Cmd+Shift+S on Mac)
- **THEN** the exportAsJson functionality is triggered
- **AND** the shortcut displayed in the menu reflects the user's platform

#### Scenario: Export Markdown shortcut
- **WHEN** a user presses the platform-appropriate shortcut (Ctrl+Shift+M on Windows/Linux, Cmd+Shift+M on Mac)
- **THEN** the exportAsMarkdown functionality is triggered
- **AND** the shortcut displayed in the menu reflects the user's platform

### Requirement: Platform-Aware Shortcut Display
The application SHALL detect the user's operating system and display the appropriate keyboard shortcut modifiers.

#### Scenario: Platform detection on load
- **WHEN** the application loads
- **THEN** the system detects whether the user is on macOS or Windows/Linux
- **AND** all menu shortcuts are rendered with the appropriate modifier key

#### Scenario: macOS shortcut display
- **WHEN** the application runs on macOS
- **THEN** all keyboard shortcuts display "Cmd" as the modifier
- **AND** shortcut examples include Cmd+E, Cmd+S, Cmd+Shift+O

#### Scenario: Windows/Linux shortcut display
- **WHEN** the application runs on Windows or Linux
- **THEN** all keyboard shortcuts display "Ctrl" as the modifier
- **AND** shortcut examples include Ctrl+E, Ctrl+S, Ctrl+Shift+O

### Requirement: Platform Detection Test Coverage
The application SHALL have automated tests to verify platform-aware shortcut behavior.

#### Scenario: Platform detection test on macOS
- **WHEN** automated tests mock navigator.platform to return "MacIntel" or similar
- **THEN** the platform detection function returns true for Mac
- **AND** shortcuts display "Cmd" in the UI

#### Scenario: Platform detection test on Windows
- **WHEN** automated tests mock navigator.platform to return "Win32"
- **THEN** the platform detection function returns false for Mac
- **AND** shortcuts display "Ctrl" in the UI

#### Scenario: Keyboard shortcut integration tests
- **WHEN** Cypress tests simulate keyboard shortcuts
- **THEN** the correct action is triggered for each platform-appropriate shortcut
- **AND** no regressions occur in existing shortcut functionality
