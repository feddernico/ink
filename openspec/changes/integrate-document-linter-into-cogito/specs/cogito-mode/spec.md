## MODIFIED Requirements

### Requirement: Cogito Mode Menu Bar Button
The system SHALL provide Cogito as the single writing-assistance button in the menu bar's top-right action area.

#### Scenario: User sees the unified writing-assistance entrypoint
- **WHEN** the editor UI is visible
- **THEN** a Cogito button SHALL appear in the top-right menu bar actions
- **AND** the button SHALL expose an accessible label or description identifying document assessment and coaching
- **AND** no standalone Linter button SHALL appear

#### Scenario: User toggles the unified Cogito panel
- **WHEN** the user clicks the Cogito top-right button
- **THEN** the system SHALL open or close the unified Cogito side panel
- **AND** the toggle action SHALL not interrupt normal editing flow

### Requirement: Cogito Mode Side Panel
The system SHALL provide one Cogito side panel where users can assess document strength and generate writing-coach questions while editing markdown.

#### Scenario: User opens Cogito
- **WHEN** the user enables Cogito
- **THEN** the editor SHALL show a Document strength area
- **AND** the editor SHALL show an Improve with Cogito area
- **AND** the panel SHALL not prevent normal markdown editing

#### Scenario: Language model is unavailable
- **WHEN** WebLLM cannot initialize or generate questions
- **THEN** the Document strength area SHALL remain usable
- **AND** the system SHALL present a clear non-blocking coaching error state

### Requirement: Fixed Coaching Prompt Contract
The system SHALL generate questions using a fixed writing-coach instruction that accepts the user's latest sentence and, when available, compact document-analysis context, and outputs JSON only with exactly three questions.

#### Scenario: Prompt uses current analysis
- **WHEN** Cogito requests questions after a document analysis
- **THEN** the system SHALL include a compact representation of the current document strengths and highest-priority improvements
- **AND** the system SHALL include the user's latest sentence
- **AND** the system SHALL instruct the model not to write prose or suggest sentences
- **AND** the system SHALL require exactly three questions as `{ "questions": ["...", "...", "..."] }`
- **AND** no additional non-JSON content SHALL be accepted as valid output

#### Scenario: Prompt runs without analysis
- **WHEN** Cogito requests questions before a document analysis exists
- **THEN** the system SHALL generate questions from the user's latest sentence
- **AND** the UI SHALL indicate that analyzing the document can make coaching more focused

### Requirement: Last-Sentence Grounding
The system SHALL ground generated questions in the user's most recent sentence and use document-analysis context only to focus the coaching goal.

#### Scenario: User has at least one sentence
- **WHEN** the user triggers question generation
- **THEN** the system SHALL extract the latest sentence from the current document
- **AND** each generated question SHALL remain relevant to that sentence
- **AND** available linter findings SHALL guide which weaknesses or strengths the questions explore

## ADDED Requirements

### Requirement: Analysis Snapshot Awareness
The system SHALL make it clear when displayed Cogito questions no longer match the latest document analysis.

#### Scenario: Document analysis changes after question generation
- **WHEN** a new analysis completes after Cogito questions were generated
- **THEN** the existing questions SHALL remain visible
- **AND** the panel SHALL mark them as based on an earlier analysis snapshot
- **AND** the system SHALL require explicit regeneration before replacing them
