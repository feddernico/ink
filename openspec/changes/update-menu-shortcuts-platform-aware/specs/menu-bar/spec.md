## MODIFIED Requirements

### Requirement: Menu Bar Structure
The application SHALL provide a horizontal menu bar at the top of the application window containing File, Edit, and Export menu items.

#### Scenario: Menu bar is visible and accessible
- **WHEN** the application loads
- **THEN** a horizontal menu bar is displayed at the top of the application window
- **AND** the menu bar contains File, Edit, and Export menu items

#### Scenario: Menu items are properly labeled
- **WHEN** a user views the menu bar
- **THEN** each menu item has clear, descriptive text labels
- **AND** menu items follow standard desktop application conventions

### Requirement: File Menu Functionality
The File menu SHALL provide access to workspace, file management, and export operations.

#### Scenario: New Note menu item
- **WHEN** a user clicks "New Note" in the File menu
- **THEN** the existing createNewNote functionality is triggered
- **AND** the same behavior as clicking the "New Note" button occurs

#### Scenario: New Folder menu item
- **WHEN** a user clicks "New Folder" in the File menu
- **THEN** the existing createNewFolder functionality is triggered
- **AND** the same behavior as clicking the "New Folder" button occurs

#### Scenario: Open Workspace menu item
- **WHEN** a user clicks "Open Workspace" in the File menu
- **THEN** the existing openWorkspace functionality is triggered
- **AND** the same behavior as clicking the "Open Workspace" button occurs

#### Scenario: Close Workspace menu item
- **WHEN** a user clicks "Close Workspace" in the File menu
- **THEN** the workspace is closed and UI returns to initial state
- **AND** all workspace-specific UI elements are reset

### Requirement: Export Submenu Functionality
The Export submenu under File SHALL provide access to data export operations.

#### Scenario: Export submenu is accessible
- **WHEN** a user clicks the File menu
- **THEN** an Export submenu is visible containing export options

#### Scenario: Export JSON menu item
- **WHEN** a user clicks "Export JSON" in the File > Export submenu
- **THEN** the existing exportAsJson functionality is triggered
- **AND** the same behavior as clicking the "Export JSON" button occurs

#### Scenario: Export Markdown menu item
- **WHEN** a user clicks "Export Markdown" in the File > Export submenu
- **THEN** the existing exportAsMarkdown functionality is triggered
- **AND** the same behavior as clicking the "Export MD" button occurs

### Requirement: Menu Structure Test Coverage
The application SHALL have automated tests to verify the menu restructuring and export submenu functionality.

#### Scenario: Export submenu existence test
- **WHEN** Cypress tests check the DOM structure
- **THEN** the Export submenu exists under the File menu
- **AND** both Export JSON and Export Markdown items are present

#### Scenario: Export submenu functionality test
- **WHEN** Cypress tests click Export JSON via File > Export submenu
- **THEN** the exportAsJson function is triggered
- **AND** the expected JSON file is downloaded

#### Scenario: No regressions in existing menu items
- **WHEN** Cypress tests click each menu item
- **THEN** all existing functionality continues to work
- **AND** no breaking changes occur to File, Edit, or View menus
