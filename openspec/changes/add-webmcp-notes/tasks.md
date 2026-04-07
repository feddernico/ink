## 1. Implementation
- [x] 1.1 Add a declarative WebMCP note form to `ink.template.html`
- [x] 1.2 Add DOM references for the WebMCP form and fields
- [x] 1.3 Add a workspace action that creates notes from declarative form input
- [x] 1.4 Intercept WebMCP form submission and return an agent response without page navigation
- [x] 1.5 Ensure note creation works with both open workspaces and temporary in-memory sessions
- [x] 1.6 Update `.github/copilot-instructions.md` with the new WebMCP integration guidance

## 2. Validation
- [x] 2.1 Validate the OpenSpec change with `openspec validate add-webmcp-notes-tool --strict`
- [x] 2.2 Build the app successfully
- [x] 2.3 Run the QUnit test suite successfully
