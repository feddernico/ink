# Change: Fix Mobile Sidebar Toggle and Vertical Layout

## Why

On small screens (viewport width ≤ 980 px) the application has three related layout defects:

1. **Sidebar toggle is hidden.** The `@media (max-width: 980px)` block sets `.sidebarToggle { display: none; }` unconditionally, and also hides it in the `.sidebar.collapsed` state. This means the user has no way to collapse or expand the sidebar on a mobile device, even though the collapse logic is fully wired in JavaScript.

2. **Main pane does not reflow when the sidebar collapses on mobile.** On desktop the app grid switches from `320px 1fr` to `64px 1fr`, freeing horizontal space for the editor. On mobile the layout is already a single-column stack, so collapse must work vertically: when the user collapses the sidebar its row should shrink to just the toggle strip height, and the editor row should expand to fill the freed vertical space.

3. **Editor and preview do not fill the available vertical space on mobile.** The mobile grid uses `grid-auto-rows: max-content` and `align-content: start`, which causes rows to shrink to their content size. This means the `<main>` panel — and consequently `.split`, `.editorPane`, `.previewPane`, and `<textarea>` — never stretch to fill the viewport. On a phone the writing area is only as tall as its content, requiring the user to scroll the outer page rather than scroll inside the editor or preview pane.

## What Changes

### `src/styles.scss`

**Sidebar toggle on mobile** — Remove the `display: none` rules for `.sidebarToggle` and `.sidebar.collapsed .sidebarToggle` inside the `@media (max-width: 980px)` block. Always show the toggle as a full-width horizontal button (reset `writing-mode`, `text-orientation`, `letter-spacing`, set `width: calc(100% - 20px)`).

**Sidebar collapsed state on mobile** — When `.sidebar.collapsed` on mobile, add `height: auto; min-height: 0` so the sidebar row shrinks to just the toggle button height. Keep `.sidebar.collapsed .sidebarPanel { display: none; }`. Set `display: flex` on `.sidebar.collapsed .sidebarToggle` so it remains visible.

**App grid on mobile** — Replace `grid-auto-rows: max-content; align-content: start` with `grid-template-rows: auto auto 1fr` and `height: 100%` so:
- Row 1 (menu bar): `auto`
- Row 2 (sidebar): `auto` — collapses to toggle-height when sidebar is collapsed
- Row 3 (main editor): `1fr` — always fills all remaining viewport height

**Collapsed column override** — Add `.app.sidebar-collapsed { grid-template-columns: 1fr; }` inside the mobile breakpoint to prevent the base-level `64px 1fr` rule from reintroducing a two-column layout when the sidebar is collapsed on mobile.

**Editor and preview minimum heights** — Add `min-height: 40vh` to `.editorPane` and `.previewPane` so both panes are usably tall when stacked vertically.

### `ink.template.html` / `ink-app.html`

No structural changes required. `#sidebarToggleBtn` already exists; its label and `aria-expanded` state are managed by `setSidebarCollapsed()` in `bootstrap.ts`.

### `src/app/bootstrap.ts`

No logic changes required. The existing `setSidebarCollapsed()` already handles everything once the CSS correctly exposes the button on mobile.

## Impact

- Affected specs: `mobile-layout`
- Affected code:
  - `src/styles.scss` — mobile `@media` block rewritten
  - `dist/styles.min.css` (rebuilt)
  - `ink-app.html` (rebuilt)

## Test Baseline

QUnit suite confirmed at **32 / 32 passing** before any changes are made. The implementation must not reduce this count.
