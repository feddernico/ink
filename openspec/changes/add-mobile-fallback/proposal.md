# Change: Add Mobile Fallback Support for Browsers Without File System Access API

## Why
Mobile browsers (e.g., Safari on iOS) do not support the File System Access API. Currently, ink shows an error message and prevents users from using the app. This excludes mobile users entirely. Instead, we should allow temporary in-memory work and provide export capabilities so users can download their notes.

## What Changes
- Detect when File System Access API is unavailable
- Enable in-memory workspace mode for temporary editing
- Add "Export as JSON" button to download all notes as a JSON file
- Add "Export as Markdown" button to download individual notes as .md files
- Show informative UI about temporary nature of the session
- Preserve existing functionality for desktop browsers with FS API support

## Impact
- Affected specs: mobile-support (new capability)
- Affected code: src/app/bootstrap.ts, src/app/fs-api.ts, ink-app.html, styles
- No breaking changes to existing desktop functionality
