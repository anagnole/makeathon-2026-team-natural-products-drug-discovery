# Notebooks

One stage per notebook, run in order. Each saves what the next one loads, so nothing is recomputed.
The shared code is in [`pipeline/`](pipeline); the notebooks load, call and show.

## Notebooks, in order

| Notebook | What it does | Main outputs |
|---|---|---|
| [`01_data.ipynb`](01_data.ipynb) | What ChEMBL, LOTUS and the GBIF backbone contain before any cleaning: coverage per organism and per target, how the activity values are reported, censoring, units, replication, the plant side, how much plant chemistry carries an antibacterial measurement, and how far the screening set sits from the training set | `data/processed/01_activities.parquet`, `01_structures.parquet`, `01_plant_occurrences.parquet`, `01_plant_structures.parquet`; figures `01_*` |
| `02_curation.ipynb` | Not written yet. The cleaning and labelling decisions, each a key in one `CONFIG`: unit conversion, censored values, collapsing repeats, the activity threshold | planned |
| `03_features.ipynb` | Not written yet. Feature sets, similarity clustering, cluster-level train/validation/test split | planned |
| `04_models.ipynb` | Not written yet. Screen each feature set with one untuned model, then Optuna on the winner, then calibration | planned |
| `05_results.ipynb` | Not written yet. Precision at the head of the ranking, feature importance, diversity selection, ledger entry | planned |

## Shared code

| Module | Contents |
|---|---|
| `pipeline/data.py` | where the data lives, loaders for each source, InChIKey computation, saving processed tables |
| `pipeline/viz.py` | plot style and figure saving |
| `pipeline/ledger.py` | the run ledger in `results/` |

## Running

From the repository root, once:

```bash
uv sync
uv run python scripts/fetch_lotus.py
uv run python scripts/fetch_taxonomy.py
uv run python scripts/fetch_chembl.py MIC
uv run python scripts/fetch_targets.py mic
```

The downloads take roughly half an hour in total: the 90 MB LOTUS export, 37,468 GBIF name lookups
and 462,603 ChEMBL rows. All four scripts are resumable, so rerunning the same command after an
interruption skips what is already on disk. `fetch_targets.py` reads the activity files, so it has
to run after `fetch_chembl.py`.

Then, from this folder:

```bash
uv run jupyter lab
```

or non-interactively:

```bash
uv run jupyter nbconvert --to notebook --execute --inplace 01_data.ipynb
```

Notebook 01 takes about six minutes, most of it computing InChIKeys for 95,529 ChEMBL structures
and RDKit descriptors for the chemical-space comparison.

**Settings.** The first cell of each notebook holds its settings. These environment variables
override the defaults:

| Variable | Effect |
|---|---|
| `ETHNOHACK_DATA_DIR` | where the data is downloaded to and read from (default `data/`) |
| `ETHNOHACK_STANDARD_TYPE` | which activity readout to load (default `mic`) |
| `ETHNOHACK_ACTIVE_UGML` | the activity reference line drawn in 01 (default 32) |
| `ETHNOHACK_FIG_DIR` | where figures are written (default `figures/`) |
| `ETHNOHACK_RESULTS_DIR` | where the run ledger is written (default `results/`) |

## Figures

Written to [`figures/`](figures), prefixed with the notebook that made them, so the slide deck can
take them straight from there. `pipeline/viz.py` holds the one style and the save helper.

## Data

No data is committed. [`../docs/data-sources.md`](../docs/data-sources.md) lists every source with
its licence and the script that downloads it. No API key is needed for any of them.
