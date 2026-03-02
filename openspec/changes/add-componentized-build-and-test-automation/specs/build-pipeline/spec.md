## ADDED Requirements
### Requirement: Componentized Source Inputs
The project SHALL maintain separate source files for interaction logic, styling, and template markup.

#### Scenario: Source layout follows project template
- **WHEN** a developer inspects the repository source layout
- **THEN** TypeScript interaction logic is located in `src/app.ts`
- **AND** SASS styling is located in `src/styles.scss`
- **AND** HTML template markup is maintained in a template source file used by the build pipeline

### Requirement: Deterministic Build Outputs
The build pipeline SHALL compile TypeScript and SASS sources into deterministic distributable artifacts.

#### Scenario: One-shot build compiles assets
- **WHEN** a developer runs the documented one-shot build command
- **THEN** the pipeline generates a JavaScript bundle at `dist/app.min.js`
- **AND** the pipeline generates compiled CSS at `dist/styles.min.css`

### Requirement: Single-File Distribution Assembly
The build pipeline SHALL inject compiled JS and CSS artifacts into the HTML template to produce a single-file app output.

#### Scenario: Build injects compiled assets into final HTML
- **WHEN** the injection step runs after asset compilation
- **THEN** the final HTML output contains inline CSS derived from `dist/styles.min.css`
- **AND** the final HTML output contains inline JavaScript derived from `dist/app.min.js`
- **AND** the resulting file is executable in a browser without network dependencies

### Requirement: Incremental Developer Build Workflow
The project SHALL provide a watch-mode build workflow that rebuilds artifacts when source files change.

#### Scenario: Watch mode rebuilds on source edits
- **WHEN** a developer runs the documented watch command and edits TypeScript, SASS, or template source files
- **THEN** relevant compiled artifacts are regenerated without requiring manual command re-entry
