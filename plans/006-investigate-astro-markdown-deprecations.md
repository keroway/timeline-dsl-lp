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

## Investigation results (executed 2026-07-18, commit range 001–005 merged, `astro@6.4.6` / `@astrojs/starlight@0.39.2` / `@astrojs/markdown-remark@7.2.1`)

**Outcome: BLOCKED — fix requires an Astro 7 + Starlight 0.41 major upgrade for both warnings; no compatible patch exists on the Astro 6 / Starlight 0.39–0.40 line that removes both without an unproven Markdown-processor swap.**

### Warning 1: `markdown.remarkPlugins`/`rehypePlugins`/`remarkRehype` are deprecated

- **Reproduced in**: `pnpm test:unit` (Astro component tests) and `pnpm build` (once, at config-setup time).
- **Owner, proven via `console.trace()` inserted at the exact `console.warn` call site** (`node_modules/astro/dist/core/config/validate.js`, `coerceLegacyMarkdownPlugins`): the stack trace resolves through `runHookConfigSetup` → the `astro:config:setup` hook — i.e. an **integration**, not this project's `astro.config.mjs` (which only sets `shikiConfig`).
- **Confirmed exact call site in source**: `@astrojs/starlight@0.39.2`'s `index.ts` (`astro:config:setup` hook) calls

  ```js
  updateConfig({
    markdown: {
      remarkPlugins: [...starlightRemarkPlugins(remarkRehypeOptions)],
      rehypePlugins: [...starlightRehypePlugins(remarkRehypeOptions)],
    },
    ...
  });
  ```

  This is how Starlight 0.39.x injects its own remark/rehype plugins (asides, code-tab handling, etc.) — the *only* API available to it on this Astro line.
- **Compatible fix path checked**: Starlight `0.40.0` (changelog, [PR #3923](https://github.com/withastro/starlight/pull/3923)) adds an *opt-in* Astro 6.4 `markdown.processor: satteri()` path (requires installing the new `@astrojs/markdown-satteri` package and switching the site's Markdown engine to Ast ro's new "Sätteri" processor). Per the PR description, Starlight only skips the legacy `remarkPlugins`/`rehypePlugins` assignment **when `markdown.processor` is explicitly configured to the new processor**; without opting in, 0.40.x still falls back to the same deprecated path and the warning persists. Adopting Sätteri is a genuine Markdown-processing-engine swap (different plugin pipeline), not a drop-in option change — exactly what this plan's scope and STOP conditions rule out ("Do not invent a `unified()` configuration shape from the warning alone"; "No intentional Markdown output change occurs") without the representative-output verification this plan is not resourced to carry out.
- Starlight `0.41.0` (changelog) is a **BREAKING CHANGE: "Adds support for Astro v7, drops support for Astro v6."**

### Warning 2: `markdown.gfm`/`markdown.smartypants` are deprecated

- **Reproduced in**: `pnpm build` only (not `pnpm test:unit`), during static-route generation.
- **Owner, proven via the same `console.trace()` technique**: the stack resolves through `experimental_AstroContainer.create()` → `validateConfig`. `AstroContainer.create()` (`node_modules/astro/dist/container/index.js`) calls `validateConfig(ASTRO_CONFIG_DEFAULTS, ...)`, and `ASTRO_CONFIG_DEFAULTS.markdown` (`node_modules/astro/dist/core/config/schemas/index.js`) hardcodes `gfm: true, smartypants: true`. The deprecation check in `validate.js` fires whenever `config.markdown.gfm !== undefined`, so **any** use of `experimental_AstroContainer.create()` without an explicit config override trips this — it is a **false positive baked into Astro core itself**, unrelated to any value this project (or Starlight) sets.
- **Confirmed the exact consumer**: `starlight-llms-txt@0.10.0`'s `entryToSimpleMarkdown.ts` calls `experimental_AstroContainer.create({ renderers: [...] })` (no config override) to render each docs page to Markdown for `llms.txt`/`llms-full.txt`. This runs during the `/llms-full.txt` and `/llms-small.txt` build steps, matching the observed timing.
- **This exact bug is already fixed upstream**: [withastro/astro#17261](https://github.com/withastro/astro/pull/17261) — "Fixes a false deprecation warning for `markdown.gfm` and `markdown.smartypants` when using the Container API." **Shipped in `astro@7.0.6`** (astro's own changelog: “#17261 … Fixes a false deprecation warning…” under the `7.0.6` heading, compared against `7.0.5`). There is no equivalent fix on any Astro 6.x release — the patch was never backported.

### Conclusion

Both warnings are entirely upstream-owned (Astro core and `@astrojs/starlight`), not something this project's `astro.config.mjs` or dependency choices caused. A full, safe fix requires moving to `astro@7` (for the AstroContainer false-positive fix in `7.0.6`) together with `@astrojs/starlight@0.41+` (the first Starlight line that supports Astro 7; `starlight-llms-txt`/`starlight-md-txt` compatibility with that pairing would also need re-verification) — an Astro/Starlight **major upgrade**, explicitly out of this plan's scope and an explicit STOP condition. The narrower Starlight `0.40.x` Sätteri opt-in does not remove the AstroContainer warning at all (that requires Astro 7 regardless) and would require adopting an unproven new Markdown processor to remove the other, so it is not a safe partial fix either.

**Recommendation**: track this as a natural part of a future, deliberate Astro 7 / Starlight 0.41 migration (a separate plan, per the Maintenance notes below), not as a standalone fix. No config, lockfile, or code changes were made by this investigation.
