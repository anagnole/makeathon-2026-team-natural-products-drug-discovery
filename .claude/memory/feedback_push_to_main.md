---
name: feedback_push_to_main
description: In the EthnoHack repo, commit and push straight to main when asked; no branches or PRs
metadata:
  type: feedback
---

On 2 Nov, after I put the memory up as a PR, the user said "no prs do straight to main".

**Why:** a two-person hackathon repo; PRs only add a merge step.
**How to apply:** when the user asks to push, commit on `main` and push to `origin/main`. Committing still needs their ask, see [[feedback_no_self_commit]]. This overrides the default of branching first on the default branch.
