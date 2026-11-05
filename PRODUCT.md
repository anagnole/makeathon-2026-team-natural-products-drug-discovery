# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js + Tailwind CSS (user's answer, 5 Nov 2026). Static-exportable: the three
`results/shortlist_*.csv`, `results/exploratory_*.csv` and the metrics in
`results/runs.jsonl` are converted to JSON at build time. No backend, no database,
no API keys. Deploy target is a static host; the repo must stay runnable from the
README's install steps alone.

The app lives in `web/` inside the existing Python research repo. It never imports
from `notebooks/` and never retrains anything, it reads committed result files only.

## Users

Primary: the EthnoHack 2026 judging panel, ethnopharmacology, natural-products
chemistry, data science and digital-health experts from the organising institutions.
They meet this project cold, for a few minutes, mostly through a pitch video in which
this app is the demo, and then possibly by opening the deployed link themselves. Their
job is to judge scientific relevance, data-science quality, technical implementation,
feasibility, impact and presentation.

Secondary, and real but not the design target: a natural-products chemist deciding
which compounds to actually synthesise. They would want filters, sorting and export.
Decided on 5 Nov that the judging panel leads and the chemist's needs are served only
where they do not slow the first audience down.

## Product Purpose

Answer the Track 2 question, "Among hundreds of thousands of plant compounds, which
deserve a closer look?", for three bacterial pathogens, and show honestly how much
confidence that answer carries.

The app turns a pathogen choice into a ranked shortlist of 50 plant-derived compounds,
each with its predicted score, its distance from anything the model was trained on,
its source plant and taxonomy, and its literature DOI. Success is a judge understanding,
without being told, both what the model claims and where that claim stops being
measured.

## Positioning

Most virtual-screening demos show a ranked list and an AUROC. This one ships the
distance from the training set next to every single row, and refuses to present
out-of-domain compounds as candidates: they are published in a separate tier that
states in its own words that its scores are not evidence of activity.

The honest headline is not "50 drug candidates". It is a measured evaluation ladder, the same model scores ~0.91 on a random split, ~0.86 when whole chemical scaffolds are
held out, and 0.63–0.72 when plant-derived compounds are held out entirely, and a
shortlist that declares its own limits. The applicability-domain cutoff is derived from
that hardest measurement, not chosen for looks.

## Operating Context

The app is seen in two situations and must hold up in both:

1. Inside a pitch video, max 10 minutes, screen-recorded, probably at 1080p, narrated.
   Demo segment is 2–3 minutes. Text must be legible at video compression; nothing
   important may depend on hover or on a slow interaction.
2. Opened directly from the Devpost project page on an unknown screen, with no narrator,
   by someone who has read nothing. Every number must carry its own explanation within
   reach.

A ≤10-slide PDF deck and a ≤10-minute video are separate deliverables that carry the
same numbers; the app must not contradict them.

## Capabilities and Constraints

Confirmed data on hand, all committed to `results/`:

- Three pathogens, one model each: *Staphylococcus aureus* (Gram-positive),
  *Escherichia coli* (Gram-negative), *Mycobacterium tuberculosis* (acid-fast).
  The three cell envelopes were chosen deliberately.
- Per pathogen: 50 in-domain shortlist rows and 15 exploratory (out-of-domain) rows.
  Columns: rank, selection order, InChIKey skeleton, canonical SMILES, predicted
  probability, ranking score, nearest-training Tanimoto, in-applicability-domain flag,
  fingerprint-twin flag, NP pathway, NP superclass, source plants, number of source
  plants, plant families, reference DOI, tier.
- Labels come from ChEMBL MIC data against the whole organism (99.6% of rows are
  whole-organism, which is why there is no per-protein model). LOTUS supplies the
  plant-to-compound edge; GBIF cross-checks which organisms are plants.
- Labelled compounds per pathogen: 58,191 / 43,099 / 22,907. Screened unmeasured plant
  structures: 97,709.
- Applicability-domain cutoff, *S. aureus*: Tanimoto 0.328, the 25th percentile of the
  plant holdout, the most distant set on which performance was measured.

Known defects in the data as it stands on 5 Nov, which the app must not paper over:

- The top-ranked candidate in all three pathogens is a near-copy of a training compound
  (nearest-training Tanimoto 0.986 / 0.982 / 0.976), and in two of the three it is the
  same non-plant anthracycline-like polyketide with no source plant and no DOI.
- One row ships at Tanimoto 1.000, correctly flagged `fingerprint_twin_of_training`.
- Missing plant provenance: 12 / 8 / 3 of 50 rows have no source plant, family or DOI.
  DOI coverage is 38 / 42 / 47 of 50.
- The `top SHAP drivers` column of `results/evidence_*.csv` is corrupt (magnitudes up to
  10^24 where probability-output SHAP must lie in [-1, 1]). Do not surface that column
  until it is fixed. Aggregate SHAP figures in `notebooks/figures/` are sound.

Undecided product facts, not to be invented:

- The team name. The repo keeps a placeholder.
- Which split leads the headline (scaffold ~0.86 vs plant holdout 0.63–0.72). Open
  team decision; the app should present the ladder rather than pick a winner.

Hard constraints:

- **No health claims.** Output must read as predicted or traditional-use claims, never
  as efficacy or medical advice. No dosing, anywhere.
- Every external dataset, API, model and library must be credited with its licence:
  ChEMBL (CC BY-SA), LOTUS (CC0), GBIF. NPASS was checked and dropped as a copy of
  ChEMBL; it is cited as a check, not a source.
- Significant generative-AI use must be disclosed.
- The repo goes public: nothing may carry secrets, promo codes or third-party names.
- Deadline Sun 8 Nov 2026, 10:00 CET. The app sits downstream of the evaluation and
  must not consume the evaluation's remaining time.

## Brand Commitments

No logo, no wordmark, no brand assets exist. Team name is unset, so the app must not
display one. The event is EthnoHack 2026, run by ETHCSTWIN; their mission line is
"Turn traditional knowledge into evidence for drug discovery." Track 2 is "Natural
Products for Drug Discovery", lead Antigoni Cheilari.

Voice: plain, measured, specific. The project's credibility rests on admitting what it
does not know, so no superlatives and no hype. Scientific names in italics.

## Evidence on Hand

Real, committed, citable:

- `results/shortlist_{staphylococcus_aureus,escherichia_coli,mycobacterium_tuberculosis}.csv`, 50 rows each.
- `results/exploratory_*.csv` + `.README.txt`, 15 rows each, with the warning text.
- `results/LEDGER.md`, `results/runs.jsonl`, every metric, traced to a commit and a
  config hash. Reproduced bit-for-bit on a second machine: 57 metrics, identical.
- `notebooks/figures/`, including the nearest-neighbour distance figure that explains
  the evaluation ladder.
- Verified headline metrics (plant holdout AUROC / plant P@10% / enrichment at top 5%):
  *S. aureus* 0.719 / 0.570 / 2.45x; *E. coli* 0.682 / 0.299 / 5.03x;
  *M. tuberculosis* 0.629 / 0.435 / 2.29x. Plant base rates 25.3% / 9.0% / 23.7%.
- A measured biological finding: the biosynthetic pathways of the shortlisted compounds
  track each pathogen's cell envelope, alkaloids and terpenoids dominate the acid-fast
  *M. tuberculosis* list (29 of 50), peptides, sugars and fatty acids appear for
  Gram-negative *E. coli* (19 of 50), phenolics for Gram-positive *S. aureus*. The model
  was never given cell-wall information. Must be presented as a hypothesis, with the
  caveat that it partly reflects LOTUS annotation coverage.

Absent, and not to be fabricated: compound images or structure renderings beyond what
can be drawn from SMILES in the browser; any experimental validation; any user, citation
or press; any performance number not in the ledger.

## Product Principles

1. **Every score travels with its distance.** A predicted probability shown without the
   nearest-training Tanimoto beside it is a misrepresentation of this model.
2. **Tiers are not a filter, they are the finding.** In-domain and exploratory are
   different kinds of statement, and the app says which one the visitor is reading.
3. **Nothing is quietly deleted.** The out-of-domain rows, the missing provenance and
   the negative results are part of the deliverable, not blemishes to hide.
4. **Explain in place.** The audience has no prior knowledge and no narrator; a term is
   defined where it is first used, not in a glossary at the end.
5. **A shortlist is a hypothesis for a lab bench.** Never a claim about treatment.

## Accessibility & Inclusion

The surface is seen through video compression and on unknown screens, so contrast and
type size carry real risk: body text must stay legible at 1080p after compression.
Full keyboard reach, visible focus, and no information conveyed by colour alone, the in-domain / exploratory distinction in particular must survive greyscale.

Responsible-use requirement from the organisers' dataset guide: user-facing output
states that these are traditional or predicted claims, not efficacy or medical advice,
and respects the Nagoya Protocol and Local Contexts for community knowledge.
