## ADDED Requirements

### Requirement: Removal of Redundant Sidebar Icon Buttons
The sidebar header SHALL NOT contain standalone icon buttons for New Note, New Folder, or Open Workspace, as these actions are fully accessible through the File menu and keyboard shortcuts.

#### Scenario: Sidebar header after removal
- **WHEN** the application loads
- **THEN** the sidebar header does not display a New Note icon button
- **AND** the sidebar header does not display a New Folder icon button
- **AND** the sidebar header does not display an Open Workspace icon button

#### Scenario: New Note still reachable
- **WHEN** the user selects File > New Note
- **THEN** the new note creation flow executes correctly
- **AND** pressing Cmd/Ctrl+E also triggers the same flow

#### Scenario: New Folder still reachable
- **WHEN** the user selects File > New Folder
- **THEN** the new folder creation flow executes correctly

#### Scenario: Open Workspace still reachable
- **WHEN** the user selects File > Open Workspace
- **THEN** the folder picker opens correctly
- **AND** pressing Cmd/Ctrl+Shift+O also triggers the same flow

### Requirement: Removal of Redundant Export Buttons
The editor header status area SHALL NOT contain standalone JSON or MD export buttons, as these actions are fully accessible through the Import/Export menu and keyboard shortcuts.

#### Scenario: Editor header after removal
- **WHEN** the application loads
- **THEN** the editor header status area does not display a JSON export button
- **AND** the editor header status area does not display an MD export button
- **AND** the Save button and status badge remain present

#### Scenario: Export JSON still reachable
- **WHEN** the user selects Import/Export > Export JSON
- **THEN** all notes are exported as a JSON file
- **AND** pressing Cmd/Ctrl+Shift+S also triggers the same export

#### Scenario: Export Markdown still reachable
- **WHEN** the user selects Import/Export > Export Markdown
- **THEN** the current note is exported as a Markdown file
- **AND** pressing Cmd/Ctrl+Shift+M also triggers the same export

### Requirement: Retained Buttons Unaffected
Buttons that are NOT fully covered by the menu (Save, Sort, Refresh, Sidebar Toggle) SHALL remain in place and continue to function identically.

#### Scenario: Save button retained
- **WHEN** the editor contains unsaved changes
- **THEN** the Save button is enabled and clicking it saves the note
- **AND** the dirty-dot indicator and button enabled state continue to reflect unsaved state correctly

#### Scenario: Sort and Refresh buttons retained
- **WHEN** the application loads
- **THEN** the Sort and Refresh buttons remain visible in the sidebar footer row
- **AND** their behaviour is unchanged

#### Scenario: Sidebar toggle retained
- **WHEN** the user clicks the Collapse/Expand button
- **THEN** the sidebar collapses or expands as before

### Requirement: No Regression in Functionality
Removing the five buttons SHALL NOT break any existing feature or test.

#### Scenario: Cypress flow test passes
- **WHEN** the full Cypress end-to-end suite is run after removal
- **THEN** all tests pass without modification

#### Scenario: QUnit unit tests pass
- **WHEN** the QUnit test suite is run after removal
- **THEN** all tests pass without modification
