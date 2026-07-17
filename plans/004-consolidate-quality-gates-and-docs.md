# Plan 004: Provide one reproducible local quality-gate command and correct CI documentation

> **Executor instructions**: Run all gates and update `plans/README.md`. Preserve the workflow’s always-report-required-check behavior.
>
> **Drift check (run first)**: `git diff --stat a7b011e..HEAD -- site/package.json .github/workflows/site-build.yml README.md README.ja.md site/src/content/docs/docs/contributing.mdx site/src/content/docs/en/docs/contributing.mdx`

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: `plans/002-run-visual-regression-in-ci.md`
- **Category**: dx
- **Planned at**: commit `a7b011e`, 2026-07-18

## Why this matters

The authoritative gate is a long workflow-only sequence while contributors receive separate commands and one actively false statement that browser smoke does not run in CI. A shared package command reduces omitted checks and CI/documentation drift.

## Current state

- `site/package.json:11-32` exposes individual scripts but no aggregate `check`/`ci` command.
- `.github/workflows/site-build.yml:73-150` sequences lint, format, unit, build, bundle, browser smokes, a11y and Lighthouse.
- Paired contributor docs at line 32 say `smoke:playground:browser` does not run in CI, contradicted by workflow lines 136-140.
- Browser gates need a preview lifecycle and Chromium; non-browser gates do not.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Fast gate | `cd site && pnpm check` | lint, format, unit, build, bundle pass |
| Full gate | `cd site && pnpm check:full` | preview/browser/a11y/Lighthouse/visual gates pass with cleanup |

## Scope

**In scope**: `site/package.json`, supporting script under `site/scripts/` if needed, `.github/workflows/site-build.yml`, paired READMEs/contributor docs.

**Out of scope**: changing quality thresholds, removing individual scripts, replacing GitHub Actions path filtering, requiring full browser suite in pre-commit.

## Steps

1. Add `check` composing deterministic non-browser gates in CI order. Avoid recursive duplicate `smoke:wasm` execution if `build` already includes it; document the exact sequence.
   - **Verify**: `pnpm check` exits 0 from `site/`.
2. Add `check:full` using a robust preview lifecycle (readiness polling, trap/finally cleanup, portable exit propagation). Include browser i18n/playground, a11y, Lighthouse, and Plan 002 visual tests. A small Node `.mjs` orchestration script is preferred over brittle shell backgrounding if cross-platform local use is intended.
   - **Verify**: after success and forced failure, no preview process remains on port 4321.
3. Refactor CI to call shared scripts where practical while preserving named diagnostic steps/artifact uploads and `RUN_FULL` gating. If one aggregate CI step would degrade failure diagnostics, keep CI steps separate and make the package script the documented local mirror; explicitly comment the relationship.
   - **Verify**: workflow still reports `build` success on irrelevant changes.
4. Correct both contributor pages and list `check`/`check:full`, Chromium prerequisite, and what CI runs. Update both READMEs consistently.
   - **Verify**: `rg -n "does not run in CI|CI では走りません" site/src/content/docs` returns no stale claim.

## Test plan

- Run `check` twice.
- Run `check:full` against a free port and verify cleanup.
- Induce a temporary failing smoke URL or command, verify nonzero exit and cleanup, then revert.
- Validate formatting and YAML syntax.

## Done criteria

- [ ] One fast and one full local command are documented.
- [ ] Full gate cleans preview on success, interruption and failure.
- [ ] Contributor docs accurately describe browser CI coverage in both languages.
- [ ] Workflow required-check semantics and artifacts remain intact.

## STOP conditions

- Plan 002 is not complete and visual command naming is unresolved.
- Cross-platform lifecycle cannot be made reliable without a new dependency.
- Workflow aggregation loses useful per-gate reporting or artifact behavior.

## Maintenance notes

Whenever CI adds/removes a gate, update the aggregate command and paired docs in the same PR. Prefer package scripts as stable user-facing interfaces and workflow YAML as orchestration.
