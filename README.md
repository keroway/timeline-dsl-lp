# timeline-dsl-lp
Timeline DSL の LP/documentサイト

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

Cloudflare Pages の運用方式は GitHub Actions に固定します。Cloudflare Pages の GitHub 連携による自動ビルドは使わず、Actions で `site/` をビルドして `site/dist` を Wrangler から Direct Upload します。

Cloudflare Pages project:

- Project name: `timeline-dsl`
- Production branch: `main`
- Build command: `pnpm build`
- Build output directory: `site/dist`

GitHub repository secrets:

- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare account ID
- `CLOUDFLARE_API_TOKEN`: 対象 account に scope を限定した Custom API Token。権限は `Account / Cloudflare Pages / Edit` のみにし、Global API Key は使わない。

Workflows:

- `Site build`: PR、`main` push、手動実行で `pnpm build` を実行する CI。
- `Cloudflare Pages`: `main` push、`release.published`、手動実行で `pnpm build` 後に Cloudflare Pages へデプロイする。

Event policy:

- `pull_request`: `Site build` のみ実行する。Cloudflare API token を PR のビルドコードへ渡さないため、自動 preview deploy は行わない。
- `push` to `main`: `main` を production branch として https://timeline-dsl.pages.dev にデプロイする。
- `release.published`: release target commitish をビルドし、Cloudflare Pages の branch を `main` として production に再デプロイする。
- `workflow_dispatch`: `pages_branch` を指定して production または preview を手動デプロイする。`main` 以外の branch 名は preview になる。

Preview 確認は `workflow_dispatch` で `pages_branch` に `main` 以外の値を指定し、workflow summary の Alias URL で `/` と `/docs/` を開いて確認します。詳細は `site/src/content/docs/docs/deployment.mdx` を参照してください。
`pages_branch` は lowercase letters、digits、hyphen の DNS-safe な名前に限定します。
