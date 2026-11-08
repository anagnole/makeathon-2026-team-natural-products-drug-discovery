# Devpost submission text

Paste-ready. Every figure here is the one in `README.md`, which reads from
`results/runs.jsonl`. Do not round them on the way into the form.

---

## Project name

Plant Shortlist

## Elevator pitch (one line)

A lab can make fifty compounds, not a hundred thousand. We rank 97,709 untested
plant compounds against three bacteria and shortlist 150, each with a measured
number saying how much to trust it.

## Track

Track 2: Natural Products for Drug Discovery

---

## About the project

### The question

Track 2 asks: among hundreds of thousands of plant compounds, which deserve a
closer look? We took it literally.

Published antibacterial measurements are overwhelmingly not about plants. Of the
58,191 compounds with a published MIC against *S. aureus*, only 1,424 come from a
plant. A model trained on that and pointed at plant chemistry is extrapolating,
and most virtual-screening demos never measure how far. So we answer a narrower,
testable question: **when you hold every plant-derived compound out of training
entirely, how well does the model still rank them?**

### What it does

Three pathogens, one model each, chosen for three different cell envelopes so
that cross-reading between them means something: *S. aureus* (Gram-positive,
58,191 labelled compounds), *E. coli* (Gram-negative, 43,099) and
*M. tuberculosis* (acid-fast, 22,907). Each returns a ranked shortlist of 50
plant compounds carrying the source plant, the literature reference, and the
Tanimoto distance to the nearest training compound.

The evaluation ladder, same model read three ways:

| | validation | scaffold-held-out | **plant holdout** |
|---|---|---|---|
| *S. aureus* | 0.880 | 0.863 | **0.719** |
| *E. coli* | 0.882 | 0.903 | **0.682** |
| *M. tuberculosis* | 0.846 | 0.815 | **0.629** |

The ladder is not monotonic, since *E. coli* scores higher on the scaffold test
than on validation, so our claim is narrower than it looks: the plant holdout is
the hardest reading for every pathogen, and it is the only one that measures what
a plant screen actually asks for. That is the number we report.

For a lab, that is 57.0% precision in the top 10% of the *S. aureus* ranking
against a 25.3% base rate, and 5.03x enrichment in the top 5% for *E. coli*. Not
a cure: a shorter queue for the bench.

### How we built it

ChEMBL for the activity labels, LOTUS for the plant-to-compound edge, GBIF to
check which organisms are plants. Morgan fingerprints and physicochemical
descriptors, XGBoost tuned with Optuna, and **cluster-level splits**: we cluster
on chemical similarity and split the clusters, so no compound and no close
analogue can land on both sides.

Every predicted probability is published beside its distance to training. The
applicability-domain cutoff, 0.328, is the 25th percentile of the plant holdout,
the most distant set on which performance was actually measured, not a number
chosen because it looked good. Candidates past it go into a separate tier that
says in its own words that its scores are not evidence of activity.

### Challenges

**The project we planned could not be trained.** We set out to build per-protein
models. Then we measured the download: 99.6% of the ChEMBL MIC rows in our pull,
across nine bacteria, are measured against the whole organism, and only 35
single-protein targets carry any MIC at all. There was nothing there to train on.
We changed the project to fit the data rather than the other way around, so the
model predicts growth inhibition and says nothing about mechanism.

**Our headline hypothesis did not replicate.** We expected holding out whole
plant families to be harder than holding out chemical scaffolds. Measured four
separate times, the direction is usually negative and the magnitude never
settles: *S. aureus* -0.073 (paired sd 0.067), *E. coli* +0.004 (sd 0.139, the
effect vanishes), *M. tuberculosis* -0.097 (sd 0.158). The repeat-to-repeat
spread is wider than the effect, so it goes in as an honest negative, not as our
contribution.

### What we are proud of

The shortlist reports what is wrong with it. Our own distance column caught the
worst problem: the top-ranked candidate on all three plates is a near-copy of a
training compound (Tanimoto 0.986 / 0.982 / 0.976). The exact phenomenon this
project set out to measure turned up inside its own deliverable, and we published
it rather than quietly reranking. 12 / 8 / 3 of the 50 candidates per plate carry
no source plant and no reference. Per-compound SHAP values came out numerically
impossible for a probability output, so that column is withheld until we find the
cause.

One thing we did not expect: the biosynthetic pathways of the shortlisted
compounds track each pathogen's cell envelope, with alkaloids and terpenoids
dominating the acid-fast *M. tuberculosis* list (30 of 50). The model was never
given any cell-wall information. We report it as a hypothesis worth testing, not
a finding, since it partly reflects which compounds LOTUS has annotated.

### What we learned

That the split is the experiment. A scaffold holdout looked rigorous and still
flattered the model by roughly 0.15 AUROC against the question we actually care
about. Only 3.4% of plant compounds have a near-twin in training, against 13.5%
of the scaffold test set, and that distance is the whole problem.

### What is next

Not a fourth pathogen. Ten of these compounds on a real plate, with the measured
hit rate published next to the predicted one, including if it is worse.

---

## Built with

python, rdkit, scikit-learn, xgboost, optuna, shap, pandas, numpy, matplotlib,
next.js, react, tailwindcss, typescript, vercel, chembl, lotus, gbif

## Try it out

- Pitch video: https://www.youtube.com/watch?v=igDx-wXzCYc
- Live shortlists: https://ethnohack-track2.vercel.app
- Code: https://github.com/anagnole/makeathon-2026-team-natural-products-drug-discovery

---

## Required disclosures

**Not a medical or clinical claim.** Everything here is a model prediction over
published measurements and traditional-use records. Nothing has been near a
laboratory. No dose, preparation or use is implied or recommended. Output is
stated as predicted or traditional-use claims, is not evidence of efficacy, and
is not medical advice.

**Use of AI tools.** Claude (Anthropic) was used throughout as a pair programmer
and writing assistant: scaffolding the notebooks and the shared pipeline modules,
building the web app, drafting documentation, and reviewing decisions. Every
modelling and curation decision, every number reported, and the final text are
ours; we checked the outputs and are responsible for their accuracy, originality
and licensing. Several claims were corrected against the run ledger during
review.

**What existed before the hackathon.** Nothing in the repository. It was created
on 2 November 2026 and everything was built during the event. The project design
draws on prior unpublished work by one of us on antimicrobial-peptide screening
pipelines; no code, data or text from that work is in the repository.

**Data licences.** ChEMBL CC BY-SA 3.0, LOTUS CC0, GBIF backbone CC BY-NC 4.0.
NPASS was evaluated and dropped: its MIC table is a copy of ChEMBL and it
publishes no licence, so we cite ChEMBL directly.

**Responsible use.** The plant records come from published literature and
traditional knowledge sits behind many of them. Anything built on this carries
the Nagoya Protocol and Local Contexts as a condition of using the data, not as a
footnote.

## Team

**Team Arxigoi.** Leonidas Anagnou (data, curation, the plant-side join and
screen) and Eleni Nasopoulou (features, splits, models, evaluation, applicability
domain). Both at the School of Electrical and Computer Engineering, National
Technical University of Athens.
