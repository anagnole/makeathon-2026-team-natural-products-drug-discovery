---
name: feedback_no_self_commit
description: "Never run git commit on the user's behalf; leave changes for them to review and commit"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: fb375a35-1962-4596-9cd4-24ec3833a9f0
  modified: 2026-10-25T16:06:46.382Z
---

Do not run `git commit` (or push) on your own. Make the edits, run verification (typecheck/lint/build), then stop and leave the changes uncommitted for the user to review.

**Why:** the user reviews changes before they become commits and pushes/PRs themselves. Auto-committing takes that control away, even on a feature branch.

**How to apply:** finish edits + verify + summarize the diff, then hand off. Only run `git commit` when explicitly asked. Creating a branch and editing files is fine; the commit is the line. If you already committed, offer a `git reset --soft` to return the changes to uncommitted. Related: [[feedback_shorter_precise_output]].
