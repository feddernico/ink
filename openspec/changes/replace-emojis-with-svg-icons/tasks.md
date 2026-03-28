# Tasks: Replace Emojis with SVG Icons

## 1. Foundation

### 1.1 Icon Registry
- [ ] 1.1.1 Create `src/app/icons.ts` exporting an `icon` object with named SVG string functions
- [ ] 1.1.2 Add `folder` icon (Lucide `folder` — closed folder path)
- [ ] 1.1.3 Add `folderOpen` icon (Lucide `folder-open` — open folder path)
- [ ] 1.1.4 Add `fileText` icon (Lucide `file-text` — lined document path)
- [ ] 1.1.5 Add `check` icon (Lucide `check` — simple checkmark path)
- [ ] 1.1.6 All SVG elements include `aria-hidden="true"`, `stroke="currentColor"`, `class="icon"`, and `width`/`height` attributes

### 1.2 SCSS Utility
- [ ] 1.2.1 Add `.icon` utility class to `src/styles.scss` (`display: inline-block`, `vertical-align: middle`, `flex-shrink: 0`, `pointer-events: none`, `color: inherit`)

## 2. File Tree Icons (`src/app/tree-render.ts`)

- [ ] 2.1 Import `icon` from `./icons`
- [ ] 2.2 Replace `"📁"` with `icon.folder()` (collapsed folder state)
- [ ] 2.3 Replace `"📂"` with `icon.folderOpen()` (expanded folder state)
- [ ] 2.4 Replace both instances of `"📝"` with `icon.fileText()`
- [ ] 2.5 Build and visually verify file tree rendering — icons align with folder/file names

## 3. Sidebar Template Icon (`ink.template.html`)

- [ ] 3.1 Replace the `🗂️` emoji inside the Open Workspace `<span class="icon">` with the inline Lucide `folder-open` SVG markup
- [ ] 3.2 Verify the button layout and hover state are unaffected

## 4. Status & Toast Checkmark (`src/app/workspace-io.ts`)

- [ ] 4.1 Replace `"Opened ✓"` → `icon.check() + " Opened"` (or equivalent pattern)
- [ ] 4.2 Replace `"Saved ✓"` → `icon.check() + " Saved"` (two occurrences)
- [ ] 4.3 Replace `"New note created ✓"` → `icon.check() + " New note created"`
- [ ] 4.4 Replace `"Folder created ✓"` → `icon.check() + " Folder created"`
- [ ] 4.5 Replace `"Saved as ${fileName} ✓"` → `` `${icon.check()} Saved as ${fileName}` ``
- [ ] 4.6 Confirm the `icon` import is available in `workspace-io.ts` (add import if needed)
- [ ] 4.7 Verify toast and status bar messages render the check icon correctly in a live browser test

## 5. Build Verification

- [ ] 5.1 Run full build (`node build/compile-and-assemble.js`) — build completes without errors
- [ ] 5.2 Open `ink.html` in a browser — all four icon types render as SVG (not emoji, not broken markup)
- [ ] 5.3 Confirm file tree icons (folder closed, folder open, file) display at the correct size and colour
- [ ] 5.4 Confirm sidebar Open Workspace button icon displays correctly
- [ ] 5.5 Confirm toast and status bar check icons display correctly
- [ ] 5.6 Inspect built HTML source — confirm no unintended HTML entity encoding of SVG content
- [ ] 5.7 Verify no layout regressions in sidebar, file tree, or status bar on a standard viewport
