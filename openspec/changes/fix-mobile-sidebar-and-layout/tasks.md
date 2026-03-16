## 1. Sidebar Toggle Visibility on Mobile

- [x] 1.1 Remove `display: none` from `.sidebarToggle` inside the `@media (max-width: 980px)` block in `src/styles.scss`.
- [x] 1.2 Remove `display: none` from `.sidebar.collapsed .sidebarToggle` inside the same media block.
- [x] 1.3 Inside the media block render the toggle as a full-width horizontal button: set `width: calc(100% - 20px)`, reset `writing-mode: horizontal-tb`, `text-orientation: mixed`, `letter-spacing: normal`.
- [x] 1.4 Set `display: flex` on `.sidebar.collapsed .sidebarToggle` in the media block so it is explicitly visible when collapsed.
- [x] 1.5 Verify the toggle button is visible and tappable on a ≤ 980 px viewport both when the sidebar is expanded and when it is collapsed.

## 2. Sidebar Collapsed State Collapses Vertically on Mobile

- [x] 2.1 Inside the `@media (max-width: 980px)` block add `height: auto; min-height: 0` to `.sidebar.collapsed` so the sidebar row shrinks to just the toggle strip when collapsed.
- [x] 2.2 Add `.app.sidebar-collapsed { grid-template-columns: 1fr; }` inside the media block to override the base `64px 1fr` rule and prevent a two-column layout appearing on mobile when the sidebar is collapsed.
- [x] 2.3 Confirm `.sidebar.collapsed .sidebarPanel { display: none; }` remains active and is not overridden.
- [x] 2.4 Verify that tapping the toggle on a collapsed sidebar expands it and shows the workspace panel; tapping again collapses it back to the strip.

## 3. App Grid Fills Viewport Height on Mobile

- [x] 3.1 Inside the `@media (max-width: 980px)` block replace `grid-auto-rows: max-content` and `align-content: start` with `grid-template-rows: auto auto 1fr` and `height: 100%` on `.app`.
- [x] 3.2 Confirm that `html, body { height: 100%; }` is already declared at the base level in `src/styles.scss` (confirmed at line 126).
- [x] 3.3 Verify the main editor row fills all remaining viewport height below the menu bar and sidebar.

## 4. Editor and Preview Fill Available Vertical Space

- [x] 4.1 Add `min-height: 40vh` to `.editorPane` inside the mobile media block so the editor pane is usably tall when stacked below the preview.
- [x] 4.2 Add `min-height: 40vh` to `.previewPane` inside the mobile media block.
- [x] 4.3 Confirm `textarea { height: 100%; }` is set at the base level and not overridden in the media block.
- [x] 4.4 Verify on a 390 × 844 px viewport that the textarea fills its pane and scrolling (if any) occurs inside the pane, not on the outer page.

## 5. Build and Verification

- [x] 5.1 Run `npm run build` and confirm zero errors.
- [x] 5.2 Run `npm run test:qunit` and confirm all 32 tests pass.
- [x] 5.3 Verify on a ≤ 980 px viewport:
  - Sidebar toggle is visible in both expanded and collapsed states.
  - Collapsing the sidebar shrinks it to a horizontal strip at the top; editor expands to fill the freed vertical space.
  - Expanding restores the full sidebar panel.
  - Textarea and preview panes fill the viewport height without outer-page scrolling.
- [x] 5.4 Verify on a > 980 px viewport that the desktop two-column layout is unaffected.
