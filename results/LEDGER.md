# Run ledger

One line per run, appended by `pipeline.ledger.record`. Every entry names the commit it came from and
a hash of its config; the full config and all metrics are in `runs.jsonl`.

| time | run | commit | config | note | auroc_family | auroc_family_sd | auroc_random | auroc_random_sd | auroc_scaffold | auroc_scaffold_sd | family_minus_scaffold | family_worse_repeats | n_compounds | positive_rate | seen_scaffolds_family | seen_scaffolds_random | seen_scaffolds_scaffold |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-03 15:32 | split_comparison | 7c3c73e+ | ae3030ac95 | proposal: random vs scaffold vs plant-family split | 0.619 | 0.064 | 0.793 | 0.038 | 0.749 | 0.049 | -0.130 | 10 | 762 | 0.316 | 0.230 | 0.557 | 0.000 |
