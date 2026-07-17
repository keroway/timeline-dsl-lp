# Plan 005: Complete bilingual Open Graph locale metadata

> **Executor instructions**: Follow the plan, run every verification, and update `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a7b011e..HEAD -- site/src/components/SocialMeta.astro site/src/components/SocialMeta.test.ts site/scripts/smoke-seo.mjs`

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: docs
- **Planned at**: commit `a7b011e`, 2026-07-18

## Why this matters

The bilingual site already has correct reciprocal hreflang and canonical metadata, but social crawlers receive only the current `og:locale`, not the known alternate locale. This is a small, low-risk metadata completeness improvement, not a search-indexing blocker.

## Current state

- `site/src/components/SocialMeta.astro:44` emits `ja_JP` or `en_US` as `og:locale`.
- No `og:locale:alternate` is emitted.
- `site/src/layouts/BaseLayout.astro:85-93` already emits ja/en/x-default alternates.
- `site/src/components/SocialMeta.test.ts` is the existing component-test pattern.
- `site/scripts/smoke-seo.mjs` checks metadata across the route catalog.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Focused | `cd site && pnpm vitest run src/components/SocialMeta.test.ts` | all pass |
| SEO | preview + `SEO_BASE_URL=http://127.0.0.1:4321 pnpm smoke:seo` | all routes pass |
| Build | `cd site && pnpm build` | exit 0 |

## Scope

**In scope**: `SocialMeta.astro`, its test, `smoke-seo.mjs` if route-level enforcement adds value.

**Out of scope**: changing hreflang/canonical policy, locale auto-detection, adding more locales, changing OGP images.

## Steps

1. Derive alternate OG locale from the normalized current locale: Japanese page → `en_US`; English page → `ja_JP`.
   - **Verify**: rendered component has exactly one current and one alternate tag.
2. Add focused tests for both directions and ensure unknown/non-`en` locale follows existing Japanese fallback behavior.
   - **Verify**: focused tests pass.
3. Optionally enforce on all localized routes in SEO smoke; avoid asserting it on pages that intentionally disable locale pairing, if any are added later.
   - **Verify**: build and SEO smoke pass.

## Done criteria

- [ ] Every ja/en page emits the reciprocal `og:locale:alternate`.
- [ ] Component tests cover both locales and no duplicate tags.
- [ ] Existing canonical/hreflang/OG image behavior is unchanged.

## STOP conditions

- Current Open Graph consumers or product policy intentionally avoid alternate locale tags.
- Any route lacks a real alternate page despite route-catalog assumptions.

## Maintenance notes

If a third locale is added, replace the binary mapping with a supported-locale list and emit all non-current locales.
