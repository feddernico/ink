## 1. Dependency Setup
- [x] 1.1 Add `marked` as an npm dependency via `npm install marked`.

## 2. Code Migration
- [x] 2.1 Import `marked` directly in `src/app/bootstrap.ts` using a typed ESM import.
- [x] 2.2 Replace all `window.marked` usages with the imported `marked` instance.
- [x] 2.3 Remove any TypeScript workarounds or declarations related to `window.marked`.

## 3. Template Cleanup
- [x] 3.1 Remove the inlined `<script>` block containing the minified `marked` source from `ink.template.html`.

## 4. Verification
- [x] 4.1 Run `npm run build` and confirm the build succeeds with `marked` bundled by esbuild.
- [x] 4.2 Verify markdown rendering works correctly in the app after the migration.
- [x] 4.3 Confirm the final `ink-app.html` output has no external script references to jsDelivr or any CDN.
