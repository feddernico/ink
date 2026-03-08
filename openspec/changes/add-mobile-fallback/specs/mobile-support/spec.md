## ADDED Requirements

### Requirement: Mobile Browser Detection
The system SHALL detect when the browser does not support the File System Access API.

#### Scenario: Browser lacks File System Access API
- **WHEN** the user opens ink on a browser without `showDirectoryPicker` and `FileSystemHandle`
- **THEN** the system SHALL detect this and enable in-memory workspace mode
- **AND** the system SHALL NOT throw an error blocking app usage

#### Scenario: Browser supports File System Access API
- **WHEN** the user opens ink on a browser with `showDirectoryPicker` and `FileSystemHandle`
- **THEN** the system SHALL allow opening a real folder as usual
- **AND** no in-memory mode SHALL be activated

### Requirement: In-Memory Workspace Mode
The system SHALL provide a temporary in-memory workspace when FS API is unavailable.

#### Scenario: User creates note in temporary session
- **WHEN** the user clicks "New Note" in temporary session mode
- **AND** enters a note name
- **THEN** a new note SHALL be created in memory
- **AND** the user CAN edit the note content
- **AND** the user CAN save (persist to memory only)

#### Scenario: User edits note in temporary session
- **WHEN** the user modifies the editor content
- **AND** the note has unsaved changes
- **THEN** the dirty indicator SHALL show unsaved status
- **AND** the user CAN click Save to persist changes to memory

### Requirement: Export as JSON
The system SHALL provide a way to download all notes as a JSON file.

#### Scenario: User exports all notes as JSON
- **WHEN** the user clicks "Export JSON" button
- **THEN** the browser SHALL download a file named `ink-export-YYYY-MM-DD.json`
- **AND** the file SHALL contain a JSON object with notes array
- **AND** each note SHALL have `name`, `path`, and `content` fields

#### Scenario: JSON export contains multiple notes
- **WHEN** the user has created multiple notes in temporary session
- **AND** clicks Export JSON
- **THEN** the exported JSON SHALL include all notes
- **AND** the order SHALL be preserved

### Requirement: Export as Markdown
The system SHALL provide a way to download individual notes as .md files.

#### Scenario: User exports current note as Markdown
- **WHEN** the user clicks "Export Markdown" button while a note is open
- **THEN** the browser SHALL download a file with the note's filename
- **AND** the file SHALL contain the note's raw markdown content
- **AND** the file SHALL have `.md` extension

### Requirement: Temporary Session UI Indicator
The system SHALL display a clear indicator when operating in temporary session mode.

#### Scenario: Temporary session is active
- **WHEN** the app is running in temporary session mode
- **THEN** a visual indicator SHALL be displayed showing "Temporary Session"
- **AND** the indicator SHALL inform users their data is not persisted
- **AND** export buttons SHALL be prominently visible

#### Scenario: No indicator shown in normal mode
- **WHEN** the app is running with real file system access
- **THEN** no temporary session indicator SHALL be displayed
- **AND** export buttons MAY be hidden or disabled
