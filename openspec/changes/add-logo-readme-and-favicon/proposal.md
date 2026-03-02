# Change: Add Project Logo to README and Favicon Assets

## Why
The repository currently lacks consistent branding assets in project documentation and browser metadata. Adding the provided logo to `README.md` and defining favicon outputs improves recognizability and presentation.

## What Changes
- Add a canonical logo asset in the repository based on `~/Downloads/ink_logo.svg`.
- Update `README.md` to render the project logo near the top of the document.
- Define and implement favicon outputs derived from the same logo source.
- Wire favicon references into the app HTML template so browser tabs use project branding.
- Document the asset location and favicon generation/update workflow.

## Impact
- Affected specs: `branding-assets`
- Affected code:
  - `README.md`
  - `ink.template.html`
  - `build/` scripts (if favicon generation is automated in build)
  - `dist/` favicon artifacts
  - `assets/` branding source files (new)
