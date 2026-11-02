---
name: feedback_one_thing_at_a_time
description: Build only the one scoped item; write up the rest as a ticket instead of implementing everything found
metadata: 
  node_type: memory
  type: feedback
  originSessionId: b1d17773-8eaa-44dd-8404-fa4bb0ea5347
  modified: 2026-09-01T10:38:37.322Z
---

When investigation turns up several related problems, implement only the one the
user scoped. Write the others up as a ticket with root cause and proposed fix.
The user said it directly: "lets only do the 1st one ... and then we will document
the other two bugs and a proposed fix in a ticket but not work on everything at once."

Also: do not start building a step that a pending answer (from a client/colleague)
could still change, even when the reasoning says the work is needed either way.
I once started a build step before a client's reply and was told "no no no we dont know
if we still need the audio player and thats later in the steps."

**Why:** finding N problems is not permission to fix N problems. Scope creep buries
the reviewable change, and a step ordered behind an unanswered question can be
invalidated by the answer.

**How to apply:** fix the scoped item, ticket the rest, and say plainly what was left alone and
where it is written down. Respect the plan's stated order rather than re-deriving it.
