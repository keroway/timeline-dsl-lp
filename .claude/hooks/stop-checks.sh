#!/usr/bin/env bash
# Stop hook. Runs at the end of a Claude turn to:
#   1) Surface failing GitHub PR checks on the current branch (if any).
#   2) Remind about i18n pair drift if only one side of docs was changed.
#
# Output goes to stderr so Claude sees it as feedback for the next turn.
# Exit code 0 always — this is informational, not blocking.

set -uo pipefail

INPUT="$(cat || true)"

if command -v jq >/dev/null 2>&1; then
  STOP_HOOK_ACTIVE="$(printf '%s' "$INPUT" | jq -r '.stop_hook_active // false' 2>/dev/null || echo false)"
else
  # jq 非依存フォールバック: 空白を除いた生 JSON を直接照合する
  COMPACT_INPUT="$(printf '%s' "$INPUT" | tr -d ' \t\n\r')"
  case "$COMPACT_INPUT" in
    *'"stop_hook_active":true'*) STOP_HOOK_ACTIVE="true" ;;
    *) STOP_HOOK_ACTIVE="false" ;;
  esac
fi

# 無限ループ防止: 現状は常に exit 0 (非ブロッキング) なので実害はないが、
# 将来 exit 2 に変える判断をしたときに備えてガードだけ先に入れておく。
if [ "$STOP_HOOK_ACTIVE" = "true" ]; then
  exit 0
fi

# Claude Code sets $CLAUDE_PROJECT_DIR when invoking hooks.
# Fallback resolves the repo root from this script's location (.claude/hooks/).
REPO_ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$REPO_ROOT" 2>/dev/null || exit 0

branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")"

# --- 1) i18n pair drift hint -------------------------------------------------
# Compare staged + unstaged changes for ja/en doc pairs.
diff_files="$(git diff --name-only HEAD 2>/dev/null; git diff --name-only --cached 2>/dev/null)"
ja_only=()
en_only=()
while IFS= read -r f; do
  [ -z "$f" ] && continue
  case "$f" in
    site/src/content/docs/docs/*.mdx)
      base="${f#site/src/content/docs/docs/}"
      pair="site/src/content/docs/en/docs/${base}"
      if ! printf '%s\n' "$diff_files" | grep -qx "$pair"; then
        ja_only+=("$f")
      fi
      ;;
    site/src/content/docs/en/docs/*.mdx)
      base="${f#site/src/content/docs/en/docs/}"
      pair="site/src/content/docs/docs/${base}"
      if ! printf '%s\n' "$diff_files" | grep -qx "$pair"; then
        en_only+=("$f")
      fi
      ;;
  esac
done < <(printf '%s\n' "$diff_files" | sort -u)

if [ "${#ja_only[@]}" -gt 0 ] || [ "${#en_only[@]}" -gt 0 ]; then
  {
    echo "[stop-hook] i18n pair drift detected. Update the matching translation:"
    for f in "${ja_only[@]}"; do echo "  - JA changed without EN: $f"; done
    for f in "${en_only[@]}"; do echo "  - EN changed without JA: $f"; done
  } 1>&2
fi

# --- 2) Failing PR checks on current branch ----------------------------------
# Only attempt if gh is logged in and a PR exists for the branch.
if [ -n "$branch" ] && [ "$branch" != "main" ] && command -v gh >/dev/null 2>&1; then
  if pr_json="$(gh pr view --json number,url,statusCheckRollup 2>/dev/null)"; then
    # shellcheck disable=SC2016 # node script は node の template literal を使うため展開不要
    failing="$(printf '%s' "$pr_json" | node -e '
      let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
        try {
          const j=JSON.parse(s);
          const checks=j.statusCheckRollup||[];
          const bad=checks.filter(c=>{
            const st=(c.state||c.conclusion||c.status||"").toString().toUpperCase();
            return ["FAILURE","ERROR","TIMED_OUT","CANCELLED","ACTION_REQUIRED"].includes(st);
          });
          if(bad.length===0){ process.exit(0); }
          console.log(`PR #${j.number} ${j.url}`);
          for(const c of bad){
            const name=c.name||c.context||c.workflowName||"check";
            const st=c.state||c.conclusion||c.status||"";
            const url=c.detailsUrl||c.targetUrl||"";
            console.log(`  - ${st}: ${name} ${url}`);
          }
        } catch(e) { /* ignore */ }
      });
    ')"
    if [ -n "$failing" ]; then
      {
        echo "[stop-hook] Failing PR checks on '$branch':"
        printf '%s\n' "$failing"
        echo "  Hint: run \`gh pr checks --watch\` or invoke /fix-pr-checks (if defined) to diagnose."
      } 1>&2
    fi
  fi
fi

exit 0
