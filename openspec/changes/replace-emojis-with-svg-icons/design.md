# Design: Replace Emojis with SVG Icons

## Context

Ink is a single-file, offline-first markdown editor. Its build system inlines all CSS and JavaScript into one HTML file with no external runtime dependencies. Any icon solution must therefore be embeddable at build time — no CDN fonts, no external sprite sheets.

The application currently uses four distinct emoji icons in the UI:

| Location | Emoji | Semantic meaning |
|---|---|---|
| `tree-render.ts` | 📁 | Collapsed folder in file tree |
| `tree-render.ts` | 📂 | Expanded folder in file tree |
| `tree-render.ts` | 📝 | Markdown file/note in file tree |
| `ink.template.html` | 🗂️ | "Open Workspace" button in sidebar |

Additionally, the `✓` character is used in status bar messages and toast notifications in `workspace-io.ts` to signal success.

## Goals / Non-Goals

### Goals
- Consistent, crisp icon rendering across all operating systems and browsers
- Full CSS controllability (color, size, opacity, transitions)
- Zero additional runtime dependencies — icons embedded inline at build time
- Accessible: icons are decorative where text labels exist; `aria-hidden="true"` applied appropriately
- Minimal diff — change only what renders icons, leave surrounding logic untouched

### Non-Goals
- Introduce an icon font (conflicts with offline/single-file constraint)
- Replace every possible decorative character (scope is limited to UI icons listed above)
- Change keyboard shortcuts, layout, or menu structure
- Add animations to icons in this change

## Decisions

### Icon Library Selection
**Decision**: Use inline SVG strings sourced from [Lucide Icons](https://lucide.dev) (MIT licence).

**Rationale**: Lucide provides a consistent, minimal, single-weight line-icon style that matches the clean aesthetic of Ink. Icons are plain SVG paths with no external dependencies, trivially inlineable as template literals in TypeScript. The MIT licence is compatible with the project.

**Mapping**:

| Emoji | Lucide icon name | SVG element |
|---|---|---|
| 📁 | `folder` | `<svg>` with folder closed path |
| 📂 | `folder-open` | `<svg>` with folder open path |
| 📝 | `file-text` | `<svg>` with lined document path |
| 🗂️ | `folder-open` | Same as expanded folder (contextually correct for "open workspace") |
| ✓  | `check` | Small inline check SVG, or replaced by a CSS `::before` pseudo-element on `.status-ok` |

**Alternatives considered**:
- Heroicons: Similar quality but slightly heavier paths; rejected in favour of Lucide's tighter output
- Phosphor Icons: Excellent but larger library; unnecessary for five icons
- Custom hand-drawn SVGs: Maintainability risk; rejected
- Icon font (e.g. Bootstrap Icons via CDN): Violates offline/single-file constraint; rejected

### Icon Registry Pattern
**Decision**: Create a small helper module `src/app/icons.ts` that exports named functions returning SVG strings.

```ts
// src/app/icons.ts
export const icon = {
  folder: () => `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true" class="icon">
    <!-- Lucide folder path -->
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>`,

  folderOpen: () => `<svg ...><!-- Lucide folder-open path --></svg>`,
  fileText:   () => `<svg ...><!-- Lucide file-text path --></svg>`,
  check:      () => `<svg ...><!-- Lucide check path --></svg>`,
};
```

**Rationale**: A single source-of-truth for icon markup prevents duplication. The functions can later accept size or class overrides if needed.

**Alternatives considered**:
- Inline SVG strings at each call site: Duplicates markup and is hard to update; rejected
- Importing SVG files via build plugin: Requires changes to the custom build script; rejected for complexity

### Checkmark Replacement Strategy
**Decision**: Replace the `✓` character in status/toast strings with a small inline SVG icon prepended to the message text. The icon carries `aria-hidden="true"`; the surrounding text already provides the semantic meaning.

**Rationale**: This preserves accessibility (screen readers read the text, not the icon) while giving visual users a crisp icon instead of an emoji.

**Alternatives considered**:
- CSS `::before` pseudo-element on `.status-ok` class: Cleaner separation but requires class to be set reliably on the container; could be adopted in a follow-up refactor
- Keep `✓` as plain Unicode: Renders inconsistently; defeats the purpose of this change

### SCSS Styling
**Decision**: Add a `.icon` utility class in `styles.scss` that normalises SVG icon display.

```scss
.icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
  color: inherit;       // inherits text colour for easy theming
  pointer-events: none; // icons should not intercept clicks
}
```

**Rationale**: A single class handles alignment across all icon placements without per-site overrides.

## Risks / Trade-offs

### Risk: SVG strings in template literals may be escaped by the build assembler
**Mitigation**: Audit `build/compile-and-assemble.js` to confirm SVG strings in JavaScript template literals pass through without HTML-entity encoding. Test the built `ink.html` output in a browser before marking complete.

### Risk: Icon sizing mismatch with existing layout
**Mitigation**: Use `width="16" height="16"` with `vertical-align: middle` as a baseline; adjust per context in SCSS if needed. Review visually in the sidebar, file tree, and status bar.

### Risk: Colour contrast regression
**Mitigation**: Using `stroke="currentColor"` means icons inherit the surrounding text colour automatically, preserving existing contrast ratios.

## Migration Plan

### Phase 1: Foundation
1. Create `src/app/icons.ts` with SVG strings for all required icons.
2. Add `.icon` CSS class to `styles.scss`.

### Phase 2: Tree Icons
1. Update `tree-render.ts` to import and use `icon.folder`, `icon.folderOpen`, and `icon.fileText`.
2. Build and visually verify the file tree.

### Phase 3: Template Icon
1. Replace the 🗂️ emoji in `ink.template.html` with the inline Lucide `folder-open` SVG.

### Phase 4: Status / Toast Checkmark
1. Update `workspace-io.ts` status and toast strings to use `icon.check()` prepended to message text.
2. Verify toast and status bar rendering.

### Phase 5: Build Verification
1. Run the full build (`node build/compile-and-assemble.js`).
2. Open `ink.html` in a browser and inspect all icon placements.
3. Confirm single-file output integrity.

### Rollback Plan
All changes are isolated to icon strings and SCSS. To rollback:
1. Revert emoji strings in `tree-render.ts`, `ink.template.html`, and `workspace-io.ts`.
2. Remove `icons.ts` and the `.icon` SCSS rule.
No data or logic is affected.

## Open Questions

1. **Should the check icon in toasts also appear in the "Saved ✓" status bar text, or only in toasts?** — Recommend applying consistently to both for visual cohesion.
2. **Should icon size vary between the file tree (16px) and the sidebar button (20px)?** — The `icon()` functions could accept an optional `size` parameter to handle this; defer to implementation.
3. **Should this change also address future icon needs (e.g. sort, collapse, refresh actions)?** — Out of scope for this change; a follow-up "icon system" change can extend the registry.
