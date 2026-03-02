## ADDED Requirements
### Requirement: Prioritized Maintainability Refactor Plan
The project SHALL define a maintainability refactor plan with explicit High, Medium, and Low priority tiers based on engineering risk and value.

#### Scenario: Plan is prioritized and actionable
- **WHEN** a maintainer reviews the approved change proposal
- **THEN** the proposal includes clearly separated High, Medium, and Low priority work
- **AND** each tier contains concrete codebase targets

### Requirement: Evidence-Based Refactor Scope
Refactor recommendations MUST be grounded in current repository evidence and MUST avoid unnecessary changes.

#### Scenario: Recommendations are justified
- **WHEN** a recommendation proposes delete, rename, or restructure actions
- **THEN** it references observable repository state (for example dead code, missing script targets, or duplicated logic)
- **AND** the proposal explicitly identifies areas that should remain unchanged when already aligned

### Requirement: Behavior-Preserving Refactor Guardrails
Maintainability refactors SHALL preserve existing user-visible behavior unless a separate feature change is approved.

#### Scenario: Refactor keeps current behavior stable
- **WHEN** maintainability refactor tasks are implemented
- **THEN** build and test workflows continue to pass
- **AND** core authoring flow behavior (open workspace, create note, edit, save) remains unchanged

### Requirement: Tooling and Documentation Consistency
Documented commands and scripts MUST map to files and behavior that exist in the repository.

#### Scenario: Script/docs mismatch is resolved
- **WHEN** package scripts or README commands are documented
- **THEN** each command resolves to existing code paths
- **AND** stale or broken command references are removed or restored
