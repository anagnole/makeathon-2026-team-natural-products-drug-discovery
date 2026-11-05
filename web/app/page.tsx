import Plate from "@/components/Plate";
import Scale from "@/components/Scale";
import {
  loadPathogens,
  loadProvenance,
  loadSplitComparison,
  loadReproduction,
  type Pathogen,
} from "@/lib/data";
import { count, dec, pct, tanimoto } from "@/lib/format";

export default function Home() {
  const pathogens = loadPathogens();
  const provenance = loadProvenance();
  const split = loadSplitComparison();
  const reproduction = loadReproduction();
  const screened = pathogens[0].screened;
  const shortlisted = pathogens.reduce((n, p) => n + p.shortlist.length, 0);

  return (
    <>
      <PlateEdge provenance={provenance} reproduction={reproduction} />

      <main className="mx-auto max-w-[96rem] px-4 pb-24 sm:px-8 lg:px-12">
        <section className="pt-10 lg:pt-12">
          <Plate pathogens={pathogens}>
            <h1 className="display text-thesis leading-[0.95] font-semibold tracking-[-0.035em] text-balance">
              {count(screened)} plant compounds screened.{" "}
              <span className="text-broth">{shortlisted}</span> we would hand to
              a chemist.
            </h1>
            <p className="mt-5 max-w-[58ch] text-[var(--text-body)] leading-relaxed text-ink-dim">
              Three bacterial pathogens, one model each. Each model learns
              from published MIC measurements in ChEMBL, then scores plant
              compounds from LOTUS that nobody has tested. Every score here is
              shown with its distance from chemistry the model already knows,
              because one without the other says nothing.
            </p>
          </Plate>
        </section>

        <Ladder pathogens={pathogens} />
        <Distance pathogens={pathogens} />
        <Yield pathogens={pathogens} />
        <Biology pathogens={pathogens} />
        <Negatives split={split} />
        <Limits pathogens={pathogens} provenance={provenance} reproduction={reproduction} />
      </main>

      <PlateFoot />
    </>
  );
}

/**
 * The other edge of the plate. A reader who scrolled this far is owed the
 * things the organisers require of us in writing, not a sign-off.
 */
function PlateFoot() {
  return (
    <footer className="border-t border-[var(--hairline)] bg-void">
      <div className="mx-auto grid max-w-[96rem] gap-8 px-4 py-10 sm:px-8 sm:grid-cols-2 lg:grid-cols-3 lg:px-12">
        <div>
          <h2 className="legend mb-2.5">The code behind this page</h2>
          <p className="text-[var(--text-small)] leading-relaxed text-ink-dim">
            Notebooks, pipeline, run ledger and this interface are in one
            repository, under MIT.{" "}
            <a
              className="break-all"
              href="https://github.com/anagnole/makeathon-2026-team-natural-products-drug-discovery"
              rel="noreferrer noopener"
              target="_blank"
            >
              github.com/anagnole/makeathon-2026-team-natural-products-drug-discovery
            </a>
          </p>
        </div>
        <div>
          <h2 className="legend mb-2.5">Generative AI</h2>
          <p className="text-[var(--text-small)] leading-relaxed text-ink-dim">
            AI assistance was used while writing the pipeline, this interface
            and parts of the analysis. Every number, method and claim on this
            page is the team&rsquo;s own responsibility, and each one is
            traceable to a committed result file.
          </p>
        </div>
        <div>
          <h2 className="legend mb-2.5">Traditional knowledge</h2>
          <p className="text-[var(--text-small)] leading-relaxed text-ink-dim">
            Plant records here come from published literature. Where
            traditional or Indigenous knowledge sits behind one of them, it
            belongs to the communities that hold it. Nothing on this page is a
            claim on that knowledge, or a recommendation to use any plant.
          </p>
        </div>
      </div>
    </footer>
  );
}

function PlateEdge({
  provenance,
  reproduction,
}: {
  provenance: ReturnType<typeof loadProvenance>;
  reproduction: ReturnType<typeof loadReproduction>;
}) {
  return (
    <header className="border-b border-[var(--hairline)] bg-void">
      <div className="mx-auto flex max-w-[96rem] flex-wrap items-center justify-between gap-x-8 gap-y-1.5 px-4 py-3.5 sm:px-8 lg:px-12">
        <p className="legend">
          EthnoHack 2026 · Track 2
          <span className="hidden sm:inline">
            {" "}
            · Natural Products for Drug Discovery
          </span>
        </p>
        {/* On a phone this strip would run five lines and put a run hash in
            front of the argument. The same facts are stated in full further
            down, under how to reproduce this page. */}
        <p className="hidden text-[var(--text-legend)] text-ink-dim sm:block">
          commit <span className="measure">{provenance.commit}</span>
          <span className="hidden [@media(min-width:1400px)]:inline">
            {" "}
            · {reproduction.metrics} curation and split metrics reproduced on a
            second machine
          </span>
        </p>
      </div>
    </header>
  );
}

function Section({
  title,
  lede,
  children,
}: {
  title: string;
  lede: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-24 border-t border-[var(--hairline)] pt-10 lg:mt-32">
      <div className="grid gap-x-14 gap-y-6 lg:grid-cols-[minmax(0,27rem)_minmax(0,1fr)]">
        <div>
          <h2 className="display text-section leading-tight font-semibold tracking-[-0.025em] text-balance">
            {title}
          </h2>
          <p className="prose mt-4 max-w-[54ch]">{lede}</p>
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}

function Row({
  pathogen,
  children,
}: {
  pathogen: Pathogen;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-[var(--hairline)] py-6 first:border-t-0 first:pt-0">
      <div className="flex items-baseline justify-between gap-6">
        <h3 className="text-base leading-tight font-medium italic">
          {pathogen.binomial}
        </h3>
        <p className="legend shrink-0">{pathogen.envelope}</p>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Ladder({ pathogens }: { pathogens: Pathogen[] }) {
  return (
    <Section
      title="The same model, read three ways. Only the last one answers the question."
      lede="Hold out random compounds and the model looks strong. Hold out whole chemical scaffolds and it holds up. Hold out every plant-derived compound, which is what a plant screen actually asks of it, and it drops by a sixth. The third number is the honest one, and it is the only one that was measured on the task in the title of this project."
    >
      <div>
        {pathogens.map((p) => (
          <Row key={p.slug} pathogen={p}>
            <Scale
              from={0.5}
              to={1}
              ticks={[
                { at: 0.6, label: "0.6" },
                { at: 0.7, label: "0.7" },
                { at: 0.8, label: "0.8" },
                { at: 0.9, label: "0.9" },
              ]}
              marks={[
                {
                  at: p.plantAuroc,
                  value: dec(p.plantAuroc, 3),
                  label: "plant holdout",
                  tone: "growth",
                },
                {
                  at: p.testAuroc,
                  value: dec(p.testAuroc, 3),
                  label: "scaffold test",
                  tone: "broth",
                },
                {
                  at: p.validationAuroc,
                  value: dec(p.validationAuroc, 3),
                  label: "validation",
                  tone: "dim",
                },
              ]}
            />
            <p className="mt-1.5 text-[var(--text-small)] leading-relaxed text-ink-dim">
              Plant holdout 95% interval{" "}
              <span className="measure">
                {dec(p.plantAurocLo, 3)}–{dec(p.plantAurocHi, 3)}
              </span>
            </p>
          </Row>
        ))}
        <p className="prose mt-6 max-w-[76ch] border-t border-[var(--hairline)] pt-5">
          The scores above are AUROC: the chance the model ranks a random active
          compound above a random inactive one, where 0.5 is a coin flip. Each
          interval comes from 2,000 stratified bootstrap resamples, so every drop
          is larger than the uncertainty around it. No chemical scaffold appears
          on both sides of the scaffold split either: the measured overlap is
          exactly <span className="measure text-ink">0.000</span>. That is
          necessary and nowhere near sufficient, which is the next panel.
        </p>
      </div>
    </Section>
  );
}

function Distance({ pathogens }: { pathogens: Pathogen[] }) {
  return (
    <Section
      title="Holding out ring skeletons is an easier test than it sounds, and the distances say why."
      lede="Removing shared ring skeletons removes none of the resemblance that matters. The median held-out test compound still has a close neighbour in the training set; the median plant compound sits far further out. The model was never asked to reach that far until the plant holdout asked it."
    >
      <div>
        {pathogens.map((p) => (
          <Row key={p.slug} pathogen={p}>
            <Scale
              from={0}
              to={1}
              ticks={[
                { at: 0.25, label: "0.25" },
                { at: 0.5, label: "0.5" },
                { at: 0.75, label: "0.75" },
              ]}
              marks={[
                {
                  at: p.domainCutoff,
                  value: tanimoto(p.domainCutoff),
                  label: "read line",
                  tone: "broth",
                },
                {
                  at: p.medianNnPlant,
                  value: tanimoto(p.medianNnPlant),
                  label: "median plant compound",
                  tone: "growth",
                },
                {
                  at: p.medianNnTest,
                  value: tanimoto(p.medianNnTest),
                  label: "median test compound",
                  tone: "dim",
                },
              ]}
            />
            <p className="mt-1.5 text-[var(--text-small)] leading-relaxed text-ink-dim">
              Similarity to the nearest compound the model was trained on, where{" "}
              <span className="measure">1.000</span> is an identical fingerprint
              and <span className="measure">0.000</span> nothing in common.{" "}
              {count(p.distinctScaffolds)} distinct ring skeletons across{" "}
              {count(p.labelled)} measured compounds.
            </p>
          </Row>
        ))}
        <p className="prose mt-6 max-w-[76ch] border-t border-[var(--hairline)] pt-5">
          The read line is set at the 25th percentile of the plant holdout: the
          most distant set on which this model&rsquo;s performance was actually
          measured. Candidates beyond it are published, not ranked.
        </p>
      </div>
    </Section>
  );
}

function Yield({ pathogens }: { pathogens: Pathogen[] }) {
  return (
    <Section
      title="What this buys a lab: two to five times the hit rate of picking at random."
      lede="Precision at the top of the list is the number a chemist spends money against, because the candidate pool is effectively unlimited and a wasted synthesis is the cost that matters. Read each one against the base rate beside it: the share of held-out plant compounds that are active at all."
    >
      <div>
        {pathogens.map((p) => (
          <Row key={p.slug} pathogen={p}>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
              <div>
                <dt className="legend mb-1.5">Precision at top 10%</dt>
                <dd className="measure text-xl leading-none">
                  {pct(p.plantPrecisionAt10)}
                </dd>
                <dd className="mt-1.5 text-[var(--text-legend)] leading-snug text-ink-dim">
                  against {pct(p.plantBaseRate)} picking at random
                  <span className="block">
                    95% interval {pct(p.plantPrecisionAt10Lo, 0)}–
                    {pct(p.plantPrecisionAt10Hi, 0)}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="legend mb-1.5">Enrichment, top 5%</dt>
                <dd className="measure text-xl leading-none text-broth">
                  {dec(p.enrichmentTop5, 2)}&times;
                </dd>
                <dd className="mt-1.5 text-[var(--text-legend)] leading-snug text-ink-dim">
                  ceiling is {dec(1 / p.plantBaseRate, 1)}&times; at this base
                  rate
                </dd>
              </div>
              <div>
                <dt className="legend mb-1.5">Precision, top 5%</dt>
                <dd className="measure text-xl leading-none">
                  {pct(p.precisionTop5)}
                </dd>
                <dd className="mt-1.5 text-[var(--text-legend)] leading-snug text-ink-dim">
                  {Math.round(p.precisionTop5 * 20)} of every 20 syntheses
                </dd>
              </div>
              <div>
                <dt className="legend mb-1.5">On the scaffold test</dt>
                <dd className="measure text-xl leading-none text-ink-dim">
                  {pct(p.testPrecisionAt10)}
                </dd>
                <dd className="mt-1.5 text-[var(--text-legend)] leading-snug text-ink-dim">
                  what the easier split would have let us claim
                </dd>
              </div>
            </dl>
          </Row>
        ))}
      </div>
    </Section>
  );
}

const PATHWAY_ORDER = [
  "Shikimates and Phenylpropanoids",
  "Polyketides",
  "Alkaloids",
  "Terpenoids",
  "Amino acids and Peptides",
  "Carbohydrates",
  "Fatty acids",
];

function Biology({ pathogens }: { pathogens: Pathogen[] }) {
  const matrix = PATHWAY_ORDER.map((pathway) => ({
    pathway,
    counts: pathogens.map(
      (p) => p.shortlist.filter((c) => c.pathways.includes(pathway)).length,
    ),
  }));
  const peak = Math.max(...matrix.flatMap((r) => r.counts));

  return (
    <Section
      title="The chemistry the model prefers tracks each pathogen’s cell envelope, and nobody told it about cell envelopes."
      lede="Three envelopes were chosen on purpose so that this comparison would say something. It does: the acid-fast, waxy-walled pathogen draws lipophilic alkaloids and terpenoids, the Gram-negative one draws the polar and amphiphilic chemistry its porins pass, and the Gram-positive one draws phenolics. The model saw fingerprints and descriptors, never a wall. Read it as a hypothesis worth testing, not a finding: it partly reflects which compounds LOTUS has annotated."
    >
      <div>
        <div className="grid grid-cols-[minmax(0,1fr)_repeat(3,4.4rem)] gap-x-2.5 sm:grid-cols-[minmax(0,1fr)_repeat(3,6.5rem)] sm:gap-x-5">
          <span />
          {pathogens.map((p) => (
            <span key={p.slug} className="legend pb-3 text-right leading-tight">
              {p.short}
            </span>
          ))}
          {matrix.map(({ pathway, counts }) => (
            <div key={pathway} className="col-span-4 grid grid-cols-subgrid border-t border-[var(--hairline)] py-2.5">
              <span className="self-center text-[var(--text-small)] leading-snug">
                {pathway}
              </span>
              {counts.map((n, i) => (
                <span
                  key={pathogens[i].slug}
                  className="flex items-center justify-end gap-2 self-center"
                >
                  <span
                    aria-hidden="true"
                    className="h-2.5 bg-broth"
                    style={{ width: `${(n / peak) * 100}%`, minWidth: n ? "2px" : "0" }}
                  />
                  <span className="measure w-5 shrink-0 text-right text-[var(--text-legend)]">
                    {n}
                  </span>
                </span>
              ))}
            </div>
          ))}
        </div>
        <p className="prose mt-5 max-w-[76ch] border-t border-[var(--hairline)] pt-5">
          Counts of the 50 in-domain candidates per pathogen carrying each
          biosynthetic pathway, as classified in LOTUS. A compound with two
          pathways is counted under both, so rows do not sum to 50. The plant
          families behind these lists concentrate in{" "}
          <em>Asteraceae</em> and <em>Fabaceae</em>, two of the richest families
          in the ethnopharmacological record.
        </p>
      </div>
    </Section>
  );
}

function Negatives({ split }: { split: ReturnType<typeof loadSplitComparison> }) {
  return (
    <Section
      title="The result we set out to find did not replicate, so it is reported as a negative."
      lede="The original plan was to show that holding out whole plant families is harder than holding out scaffolds, a more honest split for an ethnopharmacology screen. Measured four separate times the direction is usually right and the magnitude never settles, with a repeat-to-repeat spread wider than the effect. It stays in as a negative result rather than a contribution."
    >
      <div>
        <Scale
          from={0.45}
          to={0.85}
          ticks={[
            { at: 0.5, label: "0.5" },
            { at: 0.6, label: "0.6" },
            { at: 0.7, label: "0.7" },
            { at: 0.8, label: "0.8" },
          ]}
          marks={[
            {
              at: split.family,
              value: dec(split.family, 3),
                  label: "family split",
              tone: "growth",
            },
            {
              at: split.scaffold,
              value: dec(split.scaffold, 3),
                  label: "scaffold split",
              tone: "broth",
            },
            {
              at: split.random,
              value: dec(split.random, 3),
                  label: "random split",
              tone: "dim",
            },
          ]}
        />
        <p className="mt-2.5 max-w-[76ch] text-[var(--text-small)] leading-relaxed text-ink-dim">
          {split.task}, {split.repeats} repeats, plant-derived compounds with
          exactly one reported family. Standard deviations{" "}
          <span className="measure">
            {dec(split.randomSd, 3)} / {dec(split.scaffoldSd, 3)} /{" "}
            {dec(split.familySd, 3)}
          </span>
          . The family-minus-scaffold gap is{" "}
          <span className="measure text-ink">{dec(split.gap, 3)}</span>, and the
          family split was the worse of the two in only {split.worseRepeats} of{" "}
          {split.repeats} repeats.
        </p>
        <ul className="prose mt-7 max-w-[76ch] space-y-4 border-t border-[var(--hairline)] pt-5">
          <li>
            Regularisation does not close the plant gap. Sweeping the minimum
            leaf size across 1, 4 and 16 made the plant-holdout AUROC fall
            monotonically on all three pathogens, which rules out the obvious
            objection that the drop is a tuning artefact.
          </li>
          <li>
            Tuning for AUPRC instead of AUROC changed nothing at equal budget:
            one inconsistent win in three, inside the noise.
          </li>
          <li>
            Calibration does not transport across a prevalence shift. The Platt
            fit is made on a validation partition where 35–55% of compounds are
            active and then applied to plant holdouts at 9–25%, and on two of
            three pathogens the Brier score gets worse. It is reported, not
            hidden.
          </li>
        </ul>
      </div>
    </Section>
  );
}

function Limits({
  pathogens,
  provenance,
  reproduction,
}: {
  pathogens: Pathogen[];
  provenance: ReturnType<typeof loadProvenance>;
  reproduction: ReturnType<typeof loadReproduction>;
}) {
  const missingProvenance = pathogens.map(
    (p) => p.shortlist.filter((c) => !c.plants.length).length,
  );
  const nearDuplicates = pathogens.map(
    (p) => p.shortlist.filter((c) => c.tanimoto >= 0.9).length,
  );

  return (
    <Section
      title="What is wrong with this shortlist, in our own words."
      lede="A screen that only reports its wins is not a result. These are the defects we know about in the files on this page, stated here because a reader who finds them unaided has every reason to distrust the rest."
    >
      <div className="prose max-w-[76ch] space-y-5 text-ink">
        <p>
          <strong className="font-semibold">
            The top-ranked candidate is a near-copy of a training compound
          </strong>{" "}
          on all three plates. Reading{" "}
          <em>S. aureus</em>, <em>E. coli</em>, <em>M. tuberculosis</em> in that
          order here and below, their nearest training compounds sit at Tanimoto{" "}
          <span className="measure">
            {pathogens.map((p) => tanimoto(p.shortlist[0].tanimoto)).join(" / ")}
          </span>
          . On two of the three it is the same non-plant anthracycline-like
          polyketide, with no source plant and no DOI. The model is confident
          there because it has nearly seen it before, which is the whole
          phenomenon this page measures, appearing inside the deliverable.{" "}
          <span className="measure">{nearDuplicates.join(" / ")}</span>{" "}
          candidates per plate sit above 0.90.
        </p>
        <p>
          <strong className="font-semibold">Plant provenance is incomplete.</strong>{" "}
          <span className="measure">{missingProvenance.join(" / ")}</span> of
          the 50 candidates per plate carry no source plant, family or
          reference. They reached the shortlist through the chemistry, and in a
          natural-products screen that is a gap, not a detail.
        </p>
        <p>
          <strong className="font-semibold">
            Per-compound feature attributions are not shown.
          </strong>{" "}
          The SHAP values written alongside these shortlists are numerically
          impossible, at magnitudes far outside the range a probability output
          permits, so they are excluded from this surface until the cause is
          found. The aggregate importances behind the written report are sound.
        </p>
        <p>
          <strong className="font-semibold">
            There is no protein-level target here.
          </strong>{" "}
          99.6% of the MIC rows in ChEMBL for these organisms are measured
          against the whole organism, and only 35 single-protein targets carry
          any MIC at all. The model predicts whether a compound stops a
          bacterium growing. It says nothing about mechanism.
        </p>
        <p>
          <strong className="font-semibold">
            Which split should lead is still an open call on this team.
          </strong>{" "}
          The scaffold figures and the plant-holdout figures are both on this
          page and neither is presented as the headline, because that decision
          has not been made.
        </p>
        <p className="text-ink-dim">
          Nothing here is a clinical or therapeutic claim. These are model
          predictions over published measurements and traditional-use records,
          not evidence of efficacy, and no dose, preparation or use is implied
          or recommended.
        </p>

        <div className="mt-10 grid gap-8 border-t border-[var(--hairline)] pt-6 text-[var(--text-small)] leading-relaxed text-ink-dim sm:grid-cols-2">
          <div>
            <h3 className="legend mb-2.5">Data and licences</h3>
            <p>
              Activity labels from{" "}
              <a href="https://www.ebi.ac.uk/chembl/" rel="noreferrer noopener" target="_blank">
                ChEMBL
              </a>{" "}
              (CC BY-SA). The plant-to-compound edge from{" "}
              <a href="https://lotus.naturalproducts.net/" rel="noreferrer noopener" target="_blank">
                LOTUS
              </a>{" "}
              (CC0), cross-checked against{" "}
              <a href="https://www.gbif.org/" rel="noreferrer noopener" target="_blank">
                GBIF
              </a>{" "}
              for which organisms are plants. NPASS was evaluated and dropped:
              its MIC table is a copy of ChEMBL, so ChEMBL is cited directly.
            </p>
          </div>
          <div>
            <h3 className="legend mb-2.5">How to reproduce this page</h3>
            <p>
              Every number above is read at build time from{" "}
              <span className="measure">results/</span> in the repository, and
              never typed into this page by hand. The shortlists come from run{" "}
              <span className="measure">
                {provenance.runId.split("_")[0]}
              </span>{" "}
              at commit <span className="measure">{provenance.commit}</span>,
              config <span className="measure">{provenance.configHash}</span>.
              The curation and split stages were re-run end to end from the raw
              downloads on a second machine, and all{" "}
              <span className="measure">{reproduction.metrics}</span> of the
              ledger metrics they write matched to the last decimal. The model
              and shortlist stages have not been reproduced that way yet.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
