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

### Requirement: Removal of the Save Button
The editor header SHALL NOT contain a Save button, as saving is fully accessible through the Edit menu and the Cmd/Ctrl+S keyboard shortcut.

#### Scenario: Editor header after removal
- **WHEN** the application loads
- **THEN** the editor header does not contain a Save button element

#### Scenario: Save still reachable via menu
- **WHEN** the user selects Edit > Save
- **THEN** the current note is saved successfully

#### Scenario: Save still reachable via keyboard shortcut
- **WHEN** the user presses Cmd/Ctrl+S with unsaved changes
- **THEN** the current note is saved successfully
- **AND** the dirty-dot indicator disappears
- **AND** the status badge returns to a non-warning state

### Requirement: Unsaved-State Feedback via Retained Indicators
Removing the Save button SHALL NOT reduce the user's ability to see when a note has unsaved changes. The dirty-dot indicator and the status badge SHALL remain the sole visual signals for unsaved state.

#### Scenario: Dirty-dot appears on edit
- **WHEN** the user modifies the content of the currently open note
- **THEN** the red dirty-dot indicator becomes visible in the editor header
- **AND** the status badge reads "Unsaved changes"

#### Scenario: Dirty-dot clears on save
- **WHEN** the user saves the note via Cmd/Ctrl+S or Edit > Save
- **THEN** the dirty-dot indicator is hidden
- **AND** the status badge no longer shows a warning state

### Requirement: Removal of Redundant Export Buttons
The editor header status area SHALL NOT contain standalone JSON or MD export buttons, as these actions are fully accessible through the Import/Export menu and keyboard shortcuts.

#### Scenario: Editor header after removal
- **WHEN** the application loads
- **THEN** the editor header status area does not display a JSON export button
- **AND** the editor header status area does not display an MD export button

#### Scenario: Export JSON still reachable
- **WHEN** the user selects Import/Export > Export JSON
- **THEN** all notes are exported as a JSON file
- **AND** pressing Cmd/Ctrl+Shift+S also triggers the same export

#### Scenario: Export Markdown still reachable
- **WHEN** the user selects Import/Export > Export Markdown
- **THEN** the current note is exported as a Markdown file
- **AND** pressing Cmd/Ctrl+Shift+M also triggers the same export

### Requirement: Retained Buttons Unaffected
Buttons that are NOT fully covered by the menu (Sort, Refresh, Sidebar Toggle) SHALL remain in place and continue to function identically.

#### Scenario: Sort and Refresh buttons retained
- **WHEN** the application loads
- **THEN** the Sort and Refresh buttons remain visible in the sidebar footer row
- **AND** their behaviour is unchanged

#### Scenario: Sidebar toggle retained
- **WHEN** the user clicks the Collapse/Expand button
- **THEN** the sidebar collapses or expands as before

### Requirement: No Regression in Existing Tests
Removing the six buttons SHALL NOT break any existing test.

#### Scenario: QUnit baseline maintained
- **WHEN** `npm run test:qunit` is executed after the change
- **THEN** all 32 pre-existing tests pass
- **AND** the new DOM-presence QUnit tests (6 additional) also pass

#### Scenario: Cypress suite passes
- **WHEN** `npm run test:cypress` is executed after the change
- **THEN** all pre-existing Cypress tests pass without modification
- **AND** the new Cypress tests covering keyboard-save and menu-driven actions also pass
