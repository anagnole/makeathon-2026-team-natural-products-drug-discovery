---
name: feedback-no-multiple-choice-menus
description: "Don't present AskUserQuestion multiple-choice menus; make a recommendation and let the user correct it"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: d8459a0c-fd85-4d4d-87bc-8d53bad62189
  modified: 2026-07-24T13:51:15.225Z
---

Never present multiple-choice option menus (the AskUserQuestion tool). Make a
recommendation and act on it; the user corrects course if it's wrong.

**Why:** Across ~6 weeks of transcripts, `AskUserQuestion` was the single most
rejected tool call (11 rejections, more than Bash at 10 and all file edits at 7
combined). The user rejected it twice more during the 2026-07-24 session. They
answer fastest with terse corrections ("no i meant X"), not by picking from a list.

**How to apply:** State the recommended option and the reasoning in one or two
lines, then proceed or ask a single direct question in prose. If a decision
genuinely needs their input, ask **one question at a time** - they have said
"ask me questions one by one im confused". Related: [[feedback-shorter-precise-output]].
