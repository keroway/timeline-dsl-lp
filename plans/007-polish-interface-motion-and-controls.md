# Plan 007: Polish interface control semantics and transition performance

> **Executor instructions**: Apply only evidence-backed polish below; do not redesign the visual system. Update `plans/README.md` after verification.
>
> **Drift check (run first)**: `git diff --stat a7b011e..HEAD -- site/src/styles/global.css site/src/components/A11yMenuPanel.astro site/src/components/DocsA11yMenu.astro site/src/layouts/BaseLayout.astro`

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `a7b011e`, 2026-07-18

## Why this matters

The automated accessibility baseline is excellent (all 42 routes passed axe WCAG 2.1 AA), but several shared controls use `transition: all`, contrary to the repository’s otherwise property-specific motion discipline and current interface guidance. The accessibility text-size select also relies on surrounding headings rather than an explicit label. These are polish/robustness items, not release blockers.

## Current state

- `site/src/styles/global.css:119-135` uses `transition: all` for `.lang-toggle`.
- `site/src/components/A11yMenuPanel.astro:80-93` uses `transition: all` for `.a11y-toggle`.
- `site/src/components/DocsA11yMenu.astro:73-89` uses `transition: all` for `.docs-lang-toggle`.
- `site/src/components/A11yMenuPanel.astro:58-73` has a text-size `<select>` with no associated `<label>`/`aria-label`.
- DESIGN.md §6 says motion should be modest and suppressible; §7 requires keyboard/focus/contrast support.
- Verified axe smoke: 42/42 pages pass; preserve this baseline.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Search | `rg -n "transition:\s*all" site/src` | no matches in changed shared controls; ideally none |
| Unit | `cd site && pnpm test:unit` | all pass |
| A11y | preview + `A11Y_BASE_URL=http://127.0.0.1:4321 pnpm smoke:a11y` | 42 pages and mobile nav pass |
| Visual | `cd site && pnpm test:visual` | pass if Plan 002 landed |

## Scope

**In scope**: three identified transition declarations; explicit localized accessible naming for text-size select; focused tests if markup assertions exist.

**Out of scope**: changing colors, spacing, animation durations, menu behavior, adding new a11y settings, broad copy-style cleanup.

## Steps

1. Replace each `transition: all 0.2s` with the exact properties that change in hover/expanded states (`color`, `background-color`, `border-color`; include only proven properties).
   - **Verify**: search has no target matches and computed hover behavior remains visually equivalent.
2. Give the text-size select an explicit localized label. Prefer a visible `<label>` if layout allows; otherwise use a localized `aria-label`. Add a dedicated translation key in ja/en and rely on existing i18n parity tests.
   - **Verify**: accessible-name inspection shows the select’s localized purpose in both locales.
3. Run unit, axe and visual regression. Test default, dark, high-contrast, 200% text and reduced-motion states.

## Done criteria

- [ ] No targeted shared control uses `transition: all`.
- [ ] Text-size select has an explicit localized accessible name.
- [ ] All 42 routes retain zero axe WCAG 2.1 AA violations.
- [ ] Visual snapshots show no unintended design drift.

## STOP conditions

- Property-specific transitions visibly change the intended component motion.
- Visible label requires restructuring the menu beyond this small scope.
- Plan 002 is unavailable and the change shows uncertain visual impact; request manual preview review.

## Maintenance notes

Future interactive controls should list transition properties explicitly and receive an accessible name at component creation time. Axe passing is necessary but does not replace keyboard and zoom review.
