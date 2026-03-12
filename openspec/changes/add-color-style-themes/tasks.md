## 1. CSS Theme System

- [x] 1.1 Introduce `--body-bg` CSS custom property to allow per-theme control of the body background gradient.
- [x] 1.2 Define `Default (Dark)` base theme variables in `:root` (existing dark teal palette, refactored to use `--body-bg`).
- [x] 1.3 Define `Classic` theme — light neutral white/grey, blue accent (`#2c6fad`).
- [x] 1.4 Define `Cobalt` theme — dark ocean blue (`#001f3d`) with gold accent (`#ffd700`) and a blue radial gradient.
- [x] 1.5 Define `Monokai` theme — dark (`#272822`) with green accent (`#a6e22e`) and pink/green radial gradients.
- [x] 1.6 Define `Office` theme — clean professional light, Microsoft blue accent (`#0078d4`).
- [x] 1.7 Define `Twilight` theme — warm dark grey (`#141414`), amber accent (`#d4a96a`).
- [x] 1.8 Define `Xcode` theme — crisp light (`#f9f9f9`), Apple blue accent (`#0070c1`).
- [x] 1.9 Add `.menu-theme-check` CSS class for the active-theme checkmark indicator in the dropdown.

## 2. View Menu (HTML Template)

- [x] 2.1 Add a `View` menu item to `ink.template.html` between Edit and Import/Export.
- [x] 2.2 Add dropdown list items for all seven themes, each with `data-action="theme-<name>"`.
- [x] 2.3 Add `<span class="menu-theme-check" id="themeCheck-<name>">✓</span>` to each theme item for active-state indication.
- [x] 2.4 Include a separator between Default (Dark) and the six named themes.

## 3. Theme Logic (TypeScript)

- [x] 3.1 Add `VALID_THEMES` constant array listing all accepted theme identifiers.
- [x] 3.2 Implement `applyTheme(theme: string)` method that sets/removes the `data-theme` attribute on `document.documentElement`, saves to `localStorage`, and updates the checkmark indicator.
- [x] 3.3 Implement `loadTheme()` method that reads `localStorage` on startup and calls `applyTheme()` with the saved value (defaulting to `"default"` if absent or invalid).
- [x] 3.4 Call `loadTheme()` from `initialize()` before other UI setup.
- [x] 3.5 Add `theme-default`, `theme-classic`, `theme-cobalt`, `theme-monokai`, `theme-office`, `theme-twilight`, and `theme-xcode` cases to `handleMenuAction()`.

## 4. Build and Verification

- [x] 4.1 Run `npm run build` to recompile TypeScript, SCSS, and assemble `ink-app.html`.
- [x] 4.2 Verify the View menu appears in the menu bar between Edit and Import/Export.
- [x] 4.3 Verify each theme applies immediately on selection with correct colours.
- [x] 4.4 Verify the checkmark moves to the newly selected theme.
- [x] 4.5 Verify the selected theme persists across page reloads via `localStorage`.

## 5. Documentation

- [x] 5.1 Update `replit.md` with a Color Themes section describing each theme and the persistence mechanism.
- [x] 5.2 Create this openspec change request.
