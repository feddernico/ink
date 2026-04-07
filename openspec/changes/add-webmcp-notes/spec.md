## ADDED Requirements

### Requirement: Declarative Note Tool Exposure
The system SHALL expose a declarative WebMCP tool for creating notes from the app shell HTML.

#### Scenario: Agent discovers the note creation tool
- **WHEN** an agent inspects the ink application page
- **THEN** the page SHALL expose a form with `toolname` and `tooldescription` metadata
- **AND** the form SHALL define note creation parameters for title, body, and optional tag using form controls

### Requirement: Declarative Tool Submission Behavior
The system SHALL process declarative note submissions through Ink's existing note creation behavior without navigating away from the app.

#### Scenario: Agent submits the declarative note tool
- **WHEN** the declarative note form is submitted by an agent
- **THEN** the system SHALL create a new note using the provided title, body, and optional tag
- **AND** the system SHALL prevent full-page navigation
- **AND** the system SHALL return a structured response describing the created note

#### Scenario: Human submits the declarative note form
- **WHEN** the declarative note form is submitted manually in the page
- **THEN** the system SHALL create a new note using the same flow as an agent submission
- **AND** the application SHALL remain on the current page

### Requirement: No-Workspace Fallback
The system SHALL keep the declarative note tool usable even when no filesystem workspace is open.

#### Scenario: Declarative note tool is used before opening a workspace
- **WHEN** the user or agent submits the declarative note tool with no open workspace
- **THEN** the system SHALL create the note in a temporary in-memory session
- **AND** the UI SHALL indicate that the session is temporary
