# Handoff: notebook 02

Written 4 Nov, when notebook 02 was the next thing to build. **It has been carried out.**
This file is the record of what was decided and why, not current instruction: notebooks 02 to
05 all exist and run, and `notebooks/README.md` describes what they actually do.

Two details below were superseded during the build. The expected unit loss of 0.6% to 0.9%
came out at 0.394%, 0.761% and 0.002% once six further convertible unit spellings were added
to `pipeline/labels.py`. And `scripts/run_split_comparison.py`, cited here as the working
reference, differs from the shipped curation in three deliberate ways, set out in notebook
02's reconciliation section.

---

## The handoff, as written

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
