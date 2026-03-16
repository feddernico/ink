# Spec: Mobile Layout

## Sidebar Toggle Always Visible on Small Screens

The sidebar toggle button (`#sidebarToggleBtn`) SHALL be visible and interactive at all viewport widths, including those ≤ 980 px.

#### Scenario: App loads on a mobile device — sidebar expanded

- **GIVEN** a viewport width of 390 px
- **WHEN** the app finishes loading
- **THEN** the sidebar toggle button is rendered as a full-width horizontal button inside the sidebar
- **AND** the button label reads "▶ Collapse" with `aria-label="Collapse sidebar"`

#### Scenario: App loads on a mobile device — sidebar collapsed

- **GIVEN** a viewport width of 390 px and the sidebar state persisted as collapsed
- **WHEN** the app finishes loading
- **THEN** the sidebar is shown as a thin horizontal strip
- **AND** the toggle button is visible within that strip, reading "▼ Expand" with `aria-label="Expand sidebar"`

---

## Sidebar Collapses and Expands Vertically on Mobile

On small screens the sidebar SHALL collapse and expand vertically (row height), not horizontally (column width).

#### Scenario: User collapses sidebar on mobile

- **GIVEN** the sidebar is expanded on a ≤ 980 px viewport
- **WHEN** the user taps the sidebar toggle button
- **THEN** the sidebar shrinks to a horizontal strip showing only the toggle button
- **AND** the editor and preview area expand vertically to occupy the freed space
- **AND** the layout remains a single full-width column (no narrow sidebar column appears alongside the editor)

#### Scenario: User expands sidebar on mobile

- **GIVEN** the sidebar is collapsed on a ≤ 980 px viewport
- **WHEN** the user taps the toggle strip
- **THEN** the sidebar expands to show the full workspace panel (workspace name, search, file tree, tags)
- **AND** the editor area returns to its position below the sidebar

---

## Editor and Preview Fill Available Vertical Space

The editor (`<textarea>`) and preview pane SHALL fill the available vertical space of the viewport on mobile without requiring the user to scroll the outer page.

#### Scenario: App loads on a mobile device with no note open

- **GIVEN** a viewport height of 844 px
- **WHEN** the app finishes initialising
- **THEN** the editor pane and preview pane together fill the full height below the menu bar and sidebar
- **AND** any scrolling occurs inside the editor or preview pane, not on the outer page

#### Scenario: Long note open on mobile

- **GIVEN** a note whose rendered content exceeds the viewport height
- **WHEN** the note is opened on a ≤ 980 px viewport
- **THEN** the editor textarea is scrollable within its own bounds
- **AND** the preview pane is scrollable within its own bounds
- **AND** the outer page does not scroll

---

## Desktop Layout Unchanged

Changes to the mobile breakpoint SHALL NOT affect the layout at viewport widths > 980 px.

#### Scenario: App viewed on a desktop

- **GIVEN** a viewport width of 1280 px
- **WHEN** the app loads
- **THEN** the sidebar occupies the left column (320 px expanded, 64 px collapsed)
- **AND** the main editor occupies the right column and fills the full viewport height
