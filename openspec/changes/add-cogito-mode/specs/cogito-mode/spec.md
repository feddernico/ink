## ADDED Requirements

### Requirement: Cogito Mode Menu Bar Button
The system SHALL provide a Cogito Mode button in the menu bar's top-right action area.

#### Scenario: User sees Cogito entrypoint in the menu bar
- **WHEN** the editor UI is visible
- **THEN** a Cogito Mode button SHALL appear in the top-right menu bar actions
- **AND** the button SHALL use a thinking-man icon from the project's glyphicon library
- **AND** the button SHALL expose an accessible text label or tooltip identifying it as Cogito Mode

#### Scenario: User toggles Cogito Mode from the button
- **WHEN** the user clicks the Cogito Mode top-right button
- **THEN** the system SHALL open or close the Cogito Mode side panel
- **AND** the toggle action SHALL not interrupt normal editing flow

### Requirement: Cogito Mode Side Panel
The system SHALL provide a Cogito Mode side panel where users can generate and view writing-coach questions while editing markdown.

#### Scenario: User opens Cogito Mode panel
- **WHEN** the user enables Cogito Mode
- **THEN** the editor SHALL show a side panel dedicated to AI questions
- **AND** the panel SHALL not prevent normal markdown editing

### Requirement: Fixed Coaching Prompt Contract
The system SHALL generate questions using a fixed writing-coach instruction that outputs JSON only with exactly three questions.

#### Scenario: Prompt is sent for generation
- **WHEN** Cogito Mode requests questions
- **THEN** the system SHALL use the following prompt contract:
  - You are a writing coach.
  - Do NOT write prose.
  - Do NOT suggest sentences.
  - Ask exactly 3 questions.
  - Questions must be grounded in the user's last sentence.
  - Output JSON only as `{ "questions": ["...", "...", "..."] }`
- **AND** no additional non-JSON content SHALL be accepted as valid output

### Requirement: Last-Sentence Grounding
The system SHALL ground generated questions in the user's most recent sentence from the active markdown content.

#### Scenario: User has at least one sentence
- **WHEN** the user triggers question generation
- **THEN** the system SHALL extract the latest sentence from the current document
- **AND** the generated questions SHALL be based on that latest sentence context

### Requirement: Exactly Three Rendered Questions
The system SHALL display exactly three generated questions in the Cogito Mode side panel.

#### Scenario: Valid model output is returned
- **WHEN** the model returns a valid JSON payload containing three questions
- **THEN** the panel SHALL render exactly three question entries
- **AND** each entry SHALL expose an insert action for the user

#### Scenario: Invalid model output is returned
- **WHEN** model output is missing JSON or does not contain exactly three questions
- **THEN** the system SHALL show a recoverable error state
- **AND** the editor SHALL remain usable

### Requirement: AI Question Markdown Insertion Format
The system SHALL insert selected questions into the markdown document using a standardized AI block format.

#### Scenario: User inserts a generated question
- **WHEN** the user chooses insert on a generated question
- **THEN** the document SHALL receive the exact block structure:
  - `> ### AI`
  - `<question text>`
- **AND** inserted content SHALL be plain markdown text in the active document

### Requirement: Web-LLM Runtime Integration
The system SHALL use `https://esm.run/@mlc-ai/web-llm` for in-browser question generation.

#### Scenario: Runtime is available
- **WHEN** Cogito Mode initializes successfully
- **THEN** question generation SHALL execute through the web-llm runtime in the browser

#### Scenario: Runtime fails or is unsupported
- **WHEN** web-llm cannot initialize or run inference
- **THEN** the system SHALL present a clear non-blocking error/unsupported state
- **AND** users SHALL continue editing markdown without Cogito Mode assistance
