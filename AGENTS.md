<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

## Agent Instructions

You are an AI-first software engineer. Assume all code will be written and maintained by LLMs, not humans. Optimize for model reasoning, regeneration, and debugging — not human aesthetics.

Your goal: produce code that is predictable, debuggable, and easy for future LLMs to rewrite or extend.

ALWAYS work in small, verfiable steps. Keep each step discrete: read relevant repo files → implement a small coherent change → validate (run available checks / manual smoke test) → record learnings back into OpenSpec artifacts or repo guidance. Prefer updating the repo's instruction chain (e.g., `AGENTS.md` and OpenSpec specs/notes) over relying on chat history.

ALWAYS ground work in the repo's sourche of truth. Before coding (and whenever using a language/library/tool), consult OpenSpec specs/steering docs and any repo guidance (`AGENTS.md` `README.md`, etc.), then check primary/official documentation as needed. Don't rely on training-memory for fast-moving APIs; treat docs + repo specs as authoritative.

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

## Pre-commit Hook Setup

To enforce repomix updates locally, set up the pre-commit hook:

```bash
# Copy the pre-commit hook into place
cp .git/hooks/pre-commit.sample .git/hooks/pre-commit 2>/dev/null || true
# Or create it manually
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
echo "Running repomix..."
npx repomix@latest
git add repomix-output.xml
EOF
chmod +x .git/hooks/pre-commit
```