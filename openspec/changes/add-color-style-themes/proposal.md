# Change: Add Color Style Themes

## Why

Ink currently uses a single fixed dark color scheme. Users have different preferences and work in different lighting environments, so a fixed style limits comfort and accessibility. Providing a set of well-known color themes — modeled on those available in RStudio — gives users immediate visual choices without requiring any configuration beyond a single menu click.

## What Changes

- Add a **View** top-level menu to the existing office-style menu bar, placed between Edit and Import/Export.
- The View menu lists seven color styles: Default (Dark), Classic, Cobalt, Monokai, Office, Twilight, and Xcode.
- Selecting a style applies it immediately by setting a `data-theme` attribute on the `<html>` element.
- Each theme is defined as a set of CSS custom property overrides in `src/styles.scss` using `:root[data-theme="<name>"]` selectors.
- The active theme is indicated by a checkmark (✓) next to the selected item in the menu.
- The selected theme is persisted to `localStorage` under the key `ink-theme` and restored on next load.
- The body background gradient is theme-aware via a `--body-bg` CSS custom property.

## Impact

- Affected specs: `theming`, `view-menu`
- Affected code:
  - `ink.template.html` — View menu added
  - `src/styles.scss` — theme CSS custom properties added, `--body-bg` variable introduced
  - `src/app/bootstrap.ts` — `applyTheme()` and `loadTheme()` methods added; new `theme-*` action cases in `handleMenuAction()`
  - `dist/app.min.js` (rebuilt)
  - `dist/styles.min.css` (rebuilt)
  - `ink-app.html` (rebuilt)
