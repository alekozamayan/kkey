---
name: resume
description: Pick up kkey work where the last session left off. Use at the start of a session, or when the user says "continue", "where were we", "what's next" or "devam edelim".
---

# Resume kkey work

1. Read `docs/STATUS.md`. It has the current release, open work, decisions and the backlog.
   It is the handoff log and the source of truth between sessions.
2. Check the live state, and say in a few lines what differs from STATUS.md:
   ```sh
   git fetch origin && git status -sb && git log --oneline -8 origin/main
   git tag --sort=-v:refname | head -3                 # latest release tag
   gh pr list --state open 2>/dev/null                 # open PRs (local machine only; cloud uses the GitHub MCP tools)
   gh run list --limit 5 2>/dev/null                   # recent CI / deploy runs
   ```
3. If a branch has unmerged work, read its diff against `origin/main` before changing anything.
4. Propose the next step from the STATUS.md backlog, or continue the in-progress item. Don't start
   unrequested features.
5. At the end of the session, update `docs/STATUS.md` ("Current state", "In progress", "Session log").
   It must say exactly where work stopped and what comes next.
