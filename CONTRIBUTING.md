# Contributing to ink

Thank you for your interest in contributing to ink! We appreciate every improvement, whether it is a bug fix, a documentation update, a design refinement, or a new feature. This guide is here to make contributing straightforward and consistent with how the project is built and maintained.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Submitting Changes](#submitting-changes)
- [Coding Guidelines](#coding-guidelines)
- [Commit Messages](#commit-messages)
- [Style Guide](#style-guide)
- [Testing and Build Checks](#testing-and-build-checks)
- [License](#license)

## Code of Conduct

Please be respectful, constructive, and patient in all project discussions. We want ink to stay welcoming to contributors of all experience levels.

## Getting Started

1. **Fork the repository**: Create a fork of the repository to work on your changes.
2. **Clone your fork**: Clone the repository to your local machine using `git clone`.
3. **Install dependencies**: Run `npm install`.
4. **Create a branch**: Create a branch for your work using `git checkout -b your-branch-name`.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with clear reproduction steps, the expected behavior, the actual behavior, and any screenshots or console output that help explain the problem.

### Suggesting Features

Feature ideas are welcome. Open an issue describing the problem you want to solve, how you expect the feature to work, and whether it affects editing, workspace management, export flows, or the single-file build output.

### Submitting Changes

1. **Keep changes focused**: Prefer small pull requests that solve one problem well.
2. **Follow the existing structure**: ink favors simple, explicit modules and predictable file organization.
3. **Run the relevant checks**: Build the app and run tests before opening a pull request.
4. **Open a pull request**: Include a clear summary of what changed, why it changed, and how you verified it.

## Coding Guidelines

- Follow the current project structure and keep `src/app.ts` as a thin entrypoint.
- Prefer small, explicit modules with flat control flow and minimal indirection.
- Preserve the single-file app output, `ink-app.html`.
- Add comments only when they explain an invariant, assumption, or external requirement.
- Keep changes easy to debug and easy to regenerate.

## Commit Messages

- Use the present tense, such as `Add export validation`.
- Use the imperative mood, such as `Update workspace refresh flow`.
- Limit the first line to 72 characters or less when possible.
- Reference related issues or pull requests after the first line when relevant.
- Prefer Conventional Commit prefixes so release automation can classify changes:
  `fix:` for patch releases, `feat:` for minor releases, and `feat!:` or a `BREAKING CHANGE:` footer for major releases.
- If you need to force a specific next version, add a `Release-As: x.y.z` footer to the merged commit body or release PR description.

## Release Process

- Releases are prepared with `release-please`, which opens a release PR that updates `package.json`, `package-lock.json`, and the changelog.
- This repository uses plain `v*` Git tags for releases; keep `release-please` configured to match that tag history.
- Merge the release PR through the normal protected-branch flow to create the Git tag and publish the GitHub release.
- If you want the release PR to trigger the normal PR checks automatically, configure a `RELEASE_PLEASE_TOKEN` secret with a PAT that can open pull requests in this repository.

## Style Guide

- **JavaScript and TypeScript**: Prefer explicit, readable code over clever abstractions.
- **SCSS**: Keep styles aligned with the existing structure in `src/styles.scss`.
- **HTML**: Update `ink.template.html` when changing the app shell or document structure.
- **Build scripts**: Keep build logic simple and compatible with the single-file assembly flow in `build/compile-and-assemble.js`.

## Testing and Build Checks

Before submitting changes, run the checks that match your work:

- `npm run build` to regenerate `ink-app.html`
- `npm run test:qunit` for unit and integration coverage
- `npm run test:cypress` for end-to-end coverage
- `npm test` for the full automated suite
- `make build` and `make test` are available as convenience wrappers

If your change affects favicon or branding assets, also run `npm run build:favicon`.

## License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to ink!
