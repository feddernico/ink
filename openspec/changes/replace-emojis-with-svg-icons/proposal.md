# Change: Replace Emojis with SVG Icons

## Why

The application currently uses Unicode emojis (📁, 📂, 📝, 🗂️, ✓) as UI icons across the file tree and status messages. Emojis render inconsistently across operating systems, browsers, and display densities — a folder icon looks different on macOS, Windows, and Linux. This inconsistency undermines the clean, focused aesthetic of Ink and gives the interface an informal, unpolished appearance.

Replacing emojis with a curated set of inline SVG icons delivers pixel-perfect, resolution-independent rendering everywhere, brings visual consistency, and allows full control over color, size, and hover states through CSS — resulting in a significantly more modern and professional look.

## What Changes

- Select a lightweight, offline-compatible SVG icon set (e.g. Lucide Icons or Heroicons) that can be inlined directly into the HTML template and TypeScript source, preserving the no-external-dependencies constraint.
- Define a small icon registry/helper that produces `<svg>` strings for each named icon, reusable across template and script code.
- Replace all emoji usage in `src/app/tree-render.ts` (📁, 📂, 📝) with the corresponding inline SVG icons.
- Replace the emoji in `ink.template.html` (🗂️ in the "Open Workspace" sidebar button) with an inline SVG icon.
- Replace the plain-text checkmark (✓) used in status and toast messages in `src/app/workspace-io.ts` with a styled SVG check icon or a dedicated CSS-driven indicator class, ensuring screen readers still receive meaningful text.
- Add SCSS rules to size, color, and align the new SVG icons consistently with surrounding text and buttons.
- Ensure no regressions in layout, accessibility (ARIA labels remain intact), or build output (single-file constraint).

## Impact

- Affected files:
  - `src/app/tree-render.ts` — emoji icon strings replaced with SVG helper calls
  - `src/app/workspace-io.ts` — checkmark emoji in status/toast strings replaced
  - `ink.template.html` — 🗂️ emoji replaced in the sidebar Open Workspace button
  - `src/styles.scss` — new icon sizing and color utility rules
  - `build/compile-and-assemble.js` — verify SVG strings survive the inline assembly step without encoding issues
- Affected specs: none existing
- No new runtime dependencies introduced; SVG markup is embedded at build time
- Build output remains a single self-contained HTML file
