## ADDED Requirements
### Requirement: User-Controlled Left Menu Visibility
The application SHALL provide a user-facing control to collapse and expand the left menu during an editing session.

#### Scenario: User collapses left menu
- **WHEN** the user activates the menu toggle while the menu is expanded
- **THEN** the left menu transitions to a collapsed state
- **AND** the main editor area gains additional horizontal space

#### Scenario: User expands left menu
- **WHEN** the user activates the menu toggle while the menu is collapsed
- **THEN** the left menu returns to an expanded state
- **AND** primary menu content becomes visible again

### Requirement: Left Menu Toggle Accessibility
The left menu toggle SHALL be operable via keyboard and SHALL expose its current expanded/collapsed state to assistive technologies.

#### Scenario: Keyboard operation
- **WHEN** a keyboard-only user focuses the menu toggle and activates it
- **THEN** the menu state changes between expanded and collapsed
- **AND** focus remains in a predictable location for continued interaction

#### Scenario: Assistive state exposure
- **WHEN** the menu state changes through the toggle control
- **THEN** the control's accessibility state reflects whether the menu is expanded or collapsed

### Requirement: Deterministic Initial Menu State
The application SHALL define a deterministic initial left menu state when a new session loads.

#### Scenario: Initial layout state
- **WHEN** a user opens the application in a new session
- **THEN** the left menu starts in the documented default state
- **AND** the editor layout reflects that state without requiring user interaction
