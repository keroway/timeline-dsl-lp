#!/usr/bin/env bash
# Stop hook: warn about dev/preview servers still running for THIS repo.
#
# Why this exists:
#   smoke スクリプトは外部起動済みの dev/preview サーバに接続する設計のため、
#   手動で起動したサーバを kill し忘れて溜まりがち。作業終了 (Stop) 時に
#   「この repo に紐づく」起動中サーバを検知して PID と kill 手順を通知する。
#
# Design notes:
#   - 警告のみ。自動 kill はしない (別ターミナルで意図的に使っている可能性があるため)。
#   - repo スコープ: コマンドライン引数に repo root パスを含むプロセスだけを対象にする。
#     → 他リポジトリ / 無関係な node プロセスは誤検知しない。
#   - exit 0 固定。informational・非ブロッキング。
#
# Portability:
#   このファイルはプロジェクト非依存。他の web プロジェクトへは
#     1) このファイルをコピー
#     2) settings.json の Stop フックに登録
#   だけで使える。検知したい dev サーバの種類は DEV_SERVER_PATTERNS で増減する。

set -uo pipefail

# Claude Code sets $CLAUDE_PROJECT_DIR when invoking hooks.
# Fallback resolves the repo root from this script's location (.claude/hooks/).
REPO_ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"

# dev サーバの署名 (extended regex)。プロジェクトに合わせて増減してよい。
# 実プロセスは "node .../astro/bin/astro.mjs dev" のように bin の実ファイル名 (astro.mjs) が
# 出るため、拡張子を許容して subcommand を見る。bare `vite` (= dev) も拾う。
DEV_SERVER_PATTERNS='astro(\.[a-z]+)? (dev|preview)|vite(\.[a-z]+)?( |$)|next(\.[a-z]+)? (dev|start)|nuxt(\.[a-z]+)? (dev|preview)|webpack(\.[a-z]+)?( serve|-dev-server)|rsbuild dev|remix vite:dev|ng serve'

# repo root のパスを含み、かつ dev サーバ署名にマッチするプロセスを列挙。
# pgrep -fl はマッチ行を "PID full command line" で返す。
stale="$(pgrep -fl . 2>/dev/null \
  | grep -F "$REPO_ROOT" \
  | grep -E "$DEV_SERVER_PATTERNS" \
  | grep -v "detect-stale-dev-servers.sh" || true)"

[ -z "$stale" ] && exit 0

pids="$(printf '%s\n' "$stale" | awk '{print $1}' | tr '\n' ' ' | sed 's/ *$//')"

{
  echo "[stop-hook] この repo で dev/preview サーバが起動したままです (自動 kill はしません):"
  printf '%s\n' "$stale" | sed 's/^/  - /'
  echo "  不要なら: kill ${pids}"
} 1>&2

exit 0
