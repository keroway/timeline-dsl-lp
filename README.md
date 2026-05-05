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

Cloudflare Pages の運用方式は Cloudflare の GitHub integration に固定します。GitHub Actions は CI として `pnpm build` を確認し、公開と Preview URL の作成は Cloudflare Pages に任せます。

Cloudflare Pages project:

- Project name: `timeline-dsl`
- Production branch: `main`
- Build command: `pnpm build`
- Build output directory: `dist`
- Root directory: `site`
- Deploy command: 設定項目が出ない

Workflows:

- `Site build`: PR、`main` push、手動実行で `pnpm build` を実行する CI。

Event policy:

- `pull_request`: GitHub Actions の `Site build` と Cloudflare Pages の Preview deployment を実行する。レビュー時は Cloudflare Pages Preview URL で `/` と `/docs/` を確認する。
- `push` to `main`: Cloudflare Pages が production branch `main` として https://timeline-dsl.pages.dev にデプロイする。
- `release.published`: Cloudflare Pages の GitHub integration では直接の deploy trigger にしない。リリースは `main` への merge 後、production deployment が成功してから公開する。
- `workflow_dispatch`: GitHub Actions の CI を手動再実行する用途に限定する。公開の再実行は Cloudflare Pages dashboard の Retry deployment を使う。

Cloudflare の設定画面で Deploy command が必須になっている場合や、非本番ブランチのデプロイコマンドが表示されている場合は、Pages ではなく Workers Builds の設定です。このサイトは Workers ではなく Pages project として、Cloudflare dashboard の Pages から GitHub repository を import します。
