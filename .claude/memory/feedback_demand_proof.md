---
name: feedback_demand_proof
description: Separate confirmed evidence from hypothesis; never present a plausible narrative as a finding
metadata: 
  node_type: memory
  type: feedback
  originSessionId: d8459a0c-fd85-4d4d-87bc-8d53bad62189
  modified: 2026-07-28T12:14:42.987Z
---

In any investigation, explicitly separate what is **confirmed by evidence** from
what is **hypothesis**. Do not conclude until the path is traced end to end.

**Why:** Recurring correction across investigations (6+ instances): "this is
still not proof, it is just that you found errors in the eventhandler, go deeper",
"are you sure? this sounds lkke youre guessing", "do you have any proof of that".
Finding errors in a log is not proof those errors caused the reported symptom.

**How to apply:** State evidence and the reasoning chain before any conclusion.
Label uncertain claims as hypotheses. Also treat existing repo docs and code as
possibly stale or dead ("i dont trust the sources you read 100%") - verify against
actual usage (imports, CI, deploy manifests) before relying on it. Related:
[[feedback_prefer_simple]], [[feedback_unrun_is_unfinished]].
