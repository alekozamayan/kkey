---
paths:
  - ".github/**"
  - "package.json"
  - "package-lock.json"
---

# CI and release rules

- **Never modify `.github/workflows/claude.yml` or `claude-code-review.yml`.** That includes formatters:
  never run `prettier --write .github` or `prettier --write .`. Both files are in `.prettierignore`,
  and a PreToolUse hook blocks edits to them.
- `ci.yml` runs on every push/PR: npm ci → typecheck → lint → unit → build → install chromium+webkit → e2e.
- `deploy.yml` runs on `v*.*.*` tags and `workflow_dispatch`. Its jobs are test (full suite) →
  build (`upload-pages-artifact`) → deploy (`deploy-pages`, `pages: write`, `id-token: write`,
  environment `github-pages`).
- The `github-pages` environment has a deployment rule that allows `v*.*.*` tags. Without it,
  tag deploys are rejected.
- **Release** = `npm version patch|minor|major && git push --follow-tags` from an up-to-date `main`
  (see the `release` skill). The version shown in the UI comes from package.json.
- Cloud sessions can push only their working branch, **not tags**. The user pushes release tags from
  their own machine.
- Work on a branch and open a PR to `main`. CI must be green before merging. Merge only when the user asks.
- Known follow-ups: `deploy-pages@v4` / `upload-artifact@v4` run on deprecated Node 20. Bump them
  when Node 24 versions are available.
