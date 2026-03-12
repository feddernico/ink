## ADDED Requirements

### Requirement: View Top-Level Menu
The application menu bar SHALL include a View top-level menu positioned between the Edit menu and the Import/Export menu.

#### Scenario: View menu is visible in the menu bar
- **WHEN** the application loads
- **THEN** a "View" menu item is present in the menu bar
- **AND** it appears between "Edit" and "Import/Export"

#### Scenario: View menu opens a dropdown
- **WHEN** the user clicks the View menu item
- **THEN** a dropdown appears listing all available colour styles
- **AND** the dropdown follows the same interaction model as File and Edit menus

### Requirement: Colour Style Selection
The View menu dropdown SHALL list all available colour styles and allow the user to switch between them with a single click.

#### Scenario: All themes listed
- **WHEN** the View dropdown is open
- **THEN** the following items are present in order: Default (Dark), [separator], Classic, Cobalt, Monokai, Office, Twilight, Xcode

#### Scenario: Selecting a theme
- **WHEN** the user clicks a theme name in the View dropdown
- **THEN** the corresponding theme is applied immediately
- **AND** the dropdown closes
- **AND** the application retains full functionality under the new colour scheme

### Requirement: Active Theme Indicator
The View menu SHALL display a checkmark (✓) next to the currently active theme.

#### Scenario: Checkmark on active theme
- **WHEN** the View dropdown is open
- **THEN** a ✓ indicator is visible next to the currently active theme name
- **AND** all other theme entries show no checkmark

#### Scenario: Checkmark updates on selection
- **WHEN** the user selects a different theme
- **THEN** the checkmark moves to the newly selected theme
- **AND** the previous theme entry no longer shows a checkmark

### Requirement: Backward Compatibility
Adding the View menu SHALL not affect any existing menu, button, or keyboard shortcut behaviour.

#### Scenario: Existing menus unaffected
- **WHEN** the View menu is present
- **THEN** File, Edit, and Import/Export menus continue to operate identically to their prior behaviour

#### Scenario: Existing buttons unaffected
- **WHEN** a colour theme is active
- **THEN** all sidebar buttons, Save, JSON, and MD buttons continue to function correctly
- **AND** their visual style adapts to the active theme via CSS custom properties
