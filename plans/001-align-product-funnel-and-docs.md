# Plan 001: Align the LP funnel and public documentation with actual browser/CLI capabilities

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving on. If a STOP condition occurs, stop and report; do not improvise. When done, update this plan's row in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a7b011e..HEAD -- README.md README.ja.md site/src/i18n/en.ts site/src/i18n/ja.ts site/src/content/docs site/astro.config.mjs`
> If an in-scope file changed, compare the current-state facts below with live code. Material mismatch is a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: docs
- **Planned at**: commit `a7b011e`, 2026-07-18

## Why this matters

The LP is strong and its claims are broadly true, but the browser-first funnel currently blurs the boundary between Playground/WASM and CLI capabilities. The README also directs users to a separate WebUI instead of the Playground maintained here, while installation and maintainer pages weaken the public information architecture. Correcting these issues prevents failed first-run expectations and gives users one clear path: Playground → saved `.tdsl` → CLI/CI.

## Current state

- `README.md:16-19` and `README.ja.md:16-19` link “Playground / WebUI” to `https://keroway.github.io/timeline-dsl/`, although this repo owns localized `/playground/` routes.
- `site/src/components/PlaygroundPage.astro:107-114` exposes `.tdsl`, SVG, and HTML downloads; no PNG/PDF download exists.
- `site/public/wasm/tdsl_wasm.d.ts:75-77` states that browser Wikidata fetching is unavailable; `site/src/content/docs/docs/grammar.mdx:211-245` documents the limitation only deep in grammar docs.
- `site/src/i18n/ja.ts:90-92` (paired in `en.ts`) advertises HTML/SVG/PNG/PDF in a browser-first page without explicitly assigning PNG/PDF to CLI.
- `site/src/content/docs/docs/installation.mdx:6-25` routes all non-Homebrew users to a page/sidebar item named Homebrew and contains stale “初期サイト” wording. The English page has the same structure.
- `site/astro.config.mjs:138-150` includes site-maintainer deployment material in the public product-doc sidebar and therefore in the docs/LLM corpus.
- Docs convention: every file under `site/src/content/docs/docs/` has an English peer under `site/src/content/docs/en/docs/`; update both together. Keep required `title` and `description` frontmatter.
- Design vocabulary: preserve the documented browser-first positioning and the sequence “Playground → CLI → CI”; qualify capabilities rather than weakening the product claim.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Unit | `cd site && pnpm test:unit` | 203+ tests pass |
| Type/build | `cd site && pnpm build` | exit 0; all routes build |
| SEO | preview server plus `SEO_BASE_URL=http://127.0.0.1:4321 pnpm smoke:seo` | 42+ pages pass |
| i18n | preview server plus `I18N_BASE_URL=http://127.0.0.1:4321 pnpm smoke:i18n` | key parity and route checks pass |
| Format | `cd site && pnpm format:check` | exit 0 |

## Scope

**In scope**:
- `README.md`, `README.ja.md`
- `site/src/i18n/ja.ts`, `site/src/i18n/en.ts`
- `site/src/content/docs/docs/installation.mdx` and English peer
- `site/src/content/docs/docs/homebrew.mdx` and English peer
- `site/src/content/docs/docs/contributing.mdx`, `deployment.mdx` and English peers if needed for IA links/frontmatter
- `site/astro.config.mjs`
- existing relevant smoke/unit tests only

**Out of scope**:
- Adding new Playground output formats or Wikidata network access
- Removing or redirecting the external GitHub Pages WebUI without a maintainer decision
- Creating a new content collection or changing public slugs without redirects
- Rewriting unrelated grammar/reference pages

## Steps

### Step 1: Establish the canonical Playground wording

Change both READMEs so the primary Playground points to this site (`/playground/` on the production origin). Determine whether the external WebUI is intentionally supported from current repo/main-project docs or maintainer input. If it remains, label it explicitly as an alternate/legacy surface; do not silently delete a supported product.

**Verify**: `rg -n "Playground / WebUI|keroway.github.io/timeline-dsl" README.md README.ja.md` → no ambiguous primary link remains.

### Step 2: Qualify browser and CLI capabilities on the LP

Update paired i18n copy near the render feature/workflow and research/Wikidata use case. State compactly that the browser validates import syntax but CLI resolves Wikidata, and that browser downloads are SVG/HTML while CLI provides HTML/SVG/PNG/PDF. Preserve existing CTA hierarchy and do not add a new LP section unless content cannot fit clearly in current sections.

Add/update key-parity and component assertions following `site/src/i18n/index.test.ts` and `site/src/components/lp/HeroSection.test.ts` where appropriate.

**Verify**: `cd site && pnpm test:unit` → all tests pass and ja/en keys remain identical.

### Step 3: Make installation a platform chooser

Restructure paired Installation pages so supported platform choices are visible there without sending Windows/Rust users through a Homebrew-labelled dead end. Either narrow the Homebrew page to Homebrew or relabel it consistently as “Other installation methods”; prefer preserving `/docs/homebrew/` for inbound-link stability. Remove “初期サイト”/provisional wording. Update sidebar labels and all links in both locales.

**Verify**: `rg -n "初期サイト|initial site|Homebrew and Other|Homebrewとその他" site/src/content/docs site/astro.config.mjs` → only intentional wording remains; all platform choices are discoverable from Installation.

### Step 4: Separate user and site-maintainer information

Keep contributing discoverable but clearly separate site deployment operations from Timeline DSL user docs. Lowest-risk option: rename the group to distinguish project/site maintainers and configure the LLM plugin to exclude the deployment page if supported by the installed plugin version. Verify plugin options against current package docs before editing config. Do not move slugs or create a second collection unless exclusion/navigation cannot satisfy the requirement.

**Verify**: after build, inspect `site/dist/llms*.txt` and sidebar output; user-oriented LLM output must not present Cloudflare site deployment as Timeline DSL deployment guidance.

### Step 5: Run full documentation gates

Run format, unit, build, preview, SEO, and i18n checks. Manually inspect `/`, `/en/`, `/docs/installation/`, `/en/docs/installation/`, and the docs sidebar at desktop and mobile widths.

**Verify**: all commands in the table exit 0; no broken internal link or locale crossover is observed.

## Test plan

- Extend `src/i18n/index.test.ts` if new keys are introduced.
- Add focused content/smoke assertions for capability qualification and localized installation links rather than brittle full-copy snapshots.
- Ensure both locale pages retain matching heading structure and valid frontmatter.

## Done criteria

- [ ] README primary Playground destination is this repository’s production Playground, with any alternate clearly labelled.
- [ ] LP distinguishes browser/WASM from CLI Wikidata and output capabilities in both languages.
- [ ] Installation is a direct multi-platform chooser; stale provisional wording is gone.
- [ ] Site deployment is clearly maintainer-only and does not pollute user/LLM guidance.
- [ ] `pnpm test:unit`, `pnpm format:check`, `pnpm build`, `smoke:seo`, and `smoke:i18n` pass.
- [ ] No files outside Scope (plus `plans/README.md`) are modified.

## STOP conditions

- The status/canonical role of the external WebUI cannot be established.
- Plugin exclusion requires a package upgrade or undocumented API.
- Preserving URLs while fixing IA proves impossible without deployment-level redirects.
- Any claimed browser/CLI capability differs from the vendored v1.25.0 API.

## Maintenance notes

Review capability copy whenever WASM exports or Playground download controls change. Treat README, LP, detailed docs, and LLM output as four views of one product contract; future release-sync work should check all four.
