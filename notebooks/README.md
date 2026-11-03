# Notebooks

One stage per notebook, run in order. Each saves what the next one loads, so nothing is recomputed.
The shared code is in [`pipeline/`](pipeline); the notebooks load, call and show.

**Changed on 4 Nov, read this first if you were away.** Three pathogens ship rather than nine, the
readout is whole-organism, and NPASS is out of the pipeline. The plant-family split was rerun on
ChEMBL across all three pathogens and did not hold up, so it is a secondary analysis now and the
scaffold split carries the evaluation; the numbers are in `results/LEDGER.md` and the reasoning is
in `docs/proposal-plant-antibacterials.md`. `CLAUDE.md` has every decision and who owns which
stream. Nothing about the deliverable changed.

## Notebooks, in order

| Notebook | What it does | Main outputs |
|---|---|---|
| [`01_data.ipynb`](01_data.ipynb) | What ChEMBL, LOTUS and the GBIF backbone contain before any cleaning: coverage per organism and per target, how the activity values are reported, censoring, units, replication, the plant side, how much plant chemistry carries an antibacterial measurement, and how far the screening set sits from the training set | `data/processed/01_activities.parquet`, `01_structures.parquet`, `01_plant_occurrences.parquet`, `01_plant_structures.parquet`; figures `01_*` |
| `02_curation.ipynb` | **Next up, Leonidas.** The cleaning and labelling decisions, each a key in one `CONFIG`. Every decision it has to make is already answered, see "Notebook 02" below | `data/processed/02_labelled_<organism>.parquet`, one per pathogen |
| `03_features.ipynb` | Not written yet. Feature sets, similarity clustering, cluster-level train/validation/test split | planned |
| `04_models.ipynb` | Not written yet. Screen each feature set with one untuned model, then Optuna on the winner, then calibration | planned |
| `05_results.ipynb` | Not written yet. Precision at the head of the ranking, feature importance, diversity selection, ledger entry | planned |

## Notebook 02

The hand-off, written 4 Nov. Notebook 01's closing table listed six things 02 had to decide. All
six are now decided, and the code for most of them exists, so this is a smaller job than it looks.

**Three pathogens, one labelled table each.** `staphylococcus_aureus`, `escherichia_coli`,
`mycobacterium_tuberculosis`. Why these three is in `CLAUDE.md`.

| decision | the answer | where the code already is |
|---|---|---|
| activity threshold | 32 µM primary, with 10 µM reported as a one-line sensitivity check | `CONFIG` |
| censored rows | kept. `>` and `>=` at or above the threshold are negatives, `<` and `<=` at or below are positives, a `>` below the threshold says nothing and the compound drops out | `labels.binary_label` |
| units | convert through RDKit molecular weight. Expect 0.6% to 0.9% unconvertible and drop those rows | `labels.to_micromolar` |
| collapsing repeats | one label per compound, active wins over inactive across papers | `labels.label_table` |
| organisms together or apart | apart. Three models, no organism feature | the loop in 02 |
| plant-derived compounds | held out, not trained on. They are the only direct evidence of transfer | 03's job, but 02 has to carry the flag |

**Deduplication is by InChIKey skeleton**, not by ChEMBL id, so that salt forms and stereoisomers
do not straddle a split. `features.skeleton` does it, and notebook 01 already saved the SMILES to
InChIKey mapping in `01_structures.parquet`, so do not recompute it.

**Suggested columns** for each output table: `skeleton`, `canonical_smiles`, `label`,
`n_measurements`, `from_plant`, and `family` where LOTUS reports exactly one.

`scripts/run_split_comparison.py` already does all of this end to end for one organism. Its
`load_activity` and `build_dataset` are the working reference; lifting the shared parts into
`pipeline/` is welcome but not required.

**What 02 should show, not just compute:** how many rows each cleaning step removes, the class
balance per pathogen at both thresholds, and how much of the negative class comes from censored
rows. Those are the figures the "data science quality" criterion is looking for.

**Not yours, so no need to touch it:** features, splits, models, calibration and the applicability
domain are Eleni's stream, in notebooks 03 and 04. The two streams meet at these tables.

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
