---
name: feedback_commit_message_style
description: Commit messages are a single line, and neither commits nor PR bodies carry a Claude attribution trailer
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 1d998f1e-ddff-4a8a-b44f-eed3017d8746
  modified: 2026-08-10T14:19:35.462Z
---

Write commit messages as **one line**. No body paragraphs, no bullet lists
explaining the reasoning, and **no `Co-Authored-By: Claude` trailer**.

**Why:** stated on 2026-08-10 after I wrote a multi-paragraph message with the
co-author trailer for a docs commit. The rationale belongs in the PR description
or the code, not in every commit.

The same applies to PR descriptions: **never** append
`🤖 Generated with [Claude Code]` or any other attribution footer to a PR body.
Stated again on 2026-08-19 after I added that line to a PR.

**How to apply:** `git commit -m "Short imperative summary"`. Put context in the
PR body when a PR exists, and end that body with its last real section. This
overrides the default instructions to append a Claude co-author trailer to
commits and a generated-with footer to PRs. Related: [[feedback_no_self_commit]].
