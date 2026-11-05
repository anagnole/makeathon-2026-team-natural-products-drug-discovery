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
  const text = readFileSync(join(RESULTS, "runs.jsonl"), "utf8");
  const latest = new Map<string, LedgerEntry>();
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const entry = JSON.parse(line) as LedgerEntry;
    latest.set(entry.run, entry);
  }
  return latest;
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
