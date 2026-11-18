#!/usr/bin/env bash
# PreToolUse guard: the Claude GitHub workflows must never be modified (see CLAUDE.md).
# Blocks Edit/Write/NotebookEdit on them, and Bash commands that would rewrite them
# (e.g. `prettier --write .github` / `prettier --write .`). Exit 2 = block, stderr goes to Claude.
input="$(cat)"
protected='\.github/workflows/claude(-code-review)?\.ya?ml'
if printf '%s' "$input" | grep -Eq "\"file_path\"[[:space:]]*:[[:space:]]*\"[^\"]*${protected}\""; then
  echo "Blocked: .github/workflows/claude.yml and claude-code-review.yml must not be modified (CLAUDE.md)." >&2
  exit 2
fi
cmd="$(printf '%s' "$input" | grep -Eo '"command"[[:space:]]*:[[:space:]]*"([^"\\]|\\.)*"' | head -1)"
# Ignore heredoc bodies (documentation text), only inspect what would actually execute.
cmd="${cmd%%<<*}"
if [ -n "$cmd" ]; then
  if printf '%s' "$cmd" | grep -Eq "$protected" && printf '%s' "$cmd" | grep -Eq '(sed -i|>|tee|mv |cp |rm |prettier|perl -i|python)'; then
    echo "Blocked: this command would modify a protected Claude workflow file." >&2
    exit 2
  fi
  if printf '%s' "$cmd" | grep -Eq 'prettier[^|;&]*--write[^|;&]*(\.github|[[:space:]]\.([[:space:]]|$|\\|"))'; then
    echo "Blocked: don't run prettier --write on . or .github; format only the files you changed." >&2
    exit 2
  fi
fi
exit 0
