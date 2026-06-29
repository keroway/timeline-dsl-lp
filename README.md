# Timeline DSL Landing & Docs

[日本語 README →](./README.ja.md)

[![Astro](https://img.shields.io/badge/Astro-6.4.6-BC52EE?logo=astro&logoColor=white)](https://astro.build/)
[![Starlight](https://img.shields.io/badge/Starlight-0.39.2-5A45FF)](https://starlight.astro.build/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10.33.3-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Node.js](https://img.shields.io/badge/Node.js-24-5FA04E?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare%20Pages-deployed-F38020?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)
[![Vitest](https://img.shields.io/badge/Vitest-4.1-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Lighthouse CI](https://img.shields.io/badge/Lighthouse%20CI-enabled-F44B21?logo=lighthouse&logoColor=white)](https://github.com/GoogleChrome/lighthouse-ci)

LP / documentation site for the public [Timeline DSL](https://github.com/keroway/timeline-dsl) project. Timeline DSL is a Rust-based DSL compiler for defining timelines as text, importing Wikidata-backed data, and rendering the result as HTML / SVG / PNG / PDF.

- Site: <https://timeline-dsl-lp.pages.dev>
- Main repository: <https://github.com/keroway/timeline-dsl>
- Playground / WebUI: <https://keroway.github.io/timeline-dsl/>
- Latest tracked release in this site: `v1.22.0` (`site/public/wasm/package.json`, generated changelog)

## Tech stack

| Area | Stack | Notes |
| --- | --- | --- |
| Site framework | Astro 6 + Starlight 0.39 | Static LP, docs, changelog, gallery, showcase, and playground routes. |
| Language/runtime | TypeScript 6, Node.js 24, pnpm 10 | All commands run under `site/`. |
| Styling | Astro components + CSS tokens | Global design tokens live in `site/src/styles/global.css`; avoid ad-hoc colors. |
| Playground | Vendored `@keroway/tdsl-wasm` 1.22.0 | Browser validation and SVG rendering go through `site/src/lib/tdsl-wasm.ts`. |
| Search | Pagefind generated at build time | Used by the site-wide search dialog. |
| Quality | `astro check`, Vitest, ESLint, Prettier, axe-core, Playwright, Lighthouse CI | `pnpm build` is the minimum CI gate; extra smoke scripts cover SEO/i18n/a11y/playground. |
| Hosting | Cloudflare Pages | GitHub integration builds from `site/` and publishes `dist/`. |

## Local development

```sh
cd site
pnpm install --frozen-lockfile
pnpm dev
```

Common commands:

```sh
pnpm fetch:releases             # Fetch keroway/timeline-dsl GitHub Releases into site/src/data/
pnpm smoke:wasm                 # Smoke-test the vendored WASM bridge
pnpm smoke:playground           # HTTP smoke test for Playground
pnpm smoke:a11y                 # axe-core audit for key pages (requires Chromium)
pnpm lint
pnpm format:check
pnpm build                      # smoke:wasm → astro check → astro build
pnpm preview
```

## Deploy

Deployment is handled by Cloudflare Pages via GitHub integration. GitHub Actions runs `pnpm build` as CI only; publishing and Preview URL creation are delegated to Cloudflare Pages.

Cloudflare Pages project:

- Project name: `timeline-dsl`
- Production branch: `main`
- Build command: `pnpm build`
- Build output directory: `dist`
- Root directory: `site`
- Deploy command: (no setting shown)

Workflows:

- `Site build`: Runs `pnpm build` on PR, `main` push, and manual dispatch as CI.
- `Remove in-progress label on close`: When a PR is merged, removes the `in-progress` label from issues referenced by `Closes #N` / `Fixes #N` / `Resolves #N` in the PR body. Also removes the label when an issue is directly closed. On manual dispatch, specify `issue_number` to remove the label from any issue.

Event policy:

- `pull_request`: Runs GitHub Actions `Site build` and Cloudflare Pages Preview deployment. During review, verify `/` and `/docs/` on the Cloudflare Pages Preview URL.
- `push` to `main`: Cloudflare Pages deploys to <https://timeline-dsl-lp.pages.dev> as the production branch.
- `release.published`: Not used as a direct deploy trigger via the Cloudflare Pages GitHub integration. Releases are published after a `main` merge once the production deployment succeeds.
- `workflow_dispatch`: Limited to manually re-running GitHub Actions CI. To re-run a deployment, use the Retry deployment button in the Cloudflare Pages dashboard.

If the Cloudflare settings UI requires a Deploy command or shows a deploy command for non-production branches, you are looking at Workers Builds, not Pages. This site is a Pages project — import the GitHub repository from Pages in the Cloudflare dashboard, not Workers.

## Quality gates (Lighthouse CI)

The `Site build` workflow runs Lighthouse CI (`@lhci/cli`) against the running preview server after the smoke tests, guarding against silent regressions in performance, accessibility, SEO, and best-practices scores. Run it locally with the preview server up:

```sh
cd site
pnpm preview &          # or pnpm dev
pnpm lhci               # set LHCI_BASE_URL to target a non-default origin
```

Audited pages (one per archetype, across both locales): `/`, `/en/`, `/docs/`, `/playground/`, `/gallery/`. Each is measured 3 times and the median is asserted. Config: `site/lighthouserc.cjs`.

Baseline thresholds and their rationale:

| Category | Level | Min score | Rationale |
| --- | --- | --- | --- |
| Performance | `warn` | 0.80 | LCP/TBT vary with shared CI runner load. Starts as a non-blocking warning; tighten to `error` once the signal proves stable (staged rollout). |
| Accessibility | `error` | 0.90 | A static, token-driven site clears this reliably; complements the axe-core `smoke:a11y` audit. |
| Best practices | `error` | 0.90 | Catches console errors, insecure resources, and deprecated APIs introduced by future changes. |
| SEO | `error` | 0.90 | The site lives or dies by discoverability; metadata/hreflang/JSON-LD regressions must fail CI. |

Desktop preset is used (the docs site is primarily read on desktop, and it keeps the performance score stable). To raise a threshold or promote performance to `error`, edit the `assert.assertions` block in `site/lighthouserc.cjs`.

## WASM bundle

All calls to the Timeline DSL WASM from the Playground and runnable docs go through `site/src/lib/tdsl-wasm.ts` only. The generated `@keroway/tdsl-wasm` browser package is vendored in `site/public/wasm/` so the LP can build independently of the main repository release pipeline.

To update: build `crates/tdsl-wasm` in the main repo with `wasm-pack build --target web`, then sync `tdsl_wasm.{js,d.ts}`, `tdsl_wasm_bg.wasm`, and `package.json` into `site/public/wasm/`. `pnpm build` runs `check_source` and `render_svg_from_source` smoke tests before the main build.
