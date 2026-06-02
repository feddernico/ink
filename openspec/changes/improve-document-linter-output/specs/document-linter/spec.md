## MODIFIED Requirements
### Requirement: Document Linter
The system SHALL provide a linting and review tool for markdown documents that analyzes prose and structure to provide actionable writing suggestions.

#### Scenario: Analyze current document
- **WHEN** the user activates the Document Linter
- **THEN** the system parses the currently open document and returns suggestions grouped by clarity, flow, scannability, and engagement
- **AND** the report highlights the highest-priority fixes first
- **AND** the report summary distinguishes between structural issues, prose issues, and low-signal sections

#### Scenario: Ignore code chunks during analysis
- **WHEN** the user enables the "ignore code cells" toggle
- **THEN** the system downweights or excludes code chunks from the analysis and focuses only on human-facing text

#### Scenario: Generate section-specific suggestions
- **WHEN** the system analyzes a document
- **THEN** it returns actionable suggestions tied to exact lines or sections, such as "opening is vague" or "paragraphs are too dense"
- **AND** it avoids classifying markdown bullets, headings, and quoted callouts as generic long sentences

#### Scenario: Provide readability metrics
- **WHEN** the system analyzes prose content
- **THEN** it calculates readability scores based on sentence length, word complexity, and reading level

#### Scenario: Assess skimmability
- **WHEN** the system analyzes document structure
- **THEN** it evaluates headings, bullets, paragraph size, and scan-friendly structure

#### Scenario: Score engagement proxies
- **WHEN** the system analyzes content for engagement
- **THEN** it considers title strength, quotes, links, vocabulary richness, and length balance

#### Scenario: Check style quality
- **WHEN** the system analyzes prose
- **THEN** it identifies spelling errors and style consistency issues

#### Scenario: Export suggestions as markdown
- **WHEN** the user requests export
- **THEN** the system outputs the suggestions in markdown format
- **AND** the export includes a concise summary, prioritized fixes, and section-level detail
