---
name: feedback_unrun_is_unfinished
description: Code that has not been executed is not finished; never report unrun work as done
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 1d998f1e-ddff-4a8a-b44f-eed3017d8746
  modified: 2026-08-06T10:55:53.388Z
---

If we have not RUN something we built, it does not count as finished. Compiling,
type-checking, passing review, and "the diff looks right" are all not running it.

**Why:** Stated as a standing rule on 2026-08-06 during
backend work. The completion bar is execution, not plausibility. A change that was
never executed has unknown behavior no matter how carefully it was written, and
calling it done hides that.

**How to apply:** Before saying anything is done, name the command that ran it and
what it printed. If a piece could not be run, say so explicitly and say why (env
missing, needs a push, needs prod access) instead of letting it ride inside a
"finished" summary. Distinguish three states out loud: run and passing / built but
never executed / not started. Prefer writing the test that fails first, then the
fix, so the run is proof rather than decoration. Related: [[feedback_demand_proof]],
[[feedback_no_self_commit]].
