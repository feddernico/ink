## ADDED Requirements
### Requirement: Modular app controller
The system SHALL decompose the app controller into focused feature modules with explicit interfaces and a shared `AppState` passed as an argument.

#### Scenario: Explicit module boundaries
- **WHEN** controller responsibilities are extracted
- **THEN** each module exports named functions for its feature area
- **AND** modules do not access global state or hidden singletons

#### Scenario: Controller orchestration
- **WHEN** the app initializes
- **THEN** the controller constructs `AppState` once
- **AND** passes it explicitly into each module function

### Requirement: Centralized UI event wiring
The system SHALL register UI event listeners in a dedicated `ui-events.ts` module that receives `DomRefs`, `AppState`, and explicit action callbacks.

#### Scenario: UI events registration
- **WHEN** UI events are attached
- **THEN** the controller calls `ui-events` with callbacks for menu actions, shortcuts, and workspace flows

### Requirement: Build/test entrypoint clarity
The system SHALL keep `build/compile-and-assemble.js` as the canonical build entry and use a dedicated test build helper for `npm run build:test`.

#### Scenario: Build entry documentation
- **WHEN** build instructions are documented
- **THEN** they reference `build/compile-and-assemble.js` as the canonical entrypoint

#### Scenario: Test build helper
- **WHEN** the test build runs
- **THEN** it uses a single helper script that centralizes the esbuild configuration
