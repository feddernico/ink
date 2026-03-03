## 1. UI Controls and State
- [x] 1.1 Add a left menu toggle control that supports collapse and expand actions.
- [x] 1.2 Implement menu state management in the app so toggle actions update layout consistently.
- [x] 1.3 Define and implement the default menu state on initial load.

## 2. Layout and Styling
- [x] 2.1 Update layout styles so collapsing the menu increases main editor horizontal space.
- [x] 2.2 Ensure expanded state preserves existing navigation usability and visual hierarchy.
- [x] 2.3 Ensure collapsed state keeps the toggle discoverable and usable.

## 3. Accessibility and Interaction
- [x] 3.1 Ensure the toggle is keyboard-focusable and operable.
- [x] 3.2 Ensure toggle semantics expose menu state changes to assistive technologies.

## 4. Verification
- [x] 4.1 Verify users can collapse and re-expand the menu in a modern browser.
- [x] 4.2 Verify editor content area width increases when the menu is collapsed.
- [x] 4.3 Verify keyboard-only users can operate the toggle and retain navigation control.
- [x] 4.4 Add a Cypress end-to-end test that validates left menu collapse/expand behavior and resulting layout changes.
