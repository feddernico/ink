## MODIFIED Requirements

### Requirement: Document Linter
The system SHALL provide deterministic markdown document analysis as the Document strength area within the unified Cogito panel.

#### Scenario: Analyze current document from Cogito
- **WHEN** the user requests analysis in the Document strength area
- **THEN** the system SHALL parse the currently open document
- **AND** the system SHALL show an overall strength score
- **AND** the system SHALL return suggestions grouped by clarity, flow, scannability, and engagement
- **AND** the report SHALL highlight the highest-priority fixes and current strengths

#### Scenario: Analysis remains independent from AI
- **WHEN** the Cogito language model is unavailable, loading, or disabled
- **THEN** document analysis SHALL remain available
- **AND** analysis results SHALL remain deterministic for the same document content

#### Scenario: Generate section-specific suggestions
- **WHEN** the system analyzes a document
- **THEN** it SHALL return actionable suggestions tied to exact lines or sections
- **AND** line references SHALL navigate the editor to the relevant content
- **AND** markdown bullets, headings, quoted callouts, and code SHALL not be misclassified as generic prose

#### Scenario: Provide document-strength metrics
- **WHEN** the system analyzes document prose and structure
- **THEN** it SHALL calculate category scores and an aggregate overall score
- **AND** it SHALL evaluate readability, headings, bullets, paragraph density, scan-friendly structure, and engagement signals

#### Scenario: Rerun analysis after edits
- **WHEN** the user enables rerun-on-change and edits the document
- **THEN** the Document strength results SHALL refresh from the current content
- **AND** any existing Cogito questions SHALL not be silently regenerated

#### Scenario: Export suggestions as markdown
- **WHEN** the user requests export from the Document strength area
- **THEN** the system SHALL output the suggestions in markdown format
- **AND** the export SHALL include a concise summary, prioritized fixes, strengths, scores, and section-level detail

#### Scenario: Standalone linter entrypoint is removed
- **WHEN** the editor UI is visible
- **THEN** the system SHALL not show a standalone Linter menu bar button
- **AND** the system SHALL not expose an independently toggled Document Linter side panel
- **AND** all retained linter actions SHALL be available from the unified Cogito panel
