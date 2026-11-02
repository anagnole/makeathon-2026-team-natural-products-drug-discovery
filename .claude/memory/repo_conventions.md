---
name: repo_conventions
description: "Repo structure reuses the conventions of the user's earlier AVR hackathon repo; written fresh, not copied, because that repo belongs to someone else"
metadata:
  type: project
---

On 2 Nov the user asked to carry over elements of their earlier hackathon repo
`~/Projects/dyania-hackathon-avr-durability` (origin `github.com/nickKyr/...`, the AVR durability
project): how it saves results, how it makes plots, how the notebooks are structured. Read it
read-only; never change it.

What was taken, and it is in `docs/conventions.md`:

- Numbered notebooks, one stage each, with a `notebooks/README.md` table of notebook, job, outputs.
- Notebooks stay thin; logic lives in `notebooks/pipeline/` so it can be tested and reused.
- Settings in the first cell, overridable by environment variable, documented in the README.
- `pipeline/viz.py`: one style, one `save(fig, name)`, figures prefixed by notebook number, so the
  slide deck can take them straight from `notebooks/figures/`.
- `pipeline/ledger.py`: every run appends to `results/runs.jsonl` and rewrites `results/LEDGER.md`,
  carrying the git commit, a config hash, the config and the metrics.
- Data never committed; a script downloads it and the README says how.
- Regenerate whatever quotes a number in the same change as the number.

**Why the ledger matters:** it is the cheapest strong answer to the "data science quality" criterion
and the Best Scientific Rigor award. Every number in the pitch traces to a commit and a config.

Both modules were **written fresh in that spirit, not copy-pasted**. The source repo belongs to
another GitHub account and has no licence we can rely on, and ours goes public. Keep it that way: if
anything from it is ever copied verbatim, get the owner's agreement first and credit it in the
README. Conventions and structure are not the issue; code and text are.

**How to apply:** follow `docs/conventions.md`. Don't rebuild the rest of that repo's layout
(`protocol/`, `evaluation/`, `model/`, `scripts/`): it was a medical study with more time and people.
See [[feedback_hackathon_sized]], [[ethnohack_context]].
