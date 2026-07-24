# keroway 標準 justfile（site/ の package.json scripts への薄い委譲のみ）。
# 詳細なタスクは CLAUDE.md / site/package.json を参照。

default:
    @just --list

build:
    cd site && pnpm run build

test:
    cd site && pnpm run test:unit

lint:
    cd site && pnpm run lint

format:
    cd site && pnpm run format

# lint / format:check / test:unit / build / bundle-size をまとめて実行（コミット前の全通し確認）
check:
    cd site && pnpm run check
