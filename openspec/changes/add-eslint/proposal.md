# Change: Add ESLint to the project

## Why
The project lacks consistent code quality enforcement. Adding ESLint will help catch common errors, enforce coding standards, and improve maintainability across the JavaScript codebase.

## What Changes
- Add ESLint as a dev dependency
- Configure ESLint with appropriate rules for vanilla ES6+ JavaScript
- Integrate lint check into the build process
- Add npm script for running lint

## Impact
- Affected specs: code-quality (new capability)
- Affected code: All JavaScript files in `src/`, `build/`, `tests/`
- Build system: Add lint step to build/compile-and-assemble.js
