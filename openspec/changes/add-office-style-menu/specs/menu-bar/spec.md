## ADDED Requirements

### Requirement: Menu Bar Structure
The application SHALL provide a horizontal menu bar at the top of the application window containing File, Edit, and Import/Export menu items.

#### Scenario: Menu bar is visible and accessible
- **WHEN** the application loads
- **THEN** a horizontal menu bar is displayed at the top of the application window
- **AND** the menu bar contains File, Edit, and Import/Export menu items

#### Scenario: Menu items are properly labeled
- **WHEN** a user views the menu bar
- **THEN** each menu item has clear, descriptive text labels
- **AND** menu items follow standard desktop application conventions

### Requirement: File Menu Functionality
The File menu SHALL provide access to workspace and file management operations.

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

### Requirement: Edit Menu Functionality
The Edit menu SHALL provide access to document editing and view operations.

#### Scenario: Save menu item
- **WHEN** a user clicks "Save" in the Edit menu
- **THEN** the existing saveCurrentNote functionality is triggered
- **AND** the same behavior as clicking the "Save" button occurs

#### Scenario: Refresh menu item
- **WHEN** a user clicks "Refresh" in the Edit menu
- **THEN** the existing rescanWorkspace functionality is triggered
- **AND** the same behavior as clicking the "Refresh" button occurs

#### Scenario: Sort toggle menu item
- **WHEN** a user clicks "Sort: Name/Modified" in the Edit menu
- **THEN** the existing sort functionality is triggered
- **AND** the same behavior as clicking the "Sort" button occurs

#### Scenario: Collapse Sidebar menu item
- **WHEN** a user clicks "Collapse Sidebar" in the Edit menu
- **THEN** the existing setSidebarCollapsed functionality is triggered
- **AND** the same behavior as clicking the sidebar toggle button occurs

### Requirement: Import/Export Menu Functionality
The Import/Export menu SHALL provide access to data export operations.

#### Scenario: Export JSON menu item
- **WHEN** a user clicks "Export JSON" in the Import/Export menu
- **THEN** the existing exportAsJson functionality is triggered
- **AND** the same behavior as clicking the "Export JSON" button occurs

#### Scenario: Export Markdown menu item
- **WHEN** a user clicks "Export Markdown" in the Import/Export menu
- **THEN** the existing exportAsMarkdown functionality is triggered
- **AND** the same behavior as clicking the "Export MD" button occurs

### Requirement: Menu Dropdown Behavior
Menu dropdowns SHALL open and close appropriately with proper keyboard and mouse interaction.

#### Scenario: Mouse interaction with dropdowns
- **WHEN** a user hovers over or clicks a menu item
- **THEN** the dropdown menu opens
- **AND** clicking outside the menu closes it

#### Scenario: Keyboard navigation of menus
- **WHEN** a user navigates using arrow keys
- **THEN** focus moves between menu items
- **AND** pressing Enter activates the focused menu item
- **AND** pressing Escape closes open dropdowns

### Requirement: Backward Compatibility
The menu bar SHALL not interfere with existing button functionality.

#### Scenario: Buttons continue to work
- **WHEN** a user clicks existing buttons
- **THEN** the same functionality is triggered as before
- **AND** menu items provide alternative access to the same functions

#### Scenario: Menu and button state synchronization
- **WHEN** a menu item is clicked
- **THEN** any related button states are updated appropriately
- **AND** the application maintains consistent state across all interfaces