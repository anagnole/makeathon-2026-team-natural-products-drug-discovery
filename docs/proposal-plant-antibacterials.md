# Proposal: which plant compounds deserve a closer look as antibacterials

**This is a proposal, not a decision.** It is one of four problems we costed against the data,
written up because it was the only one where every number held. Nothing here is settled, and the
parts most likely to change are flagged as such. If you disagree with a step, the measurement
behind it is named so you can check it rather than argue about it.

Written 3 November, after a day spent measuring NPASS and ChEMBL rather than planning on top of
them. It is deliberately written to be read alongside `notebooks/01_data.ipynb` from PR #2, which
reached the same conclusions from different data. It follows `docs/conventions.md`: the code sits in
`notebooks/pipeline/`, the data is downloaded rather than committed, and the evaluation writes its
own ledger entry.

## The problem, in one paragraph

Traditional medicine points at plants, not at molecules. A medicinal plant extract holds hundreds
of compounds, a handful of which may be doing the work, and testing them one at a time in a lab is
slow and expensive. Meanwhile the open databases already hold about 740,000 known natural-product
structures and measured antibacterial activity for roughly 95,000 compounds, mostly synthetic
medicinal chemistry, with only a couple of thousand compounds in both sets. We propose to train a
model on the measured chemistry, apply it to the plant chemistry, and return a ranked, filtered,
honestly scored shortlist of plant compounds predicted to inhibit a specific pathogen, with the
plant and the literature reference attached to each one. The deliverable is not a claim that any
compound works. It is a defensible ordering of what a wet lab should test first, together with an
explicit statement of how far the model can be trusted outside the chemistry it was trained on.

## Why this one, and not the other three

Four candidates were measured, not guessed at. Ranked by what the data supports:

1. **Antibacterial ranking for one pathogen (this proposal).** 3,411 compounds carry a
   *Staphylococcus aureus* MIC, 3,145 of them labellable. Largest single-target dataset in the
   whole resource, by a factor of three over the runner-up.
2. **Per-protein-target prediction.** Dead on arrival. 99.6% of MIC rows are whole-organism
   (notebook 01); only 35 single-protein targets carry any MIC data, median 8 compounds each.
3. **Selectivity, active on bacteria and safe on human cells.** Measured and it does not work at
   this sample size. See the negative result below.
4. **Synergy between compounds in one extract.** No usable data. Combination measurements are
   almost absent from the open sources.

## Where this agrees with notebook 01, independently

The two halves of the team used different databases and different code and landed in the same
place. That is worth a slide, because independent replication is the kind of thing this jury
rewards.

| Finding | Notebook 01, from ChEMBL and LOTUS | This measurement, from NPASS |
| --- | --- | --- |
| Activity is whole-organism, not per-protein | 99.6% of MIC rows | only 2,261 compounds with any exact per-target value |
| Censored `>` rows are the negative class, not junk | 21.6% of rows | 13,648 of 67,739 rows on the ESKAPE slice, about 20% |
| Unit strings are a trap | 37 distinct strings | about 500 unconvertible rows out of 68,000, mostly `ug`, `n.a.`, `ul/ml` |
| The active threshold sits inside publication bias | 68.6% of µg/mL values at or below 32 | 55% of *S. aureus* compounds active at 32 µM |
| Plant chemistry and measured chemistry barely overlap | 2,157 compounds in both | 46% of ESKAPE-MIC compounds plant-derived, 24% plant-only |
| Replication across labs is loose | - | *S. aureus* median within-compound sd 0.15 log, 24% of compounds span more than one log |

## The two open questions from PR #2, answered with numbers

**1. The activity threshold.** It barely matters for ranking. Same compounds, same model, scaffold
split: AUROC 0.700 at 32 µM and 0.704 at 10 µM, with positive rates of 40% and 26%. Proposal: 32 µM
as the primary label, 10 µM reported as a sensitivity check in one line of the results. Spend the
argument elsewhere.

**2. Is the protein-target layer worth a second download.** Not as a modelling layer. It is worth
half a day as an *interpretation* layer: for the compounds that reach the top of the shortlist,
look up whatever target annotation exists and report it as context, clearly marked as annotation
rather than prediction. There is not enough of it to train on, and a second model trained on 8
compounds per target would be the weakest thing in the submission.

## The part that should be the scientific contribution: the family split

Everyone at a hackathon reports a random split. Better teams report a scaffold split. We can report
something neither of those shows, and we have measured it.

Hold out whole **plant families** instead of whole chemical scaffolds, so the test set is the
chemistry of plant lineages the model has never seen. That is the question a researcher actually
has: not "can you predict a new molecule" but "can you predict a plant I have not studied".

Same compounds, same model, three partitions, ten repeats. Numbers from
`scripts/run_split_comparison.py` in this PR:

762 plant compounds reported from exactly one family, 97 families, 425 Murcko scaffolds, 32%
active at 32 µM. Random forest, 500 trees, balanced class weights.

| Split | What it asks | AUROC | sd | Test scaffolds already seen in training |
| --- | --- | --- | --- | --- |
| Random | nothing hard | 0.793 | 0.038 | 56% |
| Scaffold | unseen chemical series | 0.749 | 0.049 | 0% |
| **Plant family** | **unseen plant lineages** | **0.619** | 0.064 | **23%** |

Family below scaffold in 10 of 10 paired repeats, mean difference -0.130.

The last column is the finding. The family split leaves *more* of the test chemistry visible to the
model than the scaffold split does, and it still scores lower. So the drop cannot be explained by
unseen chemistry: plant family carries difficulty that the Murcko scaffold does not account for.
A plausible mechanism, not yet tested, is that measurements within a plant family are correlated
for reasons that have nothing to do with structure, such as shared labs, shared protocols and
shared metabolite classes.

**Limits, which we state ourselves rather than wait to be asked.** The comparison runs on the
compounds reported from exactly one plant family, so it is a subset of the plant-derived set.
Repeat-to-repeat spread is 0.05 to 0.06, so the scaffold and family ranges overlap at the edges.
And the size of the gap moves with implementation details: an earlier exploratory version of this
experiment, which took molecular weights from the InChI formula layer instead of recomputing them
with rdkit, put the same three splits at 0.807, 0.734 and 0.663, a family-to-scaffold gap of -0.071
rather than -0.130. Direction identical and consistent in 8 of 10 then, 10 of 10 now. **The
direction is solid, the magnitude is not, and the write-up should say so in those words.**

A first attempt at this failed and is worth recording: holding out families from the full
plant-derived set left a 70-compound test set, because about a third of compounds are reported from
families on both sides of the split. The single-family restriction is the fix.

## A negative result, so that nobody builds it twice

The obvious design is two models, one for antibacterial activity and one for toxicity to healthy
human cells, ranked by activity times non-toxicity. **It does not work on this data, and it was
measured properly before being dropped.**

Each head is fine alone: 0.700 AUROC for activity, 0.738 for toxicity on its own task. On a
held-out set of 169 compounds that carry both kinds of measurement, with their skeletons and
scaffolds removed from both training sets, the combination scores 0.607 against 0.595 for the
activity head alone. Paired difference +0.012, 95% CI -0.042 to +0.065. Top-decile enrichment is
actually worse, 2.41x against 2.72x. Likely reason: potency and host toxicity rise together, so
their ratio carries less structural signal than either term does.

There are only 229 compounds in the whole resource with both an ESKAPE MIC and an exact
healthy-human-cell value. Every confidence interval on a set that size spans 0.5. This data cannot
validate a selectivity ranking, so we should not ship one. What we can ship is a safety *flag*: for
each shortlisted compound, report any measured human-cell value that exists, as data, not as a
prediction.

## What we would build, in six steps

1. **Clean and label.** One table, one row per compound per pathogen: labels from
   `pipeline.labels`, censored rows kept as negatives, units resolved through molecular weight,
   duplicates collapsed by InChIKey skeleton.
2. **Features.** Morgan fingerprints at radius 2, 2048 bits, plus the handful of physicochemical
   descriptors. Nothing exotic; the evaluation is where the work goes.
3. **Model and honest evaluation.** One classifier per pathogen, reported under all three splits
   side by side. The deliverable is the comparison, not the best number.
4. **Calibration and applicability domain.** A score is useless to a lab without a statement of
   when it does not apply. Nearest-neighbour Tanimoto distance to the training set, reported per
   prediction, with the score withheld or flagged beyond a stated cutoff.
5. **The screen.** Apply to the plant structures that carry no measurement, filter for
   drug-likeness, and attach the source plant, its taxonomy and the literature reference to each
   hit. This is where the organisers' own hosted COCONUT API is the right source.
6. **Output.** A ranked table and a small interface over it: pathogen in, shortlist out, with
   provenance, uncertainty and limitations on the face of it.

## What we claim, and what we do not

Claim: a reproducible ranking, with a stated and measured error rate, of which plant compounds are
most worth testing first against a named pathogen, and an honest account of how that ranking
degrades on plant lineages the model has not seen.

Do not claim: that any compound is effective, that any plant treats any condition, anything about
doses, anything clinical. Every user-facing surface says these are computational predictions from
traditional and literature data, not evidence of efficacy and not medical advice.

## Data and licence constraints, which shape the repo

- **NPASS publishes no data licence.** Its MIC table is also a copy of ChEMBL: in a random sample
  of 40 compounds, 40 of 40 were found in ChEMBL, 40 of 40 had an *S. aureus* MIC, and 39 of 40
  matched to three significant figures. So NPASS is a provenance source for us, compound to plant
  to taxonomy, and ChEMBL is the citable source of the bioactivity.
- **No NPASS or ChEMBL tables go into this repo.** Code plus download scripts plus citations.
  Anything derived that we publish carries CC BY-SA, which is ChEMBL's licence.
- LOTUS is CC0 and is the cleanest plant-to-compound edge. COCONUT is open. WFO is the recommended
  primary plant identifier.
- Every source gets a row in `docs/data-sources.md` with its licence, as PR #2 already started.

## Risks, biggest first

1. **Publication bias is in the labels, not just the data.** More than half the compounds are
   "active" because nobody publishes a natural product that did nothing. Mitigation: judge on
   precision at the head of the ranking, keep the censored negatives, and say this out loud.
2. **Transfer to plant chemistry is assumed, not shown.** The model trains largely on synthetic
   medicinal chemistry and is applied to plant structures. The couple of thousand compounds in both
   sets are the only direct evidence, and they are worth more held out than trained on. This is
   notebook 01's point and it is the right one.
3. **The family-split result could soften** on a bigger or differently built dataset. State the
   spread, do not round it away.
4. **Time.** Six steps in five days with two people. Steps 1 to 3 are the submission; 4 to 6 are
   what makes it good. If something has to go, it is the interface, not the evaluation.

## Suggested split of work

Two streams that do not block each other, meeting at the labelled table:

- **Data and screen:** the cleaning, the labelled table, the plant-side join, taxonomy, provenance
  and the final screen over the unmeasured structures.
- **Model and evaluation:** features, classifier, the three-split comparison, calibration, the
  applicability domain and the figures.

Submit Saturday, not Sunday. A submitted project can still be edited; an unsubmitted one cannot.

## What is in this PR

Code, so this is a proposal that runs rather than a document that asserts:

- `notebooks/pipeline/labels.py`: unit normalisation across 37 unit strings and censored-aware
  labelling. The function that turns a `>` row into a negative instead of dropping it.
- `notebooks/pipeline/features.py`: fingerprints, Murcko scaffolds, and the InChIKey-skeleton
  deduplication that stops near-duplicates straddling a split.
- `notebooks/pipeline/splits.py`: random, scaffold and family splits, plus `seen_group_fraction`,
  the diagnostic that makes the family result interpretable.
- `scripts/fetch_npass.py`: resumable download of the five NPASS files. No data committed.
- `scripts/run_split_comparison.py`: reproduces the table above end to end, and appends to
  `results/LEDGER.md` through `pipeline.ledger`, so every number above is traceable to a commit
  and a config hash as `docs/conventions.md` requires.
- `tests/`: 12 tests, mostly on the labelling, because that is where a silent mistake would cost
  us the most.

The modules import nothing from the rest of the repo, so they can be moved or renamed freely. They
read NPASS here only because that is where the measurement was made; the same functions work on
the ChEMBL parquet files from PR #2 with the column mapping `standard_relation` to relation,
`standard_value` to value, `standard_units` to units.

```bash
python3 -m pytest tests -q
python3 scripts/fetch_npass.py
python3 scripts/run_split_comparison.py
```

## Open questions, for whoever reads this next

1. Which pathogen do we ship first? *S. aureus* is the obvious one on data volume. Adding a second,
   probably *P. aeruginosa* at 1,207 compounds, would let us say something about whether the model
   is learning "antibacterial" or "anti-Staph".
2. Does the family split go in as the headline evaluation, or as a secondary analysis next to the
   scaffold split? Argument for headline: it is the only genuinely new thing we have.
3. Interface or no interface. A ranked table with provenance may serve the judging criteria better
   than a thin web app.
4. Do we fold these modules into `notebooks/pipeline/` properly, with the loaders pointed at the
   ChEMBL parquet files instead of the NPASS text files? That is probably step one of actually
   building this.
