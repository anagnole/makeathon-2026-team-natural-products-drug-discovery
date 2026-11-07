/**
 * The pipeline as twelve beats of one scroll.
 *
 * Each beat carries a claim, one line of reading, the names of the steps it
 * ran, and the calls we made with what we turned down. The quantities are not
 * here: the page reads those at build time from `results/` and draws them, so
 * the story cannot drift away from the run that produced it. Where a count
 * exists only in a notebook figure and not in the ledger, the beat says so in
 * `source`.
 *
 * `*binomial*` in any string is rendered in italics.
 */

export type Choice = {
  chose: string;
  /** What was turned down. Omitted when there was no real alternative. */
  instead?: string;
  because: string;
};

export type Beat = {
  id: string;
  /** Stage number as it is printed. It sits in the margin rule, not above the heading. */
  n: string;
  /** The notebook, script or file that does this stage. */
  where: string;
  /** The heading. One sentence, no more than about fourteen words. */
  claim: string;
  /** One line under it. Never a paragraph: the figure carries the argument. */
  reads: string;
  /** The steps, named in order. The figure beside them carries the numbers. */
  steps?: string[];
  choices?: Choice[];
  /** Files this stage writes, and the module that does the work. */
  writes?: string[];
  code?: string;
  /** Said out loud when the numbers on screen are not from the ledger. */
  source?: string;
};

export const BEATS: Beat[] = [
  {
    id: "question",
    n: "00",
    where: "EthnoHack 2026, Track 2",
    claim: "A hundred thousand plant compounds, and a bench that can make fifty.",
    reads:
      "Almost no plant compound has ever been put in front of a bacterium. The useful output is not a prediction for all of them, it is a list someone can afford to synthesise.",
    steps: [
      "A missed hit costs nothing visible",
      "A wasted synthesis costs weeks of bench time",
      "So the metric is precision at the head of the list",
      "And the result is a hypothesis for a bench, never a treatment claim",
    ],
    choices: [
      {
        chose: "Rank fifty compounds per pathogen",
        instead: "Score the whole plant chemical space and publish the table",
        because: "A ranking nobody can act on is a file, not a result.",
      },
      {
        chose: "Optimise precision at the top of the list",
        instead: "Optimise AUROC over the full set",
        because:
          "AUROC averages over a region a chemist will never reach. Only the head of the ranking gets bought.",
      },
    ],
  },
  {
    id: "idea",
    n: "01",
    where: "docs/proposal-plant-antibacterials.md",
    claim: "Learn from the compounds that have been measured. Score the ones that have not.",
    reads:
      "ChEMBL carries measured antibacterial activity, mostly for synthetic compounds. LOTUS carries which plant a natural product came from. They join on the structure itself.",
    steps: [
      "Join activity to provenance on the InChIKey skeleton",
      "One model per pathogen, not one model for bacteria",
      "Three pathogens, three different cell envelopes",
    ],
    choices: [
      {
        chose: "Three per-pathogen models",
        instead: "One general antibacterial model",
        because:
          "Pooling the labels hides the envelope difference the three pathogens were chosen to expose.",
      },
      {
        chose: "*S. aureus*, *E. coli*, *M. tuberculosis*",
        instead: "*P. aeruginosa*, *B. subtilis*",
        because:
          "A second Gram-negative adds no envelope, and a lab strain is not a clinical pathogen.",
      },
      {
        chose: "Predict whether the organism stops growing",
        instead: "Predict binding to a named bacterial protein",
        because:
          "This was the plan on day one. Beat 03 measured the data and it cannot support it.",
      },
      {
        chose: "Single compounds",
        instead: "Synergy between the components of an extract",
        because:
          "No labelled set of plant compound pairs exists at this scale to supervise it.",
      },
    ],
  },
  {
    id: "sources",
    n: "02",
    where: "scripts/fetch_*.py",
    claim: "Three sources, three licences, four scripts, and no API key anywhere.",
    reads:
      "Everything the pipeline reads is open and fetched by a script in the repository. Five other sources were considered and turned down, each for a reason worth stating.",
    choices: [
      {
        chose: "LOTUS `_frozen_metadata`",
        instead: "The smaller `_frozen` export",
        because:
          "That one carries only InChIKeys. A hash cannot be turned back into a structure, so there would be nothing to featurise.",
      },
      {
        chose: "ChEMBL alone for the labels",
        instead: "ChEMBL and NPASS as two sources",
        because:
          "NPASS is a copy: 40 of 40 sampled compounds were already in ChEMBL, 39 of 40 to three significant figures, and it publishes no licence.",
      },
      {
        chose: "Open data only",
        instead: "DrugBank, KEGG, NAPRALERT",
        because:
          "Registration, restricted bulk download, subscription. The repository is public, so anyone has to be able to get it.",
      },
    ],
    writes: [
      "data/raw/chembl_mic_*.parquet",
      "data/raw/lotus/",
      "data/raw/gbif_organisms.parquet",
    ],
    code: "docs/data-sources.md",
  },
  {
    id: "survey",
    n: "03",
    where: "notebooks/01_data.ipynb",
    claim: "We measured the download before trusting it, and it changed the project.",
    reads:
      "This notebook cleans nothing. One of its findings killed the original plan: the MIC data is measured against the whole bacterium, not against a purified protein.",
    steps: [
      "99.6% of MIC rows are whole-organism, so a per-protein model has nothing to train on",
      "No MIC row carries a pChEMBL value, so the usual quality filter empties the dataset in silence",
      "21.6% of rows are `>` or `>=`: tested, inactive, and most of the negative class",
      "37 distinct unit strings, several of which are not concentrations at all",
      "68.6% of µg/mL values sit at or below 32, which is publication bias rather than chemistry",
    ],
    choices: [
      {
        chose: "A whole-organism growth-inhibition readout",
        instead: "One model per bacterial protein, grouped by mechanism",
        because:
          "Only 35 single-protein targets carry any MIC at all, median 8 compounds. The per-target framing survives as one model per bacterium.",
      },
      {
        chose: "Cluster the chemistry and split the clusters",
        instead: "Cluster protein sequences at 90% identity",
        because:
          "With no protein in the pipeline there is no sequence to cluster. Split clusters, not rows, is the part that carries over.",
      },
    ],
    writes: [
      "data/processed/01_activities.parquet",
      "01_plant_occurrences.parquet",
      "01_plant_structures.parquet",
    ],
    code: "notebooks/pipeline/data.py",
    source:
      "Measured on 3 Nov from the real download. Notebook 01 writes figures rather than ledger metrics, so unlike every other beat these five counts are not read out of results/.",
  },
  {
    id: "curation",
    n: "04",
    where: "notebooks/02_curation.ipynb",
    claim: "Twelve cuts, one configuration, and a negative class we had to keep rather than drop.",
    reads:
      "Every cleaning decision is a key in one CONFIG dict and a counted row in an audit table, so each cut can be argued with rather than taken on trust.",
    steps: [
      "Load the raw MIC rows for the organism",
      "Drop rows ChEMBL itself flags as suspect",
      "Drop rows whose comment says no measurement was made",
      "Drop rows measured against an isolated protein",
      "Drop rows with no structure",
      "Drop rows with no usable positive numeric value",
      "Drop rows whose structure does not parse in RDKit",
      "Convert every value to micromolar, through molecular weight where the unit is a mass",
      "Refuse the unit strings that are not concentrations",
      "Deduplicate by InChIKey skeleton, collapsing salts, stereoisomers and tautomers",
      "Collapse each compound's repeats to one label, by median",
      "Label against the threshold and write the table",
    ],
    choices: [
      {
        chose: "Keep `>` and `>=` rows as negatives",
        instead: "Drop them as unusable",
        because:
          "They are most of the negative class. Dropping them leaves mostly actives and a model that cannot recognise inactivity.",
      },
      {
        chose: "The median of a compound's measurements",
        instead: "Active wins over inactive",
        because:
          "Around 27,000 compounds carry more than one measurement, and best-of lets one optimistic paper overrule many negative ones.",
      },
      {
        chose: "32 µM as the primary threshold",
        instead: "A single stricter line at 10 µM",
        because:
          "32 is the end of a doubling dilution series. 10 µM is reported alongside as a sensitivity check.",
      },
    ],
    writes: ["data/processed/02_labelled_<organism>.parquet"],
    code: "notebooks/pipeline/curation.py, labels.py",
  },
  {
    id: "features",
    n: "05",
    where: "notebooks/03_features.ipynb",
    claim: "Three descriptions of the same molecule, so that the choice between them is measured.",
    reads:
      "A fingerprint says which substructures are present. Descriptors say how the whole molecule behaves, which is what has to be true for anything to cross an envelope at all.",
    steps: [
      "Morgan fingerprint, radius 2, 2048 bits",
      "Fourteen physicochemical descriptors, from logP to fraction of sp3 carbon",
      "Hybrid: the two side by side",
      "A Murcko scaffold per compound, which the next beat splits on",
      "Fingerprints stored packed, unpacked only through one checked helper",
    ],
    choices: [
      {
        chose: "Build all three and let a cheap screen pick",
        instead: "Pick the hybrid set on principle and tune it",
        because: "It did not come out the same for all three pathogens.",
      },
      {
        chose: "Tree ensembles on 2,062 columns",
        instead: "A learned molecular representation",
        because:
          "Hackathon budget, no GPU, tens of thousands of rows. A pretrained encoder is the first thing to try next.",
      },
    ],
    writes: ["data/processed/03_features_<organism>.npz"],
    code: "notebooks/pipeline/features.py, featureset.py",
  },
  {
    id: "splits",
    n: "06",
    where: "notebooks/03_features.ipynb",
    claim: "Split the chemistry, not the rows, then hold every plant compound out of training.",
    reads:
      "A random split of this data measures memorisation. Whole ring skeletons are held out instead, and plant compounds are kept out altogether, because that is what the screen actually asks.",
    steps: [
      "Group every compound by its Murcko scaffold",
      "Hold whole scaffolds out into validation and test",
      "Remove every plant-derived compound from training",
      "Measure what the split held back, against a random split",
      "Measure how far the held-out chemistry really sits",
    ],
    choices: [
      {
        chose: "Scaffold groups as the split key",
        instead: "A random split",
        because:
          "Three quarters of randomly held-out compounds share a scaffold with training. That score is not about new chemistry.",
      },
      {
        chose: "Report nearest-neighbour distance as well as scaffold overlap",
        instead: "Report scaffold overlap alone",
        because:
          "Zero overlap is necessary and nowhere near sufficient. Removing a ring system does not remove the analogue beside it.",
      },
      {
        chose: "A plant holdout on top of the scaffold split",
        instead: "The plant-family split from the proposal",
        because: "The family split did not replicate. Beat 10 is the measurement.",
      },
    ],
    writes: ["data/processed/03_splits_<organism>.parquet"],
    code: "notebooks/pipeline/splits.py",
  },
  {
    id: "model",
    n: "07",
    where: "notebooks/04_models.ipynb",
    claim: "Eighteen cheap fits per pathogen, then tune only the winner and freeze it.",
    reads:
      "Tuning everything would spend the budget deciding what a cheap experiment answers. Calibration comes afterwards, on validation, with the model frozen.",
    steps: [
      "Fit three feature sets by two model families by three seeds, untuned",
      "Tune the winning combination with Optuna, thirty trials against validation AUROC",
      "Weight the classes rather than resample, so the base rate stays readable",
      "Calibrate on validation with the forest frozen, so calibration cannot leak",
      "Pick the operating threshold by rule: most precision at recall 0.40 or better",
      "Score once on the scaffold test set and once on the plant holdout",
    ],
    choices: [
      {
        chose: "Random forest, on all three pathogens",
        instead: "XGBoost",
        because:
          "Gradient boosting was in the screen on equal terms and did not come out ahead.",
      },
      {
        chose: "Optuna TPE",
        instead: "A grid search",
        because: "A grid spends most of its budget where the first few trials already ruled out.",
      },
      {
        chose: "Tune on validation AUROC",
        instead: "Tune on AUPRC",
        because: "Both were tried at equal budget. AUPRC gave one inconsistent win in three.",
      },
      {
        chose: "CPU",
        instead: "The Colab Pro GPU we had reserved",
        because:
          "Tree ensembles do not use it. The whole pipeline runs on a laptop in about an hour.",
      },
    ],
    writes: [
      "data/processed/04_models_<organism>.pkl",
      "04_scores_<organism>_<set>.parquet",
    ],
    code: "notebooks/pipeline/models.py",
  },
  {
    id: "ladder",
    n: "08",
    where: "notebooks/05_results.ipynb",
    claim: "The same model read three ways, and only the hardest reading answers our question.",
    reads:
      "On validation it looks strong. On held-out ring skeletons it holds up. On plant compounds held out of training, which is what a plant screen asks of it, it falls away.",
    steps: [
      "AUROC at all three stations, each with a bootstrap interval",
      "Precision at the top of the ranking, against the base rate of the same set",
      "AUPRC as well as AUROC, because the class balance shifts between the three",
      "The applicability domain, derived from the most distant set we measured on",
      "A calibration check across the prevalence shift, which it does not survive",
    ],
    choices: [
      {
        chose: "Publish all three readings and the fall between them",
        instead: "Lead with the validation or the scaffold number",
        because:
          "That fall is the most useful thing we measured. Which number leads is still an open call on this team.",
      },
      {
        chose: "A domain cutoff derived from the plant holdout",
        instead: "A round number, or one chosen to keep the shortlist full",
        because: "Past the most distant set we measured on, we have no evidence at all.",
      },
    ],
    code: "notebooks/pipeline/models.py",
  },
  {
    id: "screen",
    n: "09",
    where: "notebooks/05_results.ipynb",
    claim: "Score every untested plant structure, then cut fifty that are not copies of each other.",
    reads:
      "The top fifty by score alone would be fifty variations on one molecule. The shortlist is sampled for distance inside the high-scoring pool, and what falls outside the domain is published separately.",
    steps: [
      "Build the screening set: plant structures never measured against these three",
      "Featurise it with the same feature set the winning model was fitted on",
      "Score every compound with the calibrated model",
      "Take the top-scoring candidate pool",
      "Sample the shortlist for distance, by farthest-point sampling on fingerprints",
      "Carry each candidate's distance to the training set on its row",
      "Split in two tiers: in domain is the shortlist, outside it is exploratory",
      "Attach source plants, families, pathway and a reference DOI from LOTUS",
    ],
    choices: [
      {
        chose: "Diversity sampling inside a scored pool",
        instead: "The top fifty by score",
        because: "Near-duplicates of one hit are one hypothesis tested fifty times.",
      },
      {
        chose: "Publish out-of-domain candidates in their own tier",
        instead: "Filter them out silently",
        because: "A filtered file hides the model's limit. A second tier states it.",
      },
    ],
    writes: [
      "results/shortlist_<organism>.csv",
      "results/exploratory_<organism>.csv",
      "results/exploratory_<organism>.README.txt",
    ],
  },
  {
    id: "negatives",
    n: "10",
    where: "scripts/run_split_comparison.py",
    claim: "The result we set out to find did not replicate, so it ships as a negative.",
    reads:
      "The proposal's contribution was that holding out whole plant families is harder than holding out scaffolds. Four runs later the direction is usually right and the size never settles.",
    steps: [
      "What replicates cleanly is random above scaffold, on all three pathogens",
      "Regularisation does not close the plant gap: the sweep falls monotonically",
      "Tuning for AUPRC instead of AUROC changed nothing at equal budget",
      "Calibration does not transport across the prevalence shift, and is reported anyway",
      "The top-ranked candidate is a near-copy of a training compound on all three plates",
      "Plant provenance is incomplete, and the per-compound SHAP column is numerically impossible",
    ],
    choices: [
      {
        chose: "Report the family split as a secondary analysis",
        instead: "Report the first run as the finding",
        because:
          "Two of the three estimates come from test sets of 103 and 80 compounds. One run that size is a number, not an effect.",
      },
      {
        chose: "List the shortlist's defects on the product page",
        instead: "Fix what we could and ship the rest quietly",
        because:
          "A reader who finds a near-duplicate at rank 1 unaided has reason to distrust everything else.",
      },
    ],
    writes: ["results/LEDGER.md", "results/runs.jsonl"],
  },
  {
    id: "ledger",
    n: "11",
    where: "results/, web/",
    claim: "Every number traces to a commit and a configuration, including the ones on this page.",
    reads:
      "Each stage appends its own ledger entry: the commit, a hash of the configuration, the configuration itself, and every metric it produced.",
    steps: [
      "Each stage records its own entry in runs.jsonl and LEDGER.md",
      "Settings are environment variables with defaults, so a change is a sensitivity analysis",
      "Dependencies are pinned to the versions every number was produced with",
      "Curation and splits were re-run from the raw downloads on a second machine",
      "This interface is a static site that reads the committed results and retrains nothing",
      "The licences, the AI disclosure and the traditional-knowledge statement ship with it",
    ],
    code: "notebooks/pipeline/ledger.py, web/lib/data.ts",
  },
];
