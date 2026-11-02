---
name: feedback_ask_before_installing
description: "Find third-party skills/plugins/tools, present the candidate, and ask before installing anything"
metadata:
  node_type: memory
  type: feedback
  originSessionId: b57f4822-101b-4b73-8779-6d824807a329
  modified: 2026-10-25T16:42:34.333Z
---

When asked to "find and install" a skill, plugin or tool, stop after finding it: name the candidate (repo, what it does, why it matches) and ask before installing.

**Why:** 2026-10-25 I installed latent-spaces/brag for "the brag skill" without checking; it was the wrong skill and the user had me delete it and said "before you install it, ask me".

**How to apply:** Search, verify the match against what the user described, show it, wait for a yes. Applies even when the request says "install". Related: [[feedback_demand_proof]].
