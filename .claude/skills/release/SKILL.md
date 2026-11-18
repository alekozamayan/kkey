---
name: release
description: Cut and verify a kkey release to GitHub Pages (version bump, tag push, watching deploy.yml, smoke-checking the live site). Use when the user asks to release, deploy, publish or "yayınla".
---

# Release kkey

Preconditions: on `main`, up to date with origin, clean tree, and CI green on the head commit.

1. `git switch main && git pull --ff-only && git status --short` (must be empty).
2. Choose the bump: a fix → `patch`; a new makam/usul/voice/feature → `minor`; breaking settings/UX → `major`.
   Ask the user if it's unclear.
3. `npm version <bump> -m "Release v%s"`. This bumps package.json and package-lock.json, commits and creates the tag.
4. `git push --follow-tags`.
   - **Cloud sessions cannot push tags** (HTTP 403). Stop there and give the user the exact
     commands to run on their machine.
5. Watch the deploy: `gh run list --workflow deploy.yml --limit 1`, then `gh run watch <id> --exit-status`.
   The jobs are test → build → deploy. If the test job fails, nothing is deployed. Fix it via a PR
   and release a new patch. Don't re-tag.
6. Smoke-check the live site (use `-m 15` on every curl):
   ```sh
   B=https://alekozamayan.github.io/kkey
   for p in "" manifest.webmanifest sw.js icons/apple-touch-icon.png; do curl -s -m 15 -o /dev/null -w "$p %{http_code}\n" "$B/$p"; done
   js=$(curl -s -m 15 "$B/" | grep -o 'assets/index-[^"]*\.js' | head -1); curl -s -m 15 "$B/$js" | grep -o '<new version>'
   ```
7. Add the release to the "Releases" table in `docs/STATUS.md`.

The `github-pages` environment already allows `main` and `v*.*.*` tags. If a deploy says
"not allowed to deploy due to environment protection rules", that rule was removed.
Re-add it under Settings → Environments.
