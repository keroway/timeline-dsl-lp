#!/usr/bin/env bash
# PostToolUse hook for Edit / Write / MultiEdit.
# Runs `astro check` only when the edited file is under site/src/.
# Skips silently for other files to avoid noise.
#
# Hook input (stdin, JSON):
#   { "tool_input": { "file_path": "..." }, ... }

set -euo pipefail

# Claude Code sets $CLAUDE_PROJECT_DIR when invoking hooks.
# Fallback resolves the repo root from this script's location (.claude/hooks/).
REPO_ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"

input="$(cat)"
file_path="$(printf '%s' "$input" | node -e '
  let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
    try { const j=JSON.parse(s); console.log(j.tool_input?.file_path ?? ""); }
    catch { console.log(""); }
  });
')"

# Bail out fast for files outside site/src/ or non-Astro/TS sources.
case "$file_path" in
  */site/src/*.astro|*/site/src/*.ts|*/site/src/*.tsx|*/site/src/*.mdx|*/site/src/*.mjs)
    ;;
  *)
    exit 0
    ;;
esac

cd "$REPO_ROOT/site"

# Run astro check quietly; surface errors only.
# Exit code 2 makes Claude see the failure as feedback.
if ! out="$(pnpm -s exec astro check 2>&1)"; then
  printf 'astro check failed after editing %s\n\n%s\n' "$file_path" "$out" 1>&2
  exit 2
fi
exit 0
