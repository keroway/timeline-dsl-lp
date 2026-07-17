# Plan 003: Characterize and browser-test Playground pan/zoom behavior

> **Executor instructions**: Follow every step and gate. Update `plans/README.md` when done. Do not refactor production behavior unless a test demonstrates a bug and a reviewer expands scope.
>
> **Drift check (run first)**: `git diff --stat a7b011e..HEAD -- site/src/lib/playground-pan-zoom.ts site/scripts/smoke-playground.mjs site/vitest.config.ts`

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `a7b011e`, 2026-07-18

## Why this matters

Pan/zoom is a primary Playground interaction with nontrivial fit math, pointer capture, RAF scheduling, scale clamping, tooltip suppression and teardown. Current browser smoke only confirms the stage exists, so functional regressions and listener/RAF leaks can pass all gates.

## Current state

- `site/src/lib/playground-pan-zoom.ts:20-188` implements the controller and exposes `applySvg`, `reset`, `destroy`.
- Defaults: min scale 0.25, max 8, pan threshold 5; fit padding is 32 (`:25-27`, `:69-79`).
- Pointer moves are RAF-coalesced (`:100-127`); `destroy()` cancels pending RAF and removes listeners (`:178-186`).
- `site/scripts/smoke-playground.mjs:107-114` waits only for `[data-pan-zoom-stage]` attachment.
- Unit tests under `src/lib/**/*.test.ts` use jsdom per `site/vitest.config.ts:14-23`. Follow nearby explicit DOM stubbing patterns in `playground-controller.test.ts`.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Focused unit | `cd site && pnpm vitest run src/lib/playground-pan-zoom.test.ts` | all new tests pass |
| All unit | `cd site && pnpm test:unit` | all pass |
| Browser smoke | preview + `PLAYGROUND_BASE_URL=http://127.0.0.1:4321 pnpm smoke:playground:browser` | pass |
| Lint | `cd site && pnpm lint` | exit 0 |

## Scope

**In scope**: create `site/src/lib/playground-pan-zoom.test.ts`; extend `site/scripts/smoke-playground.mjs`; production `playground-pan-zoom.ts` only if a characterized defect is proven.

**Out of scope**: changing pan/zoom UX, adding touch gestures, changing scale bounds, redesigning preview controls.

## Steps

### Step 1: Add deterministic unit fixtures

Create surface/stage/SVG/reset/tooltip fixtures. Stub `clientWidth`, `clientHeight`, `getBoundingClientRect`, SVG dimensions/viewBox, pointer-capture APIs, and RAF/cancelRAF explicitly; restore globals after each test.

**Verify**: focused Vitest command starts with no environment errors.

### Step 2: Cover fit and scaling boundaries

Test: no-SVG identity; normal centering/fit; invalid dimensions fallback; fit never above 1 and never below configured minimum; wheel zoom around cursor; min/max clamping; double-click and reset restore fit.

**Verify**: focused tests pass with exact matrix assertions.

### Step 3: Cover pointer state and teardown

Test sub-threshold movement, threshold activation/classes, tooltip hiding, RAF coalescing, pointer end/cancel, and `destroy()` cancellation/removal. Assert observable behavior rather than private variables.

**Verify**: focused tests pass; no pending fake timers/RAF callbacks remain.

### Step 4: Exercise one real browser flow

Extend browser smoke to capture the initial stage transform, send a wheel event at a stable point, assert transform changes, click the existing reset control, and assert fitted transform is restored. Use Playwright polling rather than fixed sleeps.

**Verify**: browser smoke passes twice against preview.

## Done criteria

- [ ] Unit tests cover fit, clamping, pointer threshold, RAF, reset, tooltip state and destroy.
- [ ] Browser smoke proves zoom changes transform and reset restores fit.
- [ ] Full unit, lint and browser smoke pass.
- [ ] Production behavior is unchanged unless a separately documented failing case required a minimal fix.

## STOP conditions

- jsdom cannot model SVG/viewBox behavior without testing implementation internals.
- Browser transform is inherently unstable across runs after polling and fixed viewport.
- A discovered production bug requires changing public interaction semantics.

## Maintenance notes

Any future resize observer, touch gesture, or transform representation change must update characterization tests first. Keep only one browser interaction path; detailed edge cases belong in fast unit tests.
