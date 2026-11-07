import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsv } from "./csv";

/**
 * Everything on this surface is read at build time from the committed result
 * files in `results/`. Nothing is recomputed here and nothing is hard-coded:
 * if a number appears on the page, it came out of a file under RESULTS.
 */
const RESULTS = join(process.cwd(), "..", "results");

export type Tier = "in-domain" | "exploratory";

export type Compound = {
  rank: number;
  skeleton: string;
  smiles: string;
  probability: number;
  tanimoto: number;
  inDomain: boolean;
  twin: boolean;
  pathways: string[];
  superclasses: string[];
  plants: string[];
  families: string[];
  doi: string;
  tier: Tier;
  /** Plate coordinate, e.g. "C7". Assigned in reading order, 12 per row. */
  well: string;
};

export type Pathogen = {
  slug: string;
  binomial: string;
  short: string;
  envelope: string;
  envelopeNote: string;
  /** Labelled compounds behind this model. */
  labelled: number;
  plantLabelled: number;
  activeRate: number;
  distinctScaffolds: number;
  medianNnTest: number;
  medianNnPlant: number;
  /** The curation funnel, as notebook 02 recorded it. */
  rawRows: number;
  usableRows: number;
  singleFamily: number;
  /** The three partitions, split on scaffolds with plants held out. */
  train: number;
  validation: number;
  test: number;
  /** Share of test compounds whose scaffold the model had already seen. */
  seenScaffoldsScaffold: number;
  seenScaffoldsRandom: number;
  shareNnAboveTest: number;
  shareNnAbovePlant: number;
  /** The three readings of one model. */
  validationAuroc: number;
  testAuroc: number;
  plantAuroc: number;
  plantAurocLo: number;
  plantAurocHi: number;
  plantAuprc: number;
  plantPrecisionAt10: number;
  plantPrecisionAt10Lo: number;
  plantPrecisionAt10Hi: number;
  testPrecisionAt10: number;
  plantBaseRate: number;
  enrichmentTop5: number;
  precisionTop5: number;
  featureSet: string;
  domainCutoff: number;
  screened: number;
  shortlist: Compound[];
  exploratory: Compound[];
  /** How the winning model was built, read from the run's own config. */
  modelFamily: string;
  params: Record<string, number>;
  tuning: string;
  calibration: string;
  thresholdRule: string;
  thresholdUm: number;
  operatingThreshold: number;
  recallFloor: number;
  bootstrapRepeats: number;
  precisionAtThreshold: number;
  recallAtThreshold: number;
  mccAtThreshold: number;
  dataFingerprint: string;
  /** How the shortlist was cut out of the screen. */
  candidatePool: number;
  shortlistSize: number;
  diversity: string;
  medianShortlistProbability: number;
  medianShortlistTanimoto: number;
  distinctPathways: number;
  exploratoryCount: number;
};

export type Provenance = {
  commit: string;
  branch: string;
  configHash: string;
  runId: string;
  uncommitted: boolean;
};

/** Pathways are joined with " $ "; plants and families with "; ". */
const PATHWAY_SPLIT = " $ ";
const LIST_SPLIT = ";";

function splitList(value: string, separator: string): string[] {
  return value
    .split(separator)
    .map((part) => part.trim())
    .filter(Boolean);
}

function wellLabel(index: number): string {
  const row = "ABCDEFGH"[Math.floor(index / 12)] ?? "H";
  return `${row}${(index % 12) + 1}`;
}

function readCompounds(file: string, offset: number): Compound[] {
  const rows = parseCsv(readFileSync(join(RESULTS, file), "utf8"));
  return rows.map((row, i) => ({
    rank: Number(row.rank),
    skeleton: row.skeleton,
    smiles: row.canonical_smiles,
    probability: Number(row.predicted_probability),
    tanimoto: Number(row.nearest_training_tanimoto),
    inDomain: row.in_applicability_domain === "True",
    twin: row.fingerprint_twin_of_training === "True",
    pathways: splitList(row.np_pathway, PATHWAY_SPLIT),
    superclasses: splitList(row.np_superclass, PATHWAY_SPLIT),
    plants: splitList(row.source_plants, LIST_SPLIT),
    families: splitList(row.plant_families, LIST_SPLIT),
    doi: row.reference_doi,
    tier: row.tier === "exploratory" ? "exploratory" : "in-domain",
    well: wellLabel(offset + i),
  }));
}

type LedgerEntry = {
  id: string;
  run: string;
  timestamp: string;
  git?: { commit: string; branch: string; uncommitted_changes: boolean };
  config_hash?: string;
  config?: Record<string, unknown>;
  metrics?: Record<string, number>;
};

function readLedger(): Map<string, LedgerEntry> {
  const latest = new Map<string, LedgerEntry>();
  for (const entry of allRuns()) latest.set(entry.run, entry);
  return latest;
}

function allRuns(): LedgerEntry[] {
  const text = readFileSync(join(RESULTS, "runs.jsonl"), "utf8");
  const runs: LedgerEntry[] = [];
  for (const line of text.split("\n")) {
    if (line.trim()) runs.push(JSON.parse(line) as LedgerEntry);
  }
  return runs;
}

/**
 * Every split comparison ever recorded, not just the last. The negative result
 * is the scatter across these four, so the page has to plot all of them.
 */
export function loadSplitRuns() {
  return allRuns()
    .filter((entry) => entry.run === "split_comparison")
    .map((entry) => {
      const m = entry.metrics ?? {};
      return {
        task: String(entry.config?.task ?? "").replace(" MIC", ""),
        gap: m.family_minus_scaffold,
        family: m.auroc_family,
        scaffold: m.auroc_scaffold,
        random: m.auroc_random,
        familySd: m.auroc_family_sd,
        scaffoldSd: m.auroc_scaffold_sd,
        compounds: m.n_compounds,
        worseRepeats: m.family_worse_repeats,
        repeats: Number(entry.config?.repeats ?? 10),
        labelSource: String(entry.config?.label_source ?? ""),
      };
    });
}

/**
 * One real compound beside its own Murcko scaffold, both read from the result
 * files. The scaffold split groups on the second string, which is the whole
 * argument of that stage and is better shown than described.
 */
export function loadScaffoldExample() {
  const scaffolds = parseCsv(
    readFileSync(join(RESULTS, "evidence_staphylococcus_aureus.csv"), "utf8"),
  );
  const shortlist = parseCsv(
    readFileSync(join(RESULTS, "shortlist_staphylococcus_aureus.csv"), "utf8"),
  );
  const row = scaffolds.find((r) => r.skeleton === "XLGPTVJCHRTFPZ");
  const compound = shortlist.find((r) => r.skeleton === "XLGPTVJCHRTFPZ");
  if (!row?.scaffold || !compound) {
    throw new Error("the scaffold example is missing from results/");
  }
  return {
    skeleton: row.skeleton,
    smiles: compound.canonical_smiles,
    scaffold: row.scaffold,
    plant: splitList(compound.source_plants, LIST_SPLIT)[0] ?? "",
    tanimoto: Number(compound.nearest_training_tanimoto),
  };
}

const STRAINS = [
  {
    slug: "staphylococcus_aureus",
    binomial: "Staphylococcus aureus",
    short: "S. aureus",
    envelope: "Gram-positive",
    envelopeNote:
      "A thick but permeable peptidoglycan wall, and no outer membrane to cross.",
  },
  {
    slug: "escherichia_coli",
    binomial: "Escherichia coli",
    short: "E. coli",
    envelope: "Gram-negative",
    envelopeNote:
      "A second, outer membrane whose porins pass small polar molecules and stop the rest.",
  },
  {
    slug: "mycobacterium_tuberculosis",
    binomial: "Mycobacterium tuberculosis",
    short: "M. tuberculosis",
    envelope: "Acid-fast",
    envelopeNote:
      "A waxy mycolic-acid wall: to get in at all, a compound has to dissolve in lipid.",
  },
] as const;

export function loadPathogens(): Pathogen[] {
  const ledger = readLedger();

  return STRAINS.map(({ slug, binomial, short, envelope, envelopeNote }) => {
    const model = ledger.get(`model_${slug}`);
    const splits = ledger.get(`splits_${slug}`);
    const curation = ledger.get(`curation_${slug}`);
    const shortlistRun = ledger.get(`shortlist_${slug}`);
    if (!model || !splits || !curation || !shortlistRun) {
      throw new Error(`ledger is missing a stage for ${slug}`);
    }
    const m = model.metrics ?? {};
    const s = splits.metrics ?? {};
    const c = curation.metrics ?? {};
    const sl = shortlistRun.metrics ?? {};

    const shortlist = readCompounds(`shortlist_${slug}.csv`, 0);
    const exploratory = readCompounds(
      `exploratory_${slug}.csv`,
      // The exploratory wells start on the row after the shortlist ends, so the
      // domain boundary falls on a plate row edge rather than mid-row.
      Math.ceil(shortlist.length / 12) * 12,
    );

    return {
      slug,
      binomial,
      short,
      envelope,
      envelopeNote,
      labelled: c.compounds,
      plantLabelled: c.plant_derived,
      activeRate: c.active_rate,
      distinctScaffolds: s.distinct_scaffolds,
      medianNnTest: s.median_nn_tanimoto_test,
      medianNnPlant: s.median_nn_tanimoto_plant,
      rawRows: c.raw_rows,
      usableRows: c.usable_rows,
      singleFamily: c.single_family,
      train: s.train,
      validation: s.validation,
      test: s.test,
      seenScaffoldsScaffold: s.seen_scaffolds_scaffold_split,
      seenScaffoldsRandom: s.seen_scaffolds_random_split,
      shareNnAboveTest: s.share_nn_above_085_test,
      shareNnAbovePlant: s.share_nn_above_085_plant,
      validationAuroc: m.validation_auroc,
      testAuroc: m.test_auroc,
      plantAuroc: m.plant_auroc,
      plantAurocLo: m.plant_auroc_lo,
      plantAurocHi: m.plant_auroc_hi,
      plantAuprc: m.plant_auprc,
      plantPrecisionAt10: m.plant_p_at_10pct,
      plantPrecisionAt10Lo: m.plant_p_at_10pct_lo,
      plantPrecisionAt10Hi: m.plant_p_at_10pct_hi,
      testPrecisionAt10: m.test_p_at_10pct,
      plantBaseRate: m.plant_base_rate,
      enrichmentTop5: m.plant_enrichment_top_5pct,
      precisionTop5: m.plant_precision_top_5pct,
      featureSet: String(model.config?.feature_set ?? "hybrid"),
      domainCutoff: Number(shortlistRun.config?.in_domain_tanimoto ?? 0),
      screened: sl.screened,
      shortlist,
      exploratory,
      modelFamily: String(model.config?.model ?? ""),
      params: (model.config?.params ?? {}) as Record<string, number>,
      tuning: String(model.config?.tuning ?? ""),
      calibration: String(model.config?.calibration ?? ""),
      thresholdRule: String(model.config?.threshold_rule ?? ""),
      thresholdUm: Number(model.config?.threshold_um ?? 0),
      operatingThreshold: m.threshold,
      recallFloor: Number(model.config?.recall_floor ?? 0),
      bootstrapRepeats: Number(model.config?.bootstrap_repeats ?? 0),
      precisionAtThreshold: m.plant_precision_at_threshold,
      recallAtThreshold: m.plant_recall_at_threshold,
      mccAtThreshold: m.plant_mcc_at_threshold,
      dataFingerprint: String(model.config?.data_fingerprint ?? ""),
      candidatePool: Number(shortlistRun.config?.candidate_pool ?? 0),
      shortlistSize: Number(shortlistRun.config?.shortlist_size ?? 0),
      diversity: String(shortlistRun.config?.diversity ?? ""),
      medianShortlistProbability: sl.median_shortlist_probability,
      medianShortlistTanimoto: sl.median_shortlist_tanimoto,
      distinctPathways: sl.distinct_pathways,
      exploratoryCount: sl.exploratory,
    };
  });
}

export function loadProvenance(): Provenance {
  const ledger = readLedger();
  const run = ledger.get("shortlist_mycobacterium_tuberculosis");
  if (!run?.git) throw new Error("ledger is missing git state");
  return {
    commit: run.git.commit,
    branch: run.git.branch,
    configHash: run.config_hash ?? "",
    runId: run.id,
    uncommitted: run.git.uncommitted_changes,
  };
}

/**
 * One stage's configuration, exactly as the ledger recorded it. The story page
 * quotes the rules out of here rather than restating them, so a rule cannot be
 * described on the page as something other than what was run.
 */
export function loadRunConfig(run: string): Record<string, unknown> {
  const entry = readLedger().get(run);
  if (!entry) throw new Error(`ledger has no run ${run}`);
  return entry.config ?? {};
}

/** The config hash each stage stamped on its own run, in pipeline order. */
export function loadStageHashes(slug = "staphylococcus_aureus") {
  const ledger = readLedger();
  return (["curation", "splits", "model", "shortlist"] as const).map((stage) => {
    const entry = ledger.get(`${stage}_${slug}`);
    if (!entry) throw new Error(`ledger has no ${stage} run for ${slug}`);
    return { stage, hash: entry.config_hash ?? "" };
  });
}

/** The split comparison, kept as the honest negative it is. */
export function loadSplitComparison() {
  const run = readLedger().get("split_comparison");
  const m = run?.metrics ?? {};
  return {
    random: m.auroc_random,
    randomSd: m.auroc_random_sd,
    scaffold: m.auroc_scaffold,
    scaffoldSd: m.auroc_scaffold_sd,
    family: m.auroc_family,
    familySd: m.auroc_family_sd,
    gap: m.family_minus_scaffold,
    worseRepeats: m.family_worse_repeats,
    repeats: Number(run?.config?.repeats ?? 10),
    task: String(run?.config?.task ?? ""),
  };
}

/**
 * The reproduction claim, derived rather than typed. Notebooks 02 and 03, the
 * curation and split stages, were re-run end to end from the raw downloads on a
 * second machine; this counts the ledger metrics those stages actually wrote,
 * so the number on the page cannot drift away from the files behind it.
 */
export function loadReproduction() {
  const ledger = readLedger();
  let metrics = 0;
  const stages: string[] = [];
  for (const [run, entry] of ledger) {
    const stage = run.split("_")[0];
    if (stage !== "curation" && stage !== "splits") continue;
    metrics += Object.keys(entry.metrics ?? {}).length;
    if (!stages.includes(stage)) stages.push(stage);
  }
  return { metrics, stages };
}

/* --- The chemical space map ---------------------------------------------- *
   Coordinates written by scripts/export_chemical_space.py: a PCA of the same
   2048-bit Morgan fingerprints the model was trained on, fitted on the measured
   set and applied to this run's candidates. Read here, never computed here.

   The 1,500 measured compounds are turned into SVG path data at build time
   rather than shipped as points. As one <circle> each they are 130KB of markup
   per pathogen; as round-capped zero-length path segments they are a fifth of
   that, and identical on screen.
--------------------------------------------------------------------------- */

/** The cloud is drawn in bands from the left so the map plots rather than
 *  appears. One path per band, so a band can carry its own animation step. */
const SPACE_BANDS = 8;

export type SpaceMark = { x: number; y: number };
export type SpaceCandidate = SpaceMark & { tier: Tier; rank: number };

export type ChemicalSpace = {
  /** SVG `d` for each band of the measured cloud, in viewBox units. */
  bands: string[];
  /** The measured compounds that came from a plant, drawn individually. */
  plants: SpaceMark[];
  candidates: SpaceCandidate[];
  /** What the caption has to admit to. */
  measuredTotal: number;
  measuredDrawn: number;
  measuredFromPlants: number;
  varianceExplained: number;
  /** Median distance from a candidate to its nearest measured neighbour on this
   *  map, per tier. They come out equal, which is the figure's whole point. */
  nearestInDomain: number;
  nearestExploratory: number;
};

type SpaceMeta = {
  measured_total: number;
  measured_drawn: number;
  measured_from_plants: number;
  variance_explained: number;
  nearest_measured_in_domain: number;
  nearest_measured_exploratory: number;
};

export function loadChemicalSpace(slug: string): ChemicalSpace {
  const meta = (
    JSON.parse(
      readFileSync(join(RESULTS, "chemical_space.json"), "utf8"),
    ) as Record<string, SpaceMeta>
  )[slug];
  if (!meta) throw new Error(`chemical_space.json has no entry for ${slug}`);

  const rows = parseCsv(
    readFileSync(join(RESULTS, `chemical_space_${slug}.csv`), "utf8"),
  );

  // y is flipped once, here, so that nothing downstream has to remember that
  // SVG counts downwards and a scatter plot counts upwards.
  const place = (r: Record<string, string>): SpaceMark => ({
    x: Number(r.x) * 100,
    y: 100 - Number(r.y) * 100,
  });

  const bands: string[][] = Array.from({ length: SPACE_BANDS }, () => []);
  const plants: SpaceMark[] = [];
  const candidates: SpaceCandidate[] = [];

  for (const row of rows) {
    const { x, y } = place(row);
    if (row.kind === "candidate") {
      candidates.push({
        x: Number(x.toFixed(2)),
        y: Number(y.toFixed(2)),
        tier: row.tier as Tier,
        rank: Number(row.rank),
      });
      continue;
    }
    if (row.plant === "1") {
      plants.push({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) });
      continue;
    }
    // A zero-length segment with a round cap is a dot, and costs a sixth of
    // what the equivalent element would.
    const band = Math.min(SPACE_BANDS - 1, Math.floor((x / 100) * SPACE_BANDS));
    bands[band].push(`M${x.toFixed(2)} ${y.toFixed(2)}h.01`);
  }

  return {
    bands: bands.map((b) => b.join("")),
    plants,
    candidates,
    measuredTotal: meta.measured_total,
    measuredDrawn: meta.measured_drawn,
    measuredFromPlants: meta.measured_from_plants,
    varianceExplained: meta.variance_explained,
    nearestInDomain: meta.nearest_measured_in_domain,
    nearestExploratory: meta.nearest_measured_exploratory,
  };
}
