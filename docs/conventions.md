# Repo conventions

Carried over from an earlier hackathon repo of ours (the AVR durability project). The structure and
the conventions are reused; no code, data or text from that repo is copied here.

## Layout

```
notebooks/          numbered, one per stage, run in order
  pipeline/         the shared code the notebooks call
  figures/          plots, named by the notebook that made them
results/
  LEDGER.md         one line per run, readable
  runs.jsonl        the same runs in full, append only
docs/               method notes
```

## Notebooks

One notebook per stage, numbered `01_`, `02_`, and so on, each with a single job and named outputs.
`notebooks/README.md` holds a table of notebook, what it does, and what it writes, so a judge can see
the whole pipeline without opening anything.

Notebooks stay thin. Anything with logic in it belongs in `pipeline/`, where it can be tested and
reused. A notebook loads, calls, and shows.

Settings live in the first cell, overridable by environment variable, and the README lists the
variables. That is what makes a run reproducible by someone who is not us.

## Figures

`pipeline/viz.py` holds the style and the save helper. Call `viz.use_style()` once per notebook and
`viz.save(fig, "03_name")` for every figure. The number prefix is the notebook that produced it.

One style everywhere means the slide deck can take figures straight from `notebooks/figures/`
without reworking them the night before the deadline.

## The run ledger

Every evaluation appends to `results/runs.jsonl` and rewrites `results/LEDGER.md`:

```python
from pipeline import ledger
ledger.record("baseline", config, metrics, note="first end-to-end run")
```

Each entry carries the time, the run name, the git commit and whether the tree was dirty, a hash of
the config, the config itself, and the metrics. `LEDGER.md` is the readable table; `runs.jsonl` keeps
everything.

This is the strongest thing we can do for the "data science quality" and "Best Scientific Rigor"
criteria. Every number in the pitch can be traced to a commit and a config, and when a result moves
we can see which change moved it. Write the entry at the time the run happens, not afterwards from
memory.

## Data

Data is never committed. It is downloaded by a script, and the README says how. The repo stays
reproducible without shipping files we do not own.

## Numbers in documents

A published number that no longer matches the code is worse than no number at all. When a result
changes, regenerate whatever quotes it in the same change.
