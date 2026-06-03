# timeline-dsl-lp

[日本語 README →](./README.ja.md)

LP / documentation site for [Timeline DSL](https://timeline-dsl.pages.dev).

## Site

- Framework: Astro + Starlight
- Package manager: pnpm 10.33.3
- Node.js: 24
- Site URL: https://timeline-dsl.pages.dev

```sh
cd site
pnpm install --frozen-lockfile
pnpm build
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
- `push` to `main`: Cloudflare Pages deploys to https://timeline-dsl.pages.dev as the production branch.
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

All calls to the Timeline DSL WASM from the Playground and runnable docs go through `site/src/lib/tdsl-wasm.ts` only. Because the npm package / release artifact from the main repository is not yet stable, the output of `wasm-pack --target web` is vendored in `site/public/wasm/`.

To update: build `crates/tdsl-wasm` in the main repo with `wasm-pack build`, then sync `apps/webui/src/wasm/tdsl_wasm.{js,d.ts}`, `tdsl_wasm_bg.wasm`, and `package.json` into `site/public/wasm/`. `pnpm build` runs `check_source` and `render_svg_from_source` smoke tests before the main build.
