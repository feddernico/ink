## ADDED Requirements
### Requirement: QUnit Test Harness
The project SHALL provide a QUnit-based test harness and a documented command to run QUnit tests locally.

#### Scenario: QUnit tests are executable from project scripts
- **WHEN** a developer runs the documented QUnit test command
- **THEN** the QUnit suite executes without requiring manual browser setup
- **AND** the command exits non-zero when any QUnit assertion fails

### Requirement: Cypress End-to-End Test Harness
The project SHALL provide Cypress configuration and a documented command to run Cypress tests locally.

#### Scenario: Cypress tests are executable from project scripts
- **WHEN** a developer runs the documented Cypress test command
- **THEN** Cypress launches against the application under test
- **AND** the command exits non-zero when any Cypress assertion fails

### Requirement: Critical Authoring Flow Coverage
Automated tests SHALL validate the user workflow of selecting a workspace, creating a new file, entering markdown, and saving.

#### Scenario: End-to-end flow is validated
- **WHEN** the Cypress workflow test runs
- **THEN** it selects a workspace through supported UI/test seam interactions
- **AND** it creates a new file
- **AND** it enters markdown content into the editor
- **AND** it triggers save
- **AND** it verifies that the saved content matches the entered markdown

### Requirement: Fast Regression Coverage for Editor Logic
Automated tests SHALL include QUnit coverage for core editor interactions required by the authoring flow.

#### Scenario: Editor behavior is validated by QUnit
- **WHEN** the QUnit suite executes editor interaction tests
- **THEN** tests verify at least initialization and markdown content mutation behavior used by the save flow
