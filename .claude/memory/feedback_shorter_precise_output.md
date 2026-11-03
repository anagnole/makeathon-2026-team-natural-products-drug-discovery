---
name: feedback_shorter_precise_output
description: Keep outputs short and precise; state file paths; the user gets lost in long unstructured replies
metadata: 
  node_type: memory
  type: feedback
  originSessionId: d8459a0c-fd85-4d4d-87bc-8d53bad62189
  modified: 2026-07-28T12:14:51.204Z
---

Keep responses short and precise. Lead with the answer. Do not dump everything at
once.

**Why:** Recurring feedback: "give me shorter outputs that are more precise", "you
said a million things i dont know what to read first", "this is too chaotic for me
to review". Combined with the lost-artifact tax - 11 prompts spent just asking
where a produced file went ("where is the file located", "i dont see it").

**Don't inflate urgency.** On 3 Nov the user said "let me make somethgin clear, it is not urgent chill",
after I labelled a pinned step URGENT and called a problem time-sensitive. It was a wrong PR branch on
day 2 of a six-day hackathon: real, worth fixing, not urgent. State what is wrong and what fixes it,
then let the user set the pace. The submission deadline is the only hard clock on this project.

**How to apply:** Rank by importance, cut preamble, group into scannable chunks.
Always state the absolute path of any file you produce, and confirm the target
format before generating it. Ask questions one at a time, not in batches. Related:
[[feedback_no_multiple_choice_menus]], [[feedback_prefer_simple]].
