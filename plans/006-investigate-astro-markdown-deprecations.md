# Plan 006: Remove or upstream the repeated Astro Markdown deprecation warnings

> **Executor instructions**: This is an investigation-first plan. Do not guess at configuration or patch generated/vendor code. Update `plans/README.md` with DONE only if warnings are resolved safely; otherwise mark BLOCKED with the owning upstream package and evidence.
>
> **Drift check (run first)**: `git diff --stat a7b011e..HEAD -- site/astro.config.mjs site/package.json site/pnpm-lock.yaml site/patches site/src/content/docs`

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: migration
- **Planned at**: commit `a7b011e`, 2026-07-18

## Why this matters

`pnpm test:unit` and build repeatedly warn that Astro Markdown `remarkPlugins`/`rehypePlugins`/`remarkRehype`, `gfm`, and `smartypants` options are deprecated and will be removed in a future major. The local config does not visibly set all of these, so the owner may be Starlight or a plugin. Resolving or documenting upstream ownership now prevents an unsafe blind migration later and reduces warning noise.

## Current state

- `site/astro.config.mjs:32-41` configures Shiki but does not explicitly set `gfm` or `smartypants`.
- Dependencies include Astro 6.4.6, Starlight 0.39.2, `@astrojs/markdown-remark` 7.2.1 and two Starlight output plugins (`site/package.json:34-46`).
- Verified at commit `a7b011e`: 203/203 unit tests and build pass, but deprecation warnings appear during Astro component tests and build.
- Markdown rendering changes can affect tables, autolinks, typography, code blocks and generated `.md`/LLM outputs.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Reproduce | `cd site && pnpm test:unit 2>&1 | tee /tmp/tdsl-test.log` | tests pass; warning baseline captured |
| Build | `cd site && pnpm build 2>&1 | tee /tmp/tdsl-build.log` | build passes |
| Docs smoke | preview + SEO/i18n/a11y smoke | all pass |

## Scope

**In scope**: investigation of installed dependency source/versions; `astro.config.mjs`, manifest/lockfile, existing patches only if upstream remediation is unavailable and narrowly safe; representative tests.

**Out of scope**: editing `node_modules`, upgrading to Astro 7, broad dependency refresh, changing rendered Markdown intentionally.

## Steps

1. Reproduce and separate each warning by phase/test. Use stack/debug facilities or targeted dependency-source search to identify the package and call site supplying deprecated options.
   - **Verify**: write a short evidence note in the eventual PR/commit explaining exact owner and version.
2. Check current official Astro/Starlight/plugin docs and release notes. Prefer a compatible package update that supports Astro 6.4.6. Do not invent a `unified()` configuration shape from the warning alone.
   - **Verify**: chosen version’s peer dependency range includes current Astro/Starlight.
3. If local code owns the setting, migrate to documented processor configuration. If upstream owns it and no compatible release exists, STOP and mark the plan BLOCKED with upstream issue/version; warning suppression is not an acceptable fix.
4. Add representative checks for headings, tables, links, code highlighting, raw/sanitized HTML and generated Markdown/LLM files before changing processors.
5. Run full build and docs smoke; compare representative generated HTML before/after for semantic drift.

## Done criteria

- [ ] Warning ownership is proven, not inferred.
- [ ] Warnings are removed via documented compatible API/update, or plan is explicitly BLOCKED on upstream.
- [ ] No intentional Markdown output change occurs.
- [ ] Unit/build/SEO/i18n/a11y pass.
- [ ] No generated or `node_modules` files are committed.

## STOP conditions

- Fix requires Astro/Starlight major upgrade.
- Only available workaround is warning suppression or editing installed files.
- Rendered docs semantics change beyond whitespace/order.
- Responsible plugin has incompatible peer dependencies.

## Maintenance notes

Keep this plan separate from future Astro 7 migration. A BLOCKED outcome with precise upstream ownership is successful investigation and prevents repeated speculative audits.
