# Change: Add a Declarative WebMCP Note Creation Tool

## Why
Ink already supports creating markdown notes, but it does not expose that capability through a declarative WebMCP tool. Adding a form-backed tool lets browser agents create notes through a stable contract instead of brittle UI automation.

## What Changes
- Add a declarative WebMCP `create_note` form to `ink.template.html`
- Route declarative form submissions into Ink's existing note creation flows
- Return a structured response for agent-invoked submissions without navigating away
- Fall back to a temporary in-memory session when no workspace is open so the tool remains usable

## Impact
- Affected specs: webmcp-notes (new capability)
- Affected code: `ink.template.html`, `src/app/ui-events.ts`, `src/app/workspace-io.ts`, `src/app/app-controller.ts`, `src/app/dom.ts`, `src/app/types.ts`, `.github/copilot-instructions.md`
- No breaking changes to existing keyboard or menu note workflows
