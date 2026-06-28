---
name: Git Push Restriction
description: git push to external remotes is blocked in the main agent sandbox.
---

**Rule:** Any `git push` (and other potentially destructive git commands) is blocked in the main agent bash sandbox with error: "Destructive git operations are not allowed in the main agent."

**Why:** Replit sandboxes the main agent to prevent accidental data loss. Force pushes and remote pushes must go through project_tasks or be done by the user directly.

**How to apply:** When the user wants to push code to GitHub (or any external remote), give them the exact shell commands to run in the Replit shell themselves:

```bash
TOKEN="<their_github_pat>"
git remote add gh-push "https://<username>:${TOKEN}@github.com/<owner>/<repo>.git"
git push gh-push HEAD:main
git remote remove gh-push
```

If the remote has existing commits (e.g., auto-init README), they may need `--force` flag.
