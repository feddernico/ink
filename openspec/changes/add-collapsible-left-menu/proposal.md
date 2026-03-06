# Change: Add User-Controlled Collapsible Left Menu

## Why
The current left menu is fixed, which reduces usable editor space on smaller screens and during focused writing. Allowing users to collapse and expand the menu improves layout flexibility without removing existing navigation.

## What Changes
- Add support for collapsing and expanding the left menu from within the UI.
- Add a persistent toggle control so users can switch menu state on demand.
- Update layout behavior so editor content reflows to use freed horizontal space when the menu is collapsed.
- Preserve keyboard and pointer accessibility for the menu toggle interaction.
- Define expected default menu behavior at app start.

## Impact
- Affected specs: `editor-layout`
- Affected code:
  - `ink.template.html`
  - `src/app.ts`
  - `src/styles.scss`
  - `dist/app.min.js` (rebuilt)
  - `dist/styles.min.css` (rebuilt)
