## ADDED Requirements

### Requirement: CSS Custom Property Theme System
The application SHALL implement color themes using CSS custom properties, with each theme defined as a set of variable overrides on `:root[data-theme="<name>"]`.

#### Scenario: Default theme at initial load
- **WHEN** the application loads with no saved theme preference
- **THEN** no `data-theme` attribute is present on `<html>`
- **AND** the default dark teal palette is applied via `:root` base variables

#### Scenario: Named theme activation
- **WHEN** a named theme (e.g. `monokai`) is applied
- **THEN** `data-theme="monokai"` is set on `<html>`
- **AND** the corresponding CSS variable overrides take effect immediately across all elements
- **AND** no page reload is required

#### Scenario: Returning to default
- **WHEN** the user selects Default (Dark) after a named theme is active
- **THEN** the `data-theme` attribute is removed from `<html>`
- **AND** the base `:root` variable definitions are restored

### Requirement: Theme Persistence
The application SHALL persist the user's theme choice across sessions using `localStorage`.

#### Scenario: Theme saved on selection
- **WHEN** the user selects a theme from the View menu
- **THEN** the theme identifier is written to `localStorage` under the key `ink-theme`

#### Scenario: Theme restored on load
- **WHEN** the application initialises and a valid theme identifier exists in `localStorage`
- **THEN** that theme is applied before the first render
- **AND** the user sees their previously chosen colours immediately, without a flash of the default theme

#### Scenario: Invalid or missing stored value
- **WHEN** the application initialises and `localStorage` contains no `ink-theme` key or an unrecognised value
- **THEN** the default dark theme is applied
- **AND** no error is shown to the user

### Requirement: Available Colour Styles
The application SHALL provide the following seven colour styles, modeled on RStudio's built-in themes.

| Theme | Character |
|-------|-----------|
| Default (Dark) | Dark teal, original ink palette |
| Classic | Light neutral white/grey, blue accent |
| Cobalt | Dark ocean blue, gold accent |
| Monokai | Dark charcoal, green/pink highlights |
| Office | Clean professional light, Microsoft blue |
| Twilight | Warm dark grey, amber accent |
| Xcode | Crisp Apple-style light, Xcode blue |

#### Scenario: Each theme covers all required variables
- **WHEN** any named theme is active
- **THEN** all CSS custom properties (`--bg`, `--panel`, `--panel2`, `--border`, `--muted`, `--text`, `--accent`, `--danger`, `--ok`, `--warn`, `--shadow`, `--body-bg`) are defined
- **AND** no variable falls back to an unintended value from another theme
