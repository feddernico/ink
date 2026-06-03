## MODIFIED Requirements
### Requirement: Mobile Text Input Support
The system SHALL provide a comfortable editing experience on mobile devices without unwanted zoom behavior.

#### Scenario: Tap textarea on mobile device
- **WHEN** user taps the textarea on a mobile device
- **THEN** the textarea does not trigger automatic browser zoom
- **AND** the font-size is at least 16px to prevent iOS Safari zoom behavior

#### Scenario: Desktop editing experience unchanged
- **WHEN** user edits on desktop viewport
- **THEN** the textarea maintains the original 14px font-size
- **AND** the editing experience remains consistent with previous behavior