---
name: feedback_prefer_simple
description: Reflexively prefer the simplest solution; the user rejects over-engineering on sight
metadata: 
  node_type: memory
  type: feedback
  originSessionId: d8459a0c-fd85-4d4d-87bc-8d53bad62189
  modified: 2026-07-28T12:14:33.070Z
---

Default to the simplest solution that meets the goal. Do not propose extra
machinery, abstractions, or "robust" designs unless asked.

**Why:** Over-engineering was the single largest correction category across ~6
weeks of transcripts (12 instances). Representative: "no i dont like this its too
complicated unnecessarily", "isnt there an easier solution?", "no this sounds
complicated and bad", "what is the simplest technically speaking way to do it".
The user now pre-empts it with "lets keep it as simple as possible".

**How to apply:** Lead with the minimal approach. If a fuller design exists,
mention it in one line as an option, not as the plan. When a fix feels clever,
stop and ask whether a plainer one works. Related: [[feedback_shorter_precise_output]].
