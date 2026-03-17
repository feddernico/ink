# Change: Refactor and simplify for LLM-friendly maintenance

## Why
The core UI/controller logic lives in a single large module, which increases coupling and makes safe regeneration harder. A structured refactor plan will align the codebase with the AI-first principles without changing behavior unnecessarily.

## What Changes
- Produce a refactor and simplification plan aligned to the repo's LLM coding principles.
- Define high/medium/low priority refactor themes with deletion/rename/restructure guidance.
- Call out areas that should remain unchanged to avoid churn.

## Impact
- Affected specs: codebase-maintainability
- Affected code: src/app/bootstrap.ts, src/app/*, build/*, tests/*, docs
