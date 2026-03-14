# Change: Migrate marked to npm Dependency

## Why
The `marked` library is currently inlined as a minified script block inside `ink.template.html`, manually downloaded from jsDelivr. This makes updates error-prone (requires manual copy-paste of minified code), bloats the template file, and prevents TypeScript from using typed imports. Since the project already uses esbuild for bundling, adding `marked` as an npm dependency is the correct approach: esbuild will bundle it into `dist/app.min.js` at build time, preserving the self-contained nature of the final output with no runtime external dependencies.

## What Changes
- Add `marked` as an npm dependency.
- Replace `window.marked` usages in `src/app/bootstrap.ts` with a direct TypeScript import.
- Remove the inlined `<script>` block containing the minified `marked` source from `ink.template.html`.

## Impact
- Affected code:
  - `package.json` (new dependency)
  - `ink.template.html` (remove inlined script)
  - `src/app/bootstrap.ts` (replace `window.marked` with typed import)
  - `dist/app.min.js` (rebuilt, `marked` bundled by esbuild)
