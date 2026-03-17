## ADDED Requirements
### Requirement: Refactor and simplification plan
The system SHALL provide a refactor and simplification plan that aligns the codebase with the AI-first coding principles.

#### Scenario: Prioritized recommendations
- **WHEN** a plan is produced
- **THEN** it includes high, medium, and low priority sections
- **AND** only recommends changes that improve alignment with the coding principles

#### Scenario: Deletion and renaming guidance
- **WHEN** a plan is produced
- **THEN** it identifies code or files that can be deleted
- **AND** it calls out candidates for renaming or restructuring

#### Scenario: No-change guidance
- **WHEN** a plan is produced
- **THEN** it states which areas do not need change to avoid unnecessary churn
