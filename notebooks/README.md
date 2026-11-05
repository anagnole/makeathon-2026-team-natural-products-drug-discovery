# Notebooks

One stage per notebook, run in order. Each saves what the next one loads, so nothing is recomputed.
The shared code is in [`pipeline/`](pipeline); the notebooks load, call and show.

**The task.** Rank plant natural products by predicted antibacterial activity against three
pathogens, *Staphylococcus aureus*, *Escherichia coli* and *Mycobacterium tuberculosis*, one model
each, on a whole-organism readout. Precision at the head of the ranking is the metric that matters,
because the cost of a false positive is a wasted synthesis. `CLAUDE.md` has every decision and who
owns which stream; `docs/proposal-plant-antibacterials.md` has the reasoning behind the pathogens,
the readout, and the demotion of the plant-family split to a secondary analysis.

## Notebooks, in order

| Notebook | What it does | Main outputs |
|---|---|---|
| [`01_data.ipynb`](01_data.ipynb) | What ChEMBL, LOTUS and the GBIF backbone contain before any cleaning: coverage per organism and per target, how the activity values are reported, censoring, units, replication, the plant side, and how far plant chemistry sits from the measured chemistry | `data/processed/01_activities.parquet`, `01_structures.parquet`, `01_plant_occurrences.parquet`, `01_plant_structures.parquet`; figures `01_*` |
| [`02_curation.ipynb`](02_curation.ipynb) | Every cleaning and labelling decision, each a key in one `CONFIG`: unit conversion through molecular weight, censored rows kept and labelled, repeats collapsed to one label per compound, deduplication by InChIKey skeleton. Shows what each step removes, the class balance at both thresholds, and how much of the negative class is censored | `data/processed/02_labelled_<organism>.parquet`, one per pathogen; figures `02_*`; ledger entries |
| [`03_features.ipynb`](03_features.ipynb) | Three feature sets (Morgan, physicochemical descriptors, hybrid), scaffold clustering, and the cluster-level train/validation/test split with plant-derived compounds held out of training entirely. Measures how much chemistry each split really holds back, both by shared scaffolds and by nearest-neighbour similarity | `data/processed/03_features_<organism>.npz`, `03_splits_<organism>.parquet`; figures `03_*`; ledger entries |
| [`04_models.ipynb`](04_models.ipynb) | Screens every feature set against two model families over three seeds, tunes only the winner with Optuna, calibrates it on validation with the model frozen, then scores once on both held-out sets | `data/processed/04_models_<organism>.pkl`, `04_scores_<organism>_<set>.parquet`; figures `04_*`; ledger entries |
| [`05_results.ipynb`](05_results.ipynb) | Both evaluations side by side with the argument for which should lead, permutation feature importance, the applicability domain, and the ranked shortlist per pathogen with diversity selection | `results/shortlist_<organism>.csv`; figures `05_*`; ledger entries |

The two figures that carry the argument are `03_evaluation_ladder` and `03_nearest_neighbour`. The
same model scores around 0.91 on a random split, around 0.86 on a scaffold split and 0.61 to 0.66
on plant compounds held out of training. The second figure shows why: a scaffold split holds out
scaffolds, not analogues, so the median held-out compound still has a close neighbour in training,
while plant compounds sit much further out.

## Shared code

| Module | Contents |
|---|---|
| `pipeline/data.py` | where the data lives, loaders for each source, InChIKey computation |
| `pipeline/labels.py` | unit conversion, censored-aware labelling, and the units deliberately refused |
| `pipeline/curation.py` | one cleaning pass per pathogen, returning the table and a step-by-step audit |
| `pipeline/features.py` | fingerprints, Murcko scaffolds, InChIKey skeletons |
| `pipeline/featureset.py` | the three feature sets, stored packed and unpacked through one checked helper |
| `pipeline/splits.py` | random, group and three-way group splits, and the leakage diagnostic |
| `pipeline/models.py` | model builders, precision and enrichment at the head of a ranking, bootstrap intervals |
| `pipeline/viz.py` | plot style and figure saving, including figure layout so no notebook repeats it |
| `pipeline/ledger.py` | the run ledger in `results/` |

Tests live in [`../tests`](../tests): `uv run python -m pytest tests/ -q`.

## Running

From the repository root, once:

```bash
uv sync
uv run python scripts/fetch_lotus.py
uv run python scripts/fetch_taxonomy.py
uv run python scripts/fetch_chembl.py MIC
uv run python scripts/fetch_targets.py mic
```

The downloads take roughly half an hour: a 90 MB LOTUS export, 37,468 GBIF name lookups and
462,603 ChEMBL rows. All four scripts are resumable, so rerunning the same command after an
interruption skips what is already on disk. `fetch_targets.py` reads the activity files, so it has
to run after `fetch_chembl.py`.

Then, from this folder:

```bash
uv run jupyter lab
```

or non-interactively, in order:

```bash
for nb in 01_data 02_curation 03_features 04_models 05_results; do
  uv run jupyter nbconvert --to notebook --execute --inplace $nb.ipynb
done
```

### How long each takes

Measured on an M-series laptop, 10 cores. **Nothing here needs a GPU**: the models are tree
ensembles and XGBoost runs on CPU with `tree_method="hist"`.

| Notebook | Time | What dominates it |
|---|---|---|
| 01 | about 6 minutes | computing InChIKeys for 95,529 ChEMBL structures |
| 02 | under a minute | reuses 01's InChIKey table instead of recomputing it |
| 03 | about 2 to 3 minutes | featurising, then nine untuned forests for the screen |
| 04 | **45 minutes or more** | 54 screen fits, then `ETHNOHACK_TRIALS` Optuna trials per pathogen |
| 05 | about 10 minutes | featurising 97,503 screening compounds, then the similarity searches |

**To see the pipeline work without the wait, set `ETHNOHACK_TRIALS=5`.** That single setting is
the difference between ten minutes and over an hour in notebook 04. Nothing about the structure of
the result changes, only how well tuned the final model is.

### Settings

The first cell of each notebook holds its settings as a `CONFIG` dict, and these environment
variables override the defaults. Changing one and rerunning is a sensitivity analysis rather than
an edit.

| Variable | Default | Used by | Effect |
|---|---|---|---|
| `ETHNOHACK_DATA_DIR` | `data/` | all | where data is downloaded to and read from |
| `ETHNOHACK_FIG_DIR` | `notebooks/figures/` | all | where figures are written |
| `ETHNOHACK_RESULTS_DIR` | `results/` | 04, 05 | where the ledger and the shortlists are written |
| `ETHNOHACK_STANDARD_TYPE` | `mic` | 01, 02 | which ChEMBL activity readout to load |
| `ETHNOHACK_ACTIVE_UGML` | `32` | 01 | the activity reference line drawn on 01's distributions |
| `ETHNOHACK_THRESHOLD_UM` | `32` | 02 | the primary activity threshold, in µM |
| `ETHNOHACK_SENSITIVITY_UM` | `10` | 02 | the stricter threshold reported as a sensitivity check |
| `ETHNOHACK_SEED` | `0` | 03, 04, 05 | seeds the splits, the models and the diversity selection |
| `ETHNOHACK_TRIALS` | `30` | 04 | Optuna trials per pathogen; the main lever on runtime |
| `ETHNOHACK_POOL` | `500` | 05 | how many top-scoring candidates the shortlist is drawn from |
| `ETHNOHACK_SHORTLIST` | `50` | 05 | how many compounds reach the final shortlist per pathogen |
| `ETHNOHACK_NOTE` | empty | all | a short description stored with the run in the ledger |

**Use `uv sync` rather than an existing environment.** The processed parquet files are written by
pyarrow 26, and an older reader rejects them with `Repetition level histogram size mismatch`,
which looks like data corruption and is not. `pyproject.toml` floors pyarrow at 26 for that
reason, and `uv.lock` pins the exact versions every number in these notebooks was produced with.

## Figures

Written to [`figures/`](figures), prefixed with the notebook that made them, so the slide deck can
take them straight from there. `pipeline/viz.py` holds the one style and the save helper.

## What `results/` contains

| File | What it is |
|---|---|
| `shortlist_<organism>.csv` | **the deliverable.** In-domain candidates only, ranked by model score |
| `exploratory_<organism>.csv` | candidates outside the applicability domain, kept for transparency; their scores are not evidence of activity |
| `exploratory_<organism>.README.txt` | why that file must not be read as a candidate list |
| `LEDGER.md`, `runs.jsonl` | every run, with its commit, config hash, config and metrics |

Both CSVs are plain comma-separated files with a single header row, readable with
`pd.read_csv(path)` and nothing special.

## The run ledger

Every evaluation appends to `results/runs.jsonl` and rewrites `results/LEDGER.md`, carrying the git
commit, a hash of the config, the full config and the metrics. Curation, splits, models and
shortlists each record their own entry, so every number in the deck traces back to a commit and a
configuration rather than to a notebook somebody ran once.

## Data

No data is committed. [`../docs/data-sources.md`](../docs/data-sources.md) lists every source with
its licence and the script that downloads it. No API key is needed for any of them, so there is
nothing to put in a `.env`.

## History

The handoff that specified notebook 02 has been carried out and moved to
[`../docs/handoff-notebook-02.md`](../docs/handoff-notebook-02.md). It is kept as a record of what
was decided and why, not as current instruction.
