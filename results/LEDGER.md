# Run ledger

One line per run, appended by `pipeline.ledger.record`. Every entry names the commit it came from and
a hash of its config; the full config and all metrics are in `runs.jsonl`.

| time | run | commit | config | note | auroc_family | auroc_family_sd | auroc_random | auroc_random_sd | auroc_scaffold | auroc_scaffold_sd | family_minus_scaffold | family_worse_repeats | n_compounds | positive_rate | seen_scaffolds_family | seen_scaffolds_random | seen_scaffolds_scaffold |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-03 15:32 | split_comparison | 7c3c73e+ | ae3030ac95 | proposal: random vs scaffold vs plant-family split | 0.619 | 0.064 | 0.793 | 0.038 | 0.749 | 0.049 | -0.130 | 10 | 762 | 0.316 | 0.230 | 0.557 | 0.000 |
| 2026-11-04 00:36 | split_comparison | d2f0f85+ | 325812fc7e | ChEMBL MIC, LOTUS families: random vs scaffold vs plant-family split | 0.669 | 0.066 | 0.786 | 0.048 | 0.742 | 0.038 | -0.073 | 8 | 823 | 0.350 | 0.215 | 0.529 | 0.000 |
| 2026-11-04 00:37 | split_comparison | d2f0f85+ | 5f9c3f8f09 | ChEMBL MIC, LOTUS families: random vs scaffold vs plant-family split | 0.673 | 0.085 | 0.769 | 0.036 | 0.669 | 0.096 | 0.004 | 2 | 486 | 0.140 | 0.206 | 0.545 | 0.000 |
| 2026-11-04 00:37 | split_comparison | d2f0f85+ | 834c583662 | ChEMBL MIC, LOTUS families: random vs scaffold vs plant-family split | 0.526 | 0.090 | 0.752 | 0.047 | 0.622 | 0.085 | -0.097 | 7 | 400 | 0.343 | 0.130 | 0.534 | 0.000 |
