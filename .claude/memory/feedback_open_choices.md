---
name: feedback_open_choices
description: "EthnoHack idea, data sources and stack are not decided; never write the 2 Nov Track 2 recommendation into docs or code as settled"
metadata:
  type: feedback
---

Superseded in part: the 2 Nov team call settled the task, the models and the splits, and those are now in `CLAUDE.md` under "The project". My earlier recommendation (anti-inflammatory targets, COCONUT and LOTUS, a Streamlit demo) was **not** what the team chose; the chosen direction is antibacterial activity against specific bacterial protein targets. Don't resurrect the old proposal.

Still genuinely open, so don't write them in as settled: the team name, and anything the minutes left unclear.

The datasets question is **closed**: the user confirmed on 2 Nov that "the several datasets provided" means the organisers' own list, now in `CLAUDE.md`. Two readings died on the way there, which is the lesson: the minutes' "accept the repo invite" was read as the teammate sharing a repo holding data (the user: "she is not gonna invite me to something"; the invite goes from him to her), and before that the phrase was read as a separate hand-over that never existed. Garbled minutes generate confident wrong readings; check them against the user rather than building on them.

One of those unclear items is "auto 5-mer" in the user's own task list. The best guess, from the other pane and plausible to me, is a sequence k-mer feature with k=5, which would fit the hybrid feature engineering decision. **That is a hypothesis, not a decision.** Ask the user to confirm before it shapes the feature code; the minutes already contain one transcription error ("Ptuna" for Optuna), so the phrase may not say what it appears to.

**Why:** on Echo (23 Oct) proposals leaked into the plan, README and code as if agreed, and the user corrected it twice ("why have you assumed claude? research has not been done yet and no decisions taken").
**How to apply:** build what the call decided; for anything still open, ask rather than assume, and mark it open in `CLAUDE.md`. Recommending is fine; presenting it as settled is not. Related: [[ethnohack_context]], [[feedback_hackathon_sized]].
