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
