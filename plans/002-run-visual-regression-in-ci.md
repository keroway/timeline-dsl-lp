# Plan 002: Make LP visual regression tests an enforced CI gate

> **Executor instructions**: Execute each step and verification in order. Stop on any condition below; do not regenerate snapshots merely to make CI green. Update the status row in `plans/README.md` when complete.
>
> **Drift check (run first)**: `git diff --stat a7b011e..HEAD -- site/package.json site/playwright.config.ts site/tests/visual .github/workflows/site-build.yml`

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `a7b011e`, 2026-07-18

## Why this matters

The repo already maintains light, dark, and high-contrast full-page LP screenshots, but no package script or CI step runs them. Consequently the strongest automated guard for the LP’s design can silently rot and layout/theme regressions can merge.

## Current state

- `site/tests/visual/lp-top.spec.ts:13-35` defines three screenshot cases with `maxDiffPixelRatio: 0.01`.
- `site/playwright.config.ts:3-31` fixes Chromium, 1280×800, DPR 1 and manages `pnpm preview`.
- `site/package.json:11-32` has no `test:visual` script.
- `.github/workflows/site-build.yml:91-160` installs Chromium and uploads Lighthouse reports but never invokes Playwright visual tests or uploads screenshot diffs.
- Existing CI commands run from `site/` and expensive steps are guarded by `if: env.RUN_FULL == 'true'`; preserve this required-check architecture.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Visual | `cd site && pnpm test:visual` | 3 tests pass |
| Unit | `cd site && pnpm test:unit` | all pass |
| Format | `cd site && pnpm format:check` | exit 0 |

## Scope

**In scope**: `site/package.json`, `site/playwright.config.ts`, `site/tests/visual/**`, `.github/workflows/site-build.yml`, README command lists if necessary.

**Out of scope**: redesigning the LP, changing snapshot tolerance without evidence, auto-updating snapshots in CI, adding browsers/viewport matrices.

## Steps

### Step 1: Expose a stable package script

Add `test:visual` invoking `playwright test`. If snapshot update is useful, add an explicitly named local-only `test:visual:update`; never call it from CI.

**Verify**: `cd site && pnpm test:visual` → 3 tests pass against committed baselines.

### Step 2: Add CI execution and failure artifacts

After Chromium installation and after build availability, invoke `pnpm test:visual` under the same `RUN_FULL` guard. Avoid preview-port races: either let the existing preview serve the tests (config has `reuseExistingServer: true`) or place the test before the shared preview starts and let Playwright own lifecycle. Add an `if: failure() && env.RUN_FULL == 'true'` artifact step for `site/test-results/` and any HTML report only if configured; use `if-no-files-found: ignore`.

**Verify**: validate YAML and inspect that non-site PRs still report the required `build` job successfully with expensive steps skipped.

### Step 3: Document snapshot workflow

Add concise English/Japanese contributor instructions: command, Chromium prerequisite, and rule that baseline changes require visual review.

**Verify**: `cd site && pnpm format:check` → pass.

## Test plan

- Run visual tests twice to detect immediate nondeterminism.
- Deliberately alter a local CSS value without committing, confirm one screenshot fails and produces a diff, then revert the local experiment.
- Confirm all three modes are still collected (`--list`).

## Done criteria

- [ ] `pnpm test:visual` exists and passes 3 committed-baseline cases.
- [ ] CI runs it for site-relevant changes.
- [ ] CI uploads actionable diff artifacts on failure.
- [ ] Snapshot updates remain explicit and never happen in CI.
- [ ] Contributor docs explain the workflow in both languages.

## STOP conditions

- Current snapshots fail cleanly on two consecutive runs at commit `a7b011e`.
- Fixing CI requires relaxing the 1% tolerance or masking substantial page regions.
- Playwright and the workflow preview server contend for port 4321 after reasonable ordering changes.

## Maintenance notes

Review snapshot diffs as design artifacts, not disposable test output. Expand routes/viewports only when a specific regression class justifies the runtime and maintenance cost.
