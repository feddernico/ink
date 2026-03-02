# Project Context

## Purpose
Ink is a web application for writing and editing markdown documents with export capabilities. It provides a clean, focused interface for markdown editing and document generation.

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **Markdown Processing**: Marked.js v15.0.12 (embedded)
- **Build System**: Custom Node.js build script (build/inject.js)
- **HTML Template**: Custom template system with inlined CSS/JS
- **Target**: Single-page web application (ink.html)

## Project Conventions

### Code Style

- ES6+ JavaScript modules
- Minimal dependencies - prefers vanilla JavaScript
- Single-file build output (ink.html) with inlined assets
- Functional programming patterns preferred

### Architecture Patterns

- **Single File Architecture**: Final build is a self-contained HTML file
- **Template Injection**: CSS and JS are injected into HTML template during build
- **No Build Framework**: Custom build process without webpack/rollup/etc.
- **Client-side Only**: Pure frontend application with no server requirements

### Testing Strategy

- No formal testing framework currently implemented
- Manual testing via browser
- Build verification through file generation

### Git Workflow

- Simple trunk-based development
- Commits should be descriptive of changes
- Main branch contains production-ready code

## Domain Context

- **Markdown Editing**: Core focus on markdown document creation and editing
- **Document Export**: Ability to export markdown to various formats
- **Offline Usage**: Application should work without internet connectivity
- **Single User**: Designed for individual document creation

## Important Constraints

- **Single File Output**: Must build to a single HTML file (ink.html)
- **No External Dependencies**: Runtime should work without CDN/internet
- **Cross-browser**: Must work in modern browsers
- **Lightweight**: Keep file size minimal for fast loading
- **No Server**: Pure client-side application

## External Dependencies

- **Marked.js**: Markdown parser library (embedded in build)
- **No External APIs**: Application works completely offline
- **No Backend**: No server-side components required

## Additional Instructions

Extracted from `https://burkeholland.github.io/posts/opus-4-5-change-everything/`

Assume all code will be written and maintained by LLMs, not humans. Optimize for model reasoning, regeneration, and debugging — not human aesthetics.

Your goal: produce code that is predictable, debuggable, and easy for future LLMs to rewrite or extend.

Your context window size is limited - especially the output. So you should always work in discrete steps and run each step using a subagent. You want to avoid putting anything in the main context window when possible.

ALWAYS use context to read relevant documentation. Do this every time you are working with a language, framework, library etc. Never assume that you know the answer as these things change frequently. Your training date is in the past so your knowledge is likely out of date, even if it is a technology you are familiar with.

Each time you complete a task or learn important information about the project, you should update the `.github/copilot-instructions.md` or any `agent.md` file that might be in the project to reflect any new information that you've learned or changes that require updates to these instructions files.

ALWAYS check your work before returning control to the user. Run tests if available, verify builds, etc. Never return incomplete or unverified work to the user.

Be a good steward of terminal instances. Try and reuse existing terminals where possible and use the VS Code API to close terminals that are no longer needed each time you open a new terminal.

## Mandatory Coding Principles

These coding principles are mandatory:

1. Structure
    - Use a consistent, predictable project layout.
    - Group code by feature/screen; keep shared utilities minimal.
    - Create simple, obvious entry points.
    - Before scaffolding multiple files, identify shared structure first. Use framework-native composition patterns (layouts, base templates, providers, shared components) for elements that appear across pages. Duplication that requires the same fix in multiple places is a code smell, not a pattern to preserve.

2. Architecture
    - Prefer flat, explicit code over abstractions or deep hierarchies.
    - Avoid clever patterns, metaprogramming, and unnecessary indirection.
    - Minimize coupling so files can be safely regenerated.

3. Functions and Modules

    - Keep control flow linear and simple.
    - Use small-to-medium functions; avoid deeply nested logic.
    - Pass state explicitly; avoid globals.

4. Naming and Comments

    - Use descriptive-but-simple names.
    - Comment only to note invariants, assumptions, or external requirements.

5. Logging and Errors

    - Emit detailed, structured logs at key boundaries.
    - Make errors explicit and informative.

6. Regenerability
    - Write code so any file/module can be rewritten from scratch without breaking the system.
    - Prefer clear, declarative configuration (JSON/YAML/etc.).

7. Platform Use
    - Use platform conventions directly and simply (e.g., WinUI/WPF) without over-abstracting.

8. Modifications
    - When extending/refactoring, follow existing patterns.
    - Prefer full-file rewrites over micro-edits unless told otherwise.

9. Quality
    - Favor deterministic, testable behavior.
    - Keep tests simple and focused on verifying observable behavior.