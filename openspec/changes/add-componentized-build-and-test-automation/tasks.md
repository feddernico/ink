## 1. Implementation
- [x] 1.1 Align source structure with README template: `src/app.ts`, `src/styles.scss`, and HTML template input.
- [x] 1.2 Implement build scripts to compile TypeScript and SASS into `dist/app.min.js` and `dist/styles.min.css`.
- [x] 1.3 Implement template injection so compiled CSS/JS are embedded into the final single-file app output.
- [x] 1.4 Add build commands for one-shot build and watch mode to support rebuilding after file changes.
- [x] 1.5 Update developer documentation for build and run workflows.

## 2. Testing
- [x] 2.1 Add QUnit test harness and configure command(s) to run tests locally.
- [x] 2.2 Add QUnit tests for core interaction logic and markdown editing behavior.
- [x] 2.3 Add Cypress configuration and command(s) to run end-to-end tests locally.
- [x] 2.4 Add Cypress test that covers selecting a workspace, creating a new file, entering markdown content, and saving.
- [x] 2.5 Add test data/setup hooks needed to execute the flow deterministically.

## 3. Validation
- [x] 3.1 Verify build output artifacts are generated as specified.
- [x] 3.2 Verify QUnit and Cypress suites pass from documented commands.
- [x] 3.3 Confirm final app output remains a single self-contained HTML file.
