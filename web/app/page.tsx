import Link from "next/link";
import Plate from "@/components/Plate";
import Scale from "@/components/Scale";
import Space from "@/components/Space";
import Title from "@/components/Title";
import {
  loadChemicalSpace,
  loadPathogens,
  loadProvenance,
  loadSplitComparison,
  loadReproduction,
  type ChemicalSpace,
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
  const spaces = Object.fromEntries(
    pathogens.map((p) => [p.slug, loadChemicalSpace(p.slug)]),
  ) as Record<string, ChemicalSpace>;

  return (
    <>
      <PlateEdge provenance={provenance} reproduction={reproduction} />

      <main className="mx-auto max-w-[96rem] px-4 pb-24 sm:px-8 lg:px-12">
        <Title pathogens={pathogens} />

        <Problem pathogens={pathogens} />

        <section id="screen" className="scroll-mt-6 pt-10 lg:pt-14">
          <Plate pathogens={pathogens}>
            <h1 className="opens display text-thesis leading-[0.95] font-semibold tracking-[-0.035em] text-balance">
              {count(screened)} plant compounds screened.{" "}
              <span className="text-growth">{shortlisted}</span> we would hand to
              a chemist.
            </h1>
            <p
              className="opens mt-5 max-w-[58ch] text-[var(--text-body)] leading-relaxed text-ink-dim"
              style={{ "--open": 1 } as React.CSSProperties}
            >
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
        <Map pathogens={pathogens} spaces={spaces} />
        <Yield pathogens={pathogens} />
        <Biology pathogens={pathogens} />
        <Negatives split={split} />
        <Limits pathogens={pathogens} provenance={provenance} reproduction={reproduction} />
        <Next pathogens={pathogens} />
        <Credits provenance={provenance} />
      </main>

      <PlateFoot />
    </>
  );
}

/**
 * What the thing is for, and what we would do with more than a week. Written
 * to be said out loud at the end of a pitch, which is why it is four short
 * claims and not a roadmap.
 */
function Next({ pathogens }: { pathogens: Pathogen[] }) {
  const best = pathogens.reduce((a, b) =>
    b.enrichmentTop5 > a.enrichmentTop5 ? b : a,
  );

  const items = [
    {
      title: "What a laboratory does with it tomorrow",
      body: `A bench queue rather than a literature search: fifty compounds, each with a source plant, a reference and a distance. At ${dec(best.enrichmentTop5, 2)}× enrichment on ${best.short}, twenty syntheses expect several hits where random expects one. None of it has been near a laboratory yet.`,
    },
    {
      title: "The protein layer we could not build",
      body: "This predicts growth inhibition and says nothing about mechanism. Protein-level activity exists in ChEMBL under IC50 and Ki, a separate and much smaller download, and it is what would turn a shortlist into a hypothesis about a target.",
    },
    {
      title: "The measurement that would settle it",
      body: "Every number here is retrospective. The honest next step is not a fourth pathogen. It is putting ten of these on a real plate and publishing the hit rate beside the predicted one, including if it is worse.",
    },
    {
      title: "Whose knowledge this is",
      body: "Traditional knowledge sits behind many of the published plant records. Anything built on this carries the Nagoya Protocol and Local Contexts as a condition of use, not as a footnote.",
    },
  ];

  return (
    <Section
      id="impact"
      title="What this is for, and what we would do next."
      lede="A screen is only worth the lab time it saves, so the claim has to be the size of the evidence."
    >
      <ol className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
        {items.map((item, i) => (
          <li
            key={item.title}
            className="draw-dot border-t border-[var(--hairline)] pt-4"
            style={{ "--step": i } as React.CSSProperties}
          >
            <h3 className="text-base leading-tight font-medium text-balance">
              {item.title}
            </h3>
            <p className="mt-2.5 text-[var(--text-small)] leading-relaxed text-ink-dim">
              {item.body}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/**
 * The closing frame. Who built it, what it was built on, and what was
 * declared. It is the last thing said on camera, so it carries the licences
 * and the AI disclosure rather than leaving them to the footer alone.
 */
function Credits({
  provenance,
}: {
  provenance: ReturnType<typeof loadProvenance>;
}) {
  const people = ["Leonidas Anagnou", "Eleni Nasopoulou"];

  return (
    <Section
      id="credits"
      title="Who built it, and what it stands on."
      lede="Two people, one week, one repository. Every number here is read at build time from a committed result file."
    >
      <div>
        <ul className="grid gap-x-10 gap-y-4 sm:grid-cols-2">
          {people.map((name, i) => (
            <li
              key={name}
              className="draw-dot display text-section leading-tight font-medium tracking-[-0.02em]"
              style={{ "--step": i } as React.CSSProperties}
            >
              {name}
            </li>
          ))}
        </ul>

        <p className="mt-7 border-t border-[var(--hairline)] pt-5 text-[var(--text-small)] leading-relaxed text-ink-dim">
          Both at the School of Electrical and Computer Engineering, National
          Technical University of Athens. Which run produced the numbers on this
          page, and how to re-run it, is stated under{" "}
          <a href="#limits">what is wrong with it</a>.
        </p>

        <dl className="mt-7 grid gap-x-10 gap-y-6 border-t border-[var(--hairline)] pt-5 sm:grid-cols-3">
          <div>
            <dt className="legend mb-2">Data</dt>
            <dd className="text-[var(--text-small)] leading-relaxed text-ink-dim">
              Activity labels from ChEMBL (CC BY-SA). The plant-to-compound edge
              from LOTUS (CC0), cross-checked against GBIF for which organisms
              are plants. NPASS was evaluated and dropped: its MIC table is a
              copy of ChEMBL, so ChEMBL is cited directly.
            </dd>
          </div>
          <div>
            <dt className="legend mb-2">Built with</dt>
            <dd className="text-[var(--text-small)] leading-relaxed text-ink-dim">
              Python, RDKit, scikit-learn and XGBoost for the pipeline; Next.js
              and Tailwind for this surface; smiles-drawer for every structure,
              drawn in the browser from the canonical SMILES.
            </dd>
          </div>
          <div>
            <dt className="legend mb-2">Generative AI</dt>
            <dd className="text-[var(--text-small)] leading-relaxed text-ink-dim">
              AI assistance was used while writing the pipeline, this interface
              and parts of the analysis. Every number, method and claim is ours
              to defend, and each one is traceable to a committed result file.
            </dd>
          </div>
        </dl>
      </div>
    </Section>
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
            <Link href="/pipeline/">
              The whole pipeline is written out stage by stage
            </Link>
            , from the question to this page. Notebooks, pipeline, run ledger and
            this interface are in one repository, under MIT.{" "}
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
    /* Sticky: on a page this long the only way back to the other surface is
       the link in this strip, and hunting for it means scrolling to the top. */
    <header className="sticky top-0 z-50 border-b border-[var(--hairline)] bg-void">
      <div className="mx-auto flex max-w-[96rem] flex-wrap items-center justify-between gap-x-8 gap-y-1.5 px-4 py-3.5 sm:px-8 lg:px-12">
        <p className="legend">
          EthnoHack 2026 · Track 2
          <span className="hidden sm:inline">
            {" "}
            · Natural Products for Drug Discovery
          </span>
        </p>
        {/* On a phone this strip would run five lines and put provenance in
            front of the argument. The same facts are stated in full further
            down, under how to reproduce this page. */}
        <p className="hidden text-[var(--text-legend)] text-ink-dim sm:block">
          <Link href="/pipeline/">How it was built</Link>
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
  id,
  title,
  lede,
  children,
}: {
  /** Also the beat anchor record mode scrolls to. See components/Record.tsx. */
  id: string;
  title: string;
  lede: string;
  children: React.ReactNode;
}) {
  return (
    /* The rule that opens a section is drawn, not simply present: it is the
       same hairline the plate's own boundary is made of, and it arrives the
       same way. It is a span rather than a border because a border cannot be
       scaled out of nothing. */
    <section
      id={id}
      className="relative mt-16 scroll-mt-6 pt-8 lg:mt-20"
    >
      <span
        aria-hidden="true"
        className="draw-x absolute inset-x-0 top-0 h-px bg-[var(--hairline)]"
      />
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
      id="ladder"
      title="The same model, read three ways. Only the last one answers the question."
      lede="Scored on validation, and on a test set with whole chemical scaffolds held out, the model looks strong. Hold out every plant-derived compound, which is what a plant screen actually asks of it, and it drops by a sixth. That last reading is the hardest of the three for all three pathogens."
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
          AUROC is the chance the model ranks a random active above a random
          inactive, where 0.5 is a coin flip; intervals are 2,000 bootstrap
          resamples. Scaffold overlap across the split is exactly{" "}
          <span className="measure text-ink">0.000</span>, which is necessary
          and nowhere near sufficient.
        </p>
      </div>
    </Section>
  );
}

function Distance({ pathogens }: { pathogens: Pathogen[] }) {
  return (
    <Section
      id="distance"
      title="Holding out ring skeletons is an easier test than it sounds, and the distances say why."
      lede="Removing shared ring skeletons removes none of the resemblance that matters. The median plant compound sits far further out than the median test compound."
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
            {/* The scale is the same on all three rows, so what it means is
                said once underneath rather than three times over. */}
            <p className="mt-1.5 text-[var(--text-small)] leading-relaxed text-ink-dim">
              {count(p.distinctScaffolds)} distinct ring skeletons across{" "}
              {count(p.labelled)} measured compounds.
            </p>
          </Row>
        ))}
        <p className="prose mt-6 max-w-[76ch] border-t border-[var(--hairline)] pt-5">
          Similarity to the nearest compound the model was trained on, where{" "}
          <span className="measure">1.000</span> is an identical fingerprint and{" "}
          <span className="measure">0.000</span> nothing in common. The read
          line is <em>one</em> cutoff, not three:{" "}
          <span className="measure">{tanimoto(pathogens[0].domainCutoff)}</span>,
          the 25th percentile of the <em>S. aureus</em> plant holdout, which is
          the most distant set on which this model&rsquo;s performance was
          actually measured. It is drawn on all three scales so the three can be
          read against each other, and applying one organism&rsquo;s cutoff to
          the other two is a choice we made rather than a measurement.
          Candidates beyond it are published, not ranked.
        </p>
      </div>
    </Section>
  );
}

/**
 * Why any of this is worth doing, in the numbers the run itself produced. The
 * claim is not that plants are an untapped miracle; it is the narrower and
 * checkable one that the measured record barely covers them, so the compounds
 * worth testing cannot be found by looking them up.
 */
function Problem({ pathogens }: { pathogens: Pathogen[] }) {
  const widest = Math.max(...pathogens.map((p) => p.labelled));

  return (
    <Section
      id="problem"
      title="Medicine has measured a great deal of chemistry against these three organisms. Almost none of it came from a plant."
      lede="Published MIC measurements are what a model like this can learn from. The plant-derived share of them is a rounding error."
    >
      <div>
        {pathogens.map((p, row) => (
          <Row key={p.slug} pathogen={p}>
            <div className="flex items-center gap-4">
              {/* One scale for all three: the grey track is this pathogen's
                  measured set against the largest of them, and the plant share sits
                  inside it. A bar per row scaled to its own width would make
                  three different percentages look identical. */}
              <div className="h-5 flex-1">
                <div
                  className="draw-x relative h-full bg-[color-mix(in_srgb,var(--color-ink-faint)_38%,transparent)]"
                  style={
                    {
                      width: `${(p.labelled / widest) * 100}%`,
                      "--step": row,
                    } as React.CSSProperties
                  }
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 bg-broth"
                    style={{
                      width: `${(p.plantLabelled / p.labelled) * 100}%`,
                      minWidth: "2px",
                    }}
                  />
                </div>
              </div>
              <p className="measure w-28 shrink-0 text-right text-[var(--text-small)]">
                {pct(p.plantLabelled / p.labelled, 1)}
              </p>
            </div>
            <p className="mt-2 text-[var(--text-small)] leading-relaxed text-ink-dim">
              <span className="measure text-ink">
                {count(p.plantLabelled)}
              </span>{" "}
              plant-derived of{" "}
              <span className="measure">{count(p.labelled)}</span> measured
              compounds.
            </p>
          </Row>
        ))}
        <p className="prose mt-6 max-w-[76ch] border-t border-[var(--hairline)] pt-5">
          Against that sits{" "}
          <span className="measure text-ink">
            {count(pathogens[0].screened)}
          </span>{" "}
          plant structures with no measurement against any of these three. The
          literature cannot be searched for an experiment nobody has run, so
          ranking them is the only move left, and it is only worth anything if
          it says where it stops being trustworthy.
        </p>
      </div>
    </Section>
  );
}

/**
 * The one place on this page where distance is a picture. It is also the one
 * figure that argues against itself, which is why it sits here, directly after
 * the panel that establishes distance as the thing that matters.
 */
function Map({
  pathogens,
  spaces,
}: {
  pathogens: Pathogen[];
  spaces: Record<string, ChemicalSpace>;
}) {
  return (
    <Section
      id="map"
      title="The chemistry medicine has measured, and how little of it ever came from a plant."
      lede="Faint points are compounds with a published MIC against the plate on view. The brighter ones a plant made. Rings are where this run's candidates fell."
    >
      <Space pathogens={pathogens} spaces={spaces} />
    </Section>
  );
}

function Yield({ pathogens }: { pathogens: Pathogen[] }) {
  return (
    <Section
      id="yield"
      title="What this buys a lab: two to five times the hit rate of picking at random."
      lede="Precision at the top of the list is the number a chemist spends money against. Read each one against the base rate beside it."
    >
      <div>
        {pathogens.map((p) => (
          <Row key={p.slug} pathogen={p}>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
              <div
                className="draw-dot"
                style={{ "--step": 0 } as React.CSSProperties}
              >
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
              <div
                className="draw-dot"
                style={{ "--step": 1 } as React.CSSProperties}
              >
                <dt className="legend mb-1.5">Enrichment, top 5%</dt>
                <dd className="measure text-xl leading-none text-broth">
                  {dec(p.enrichmentTop5, 2)}&times;
                </dd>
                <dd className="mt-1.5 text-[var(--text-legend)] leading-snug text-ink-dim">
                  ceiling is {dec(1 / p.plantBaseRate, 1)}&times; at this base
                  rate
                </dd>
              </div>
              <div
                className="draw-dot"
                style={{ "--step": 2 } as React.CSSProperties}
              >
                <dt className="legend mb-1.5">Precision, top 5%</dt>
                <dd className="measure text-xl leading-none">
                  {pct(p.precisionTop5)}
                </dd>
                <dd className="mt-1.5 text-[var(--text-legend)] leading-snug text-ink-dim">
                  {Math.round(p.precisionTop5 * 20)} of every 20 syntheses
                </dd>
              </div>
              <div
                className="draw-dot"
                style={{ "--step": 3 } as React.CSSProperties}
              >
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
      id="biology"
      title="The chemistry the model prefers tracks each pathogen’s cell envelope, and nobody told it about cell envelopes."
      lede="Three envelopes, chosen so this comparison would say something. The acid-fast list draws alkaloids and terpenoids, the Gram-negative one the polar chemistry its porins pass. The model was never given a cell wall."
    >
      <div>
        <div className="grid grid-cols-[minmax(0,1fr)_repeat(3,4.4rem)] gap-x-2.5 sm:grid-cols-[minmax(0,1fr)_repeat(3,6.5rem)] sm:gap-x-5">
          <span />
          {pathogens.map((p) => (
            <span key={p.slug} className="legend pb-3 text-right leading-tight">
              {p.short}
            </span>
          ))}
          {matrix.map(({ pathway, counts }, row) => (
            <div key={pathway} className="col-span-4 grid grid-cols-subgrid border-t border-[var(--hairline)] py-2.5">
              <span className="self-center text-[var(--text-small)] leading-snug">
                {pathway}
              </span>
              {counts.map((n, i) => (
                <span
                  key={pathogens[i].slug}
                  className="flex items-center justify-end gap-2 self-center"
                >
                  {/* Each bar grows from its own baseline as the figure comes
                      into view, one row behind the last, so the matrix is
                      plotted down the page rather than asserted. */}
                  <span
                    aria-hidden="true"
                    className="draw-x h-2.5 bg-broth"
                    style={
                      {
                        width: `${(n / peak) * 100}%`,
                        minWidth: n ? "2px" : "0",
                        "--step": row,
                      } as React.CSSProperties
                    }
                  />
                  <span
                    /* Martian Mono is wide: two digits do not fit a 20px box,
                       and a count that wraps to two lines reads as two numbers. */
                    className="draw-dot measure w-6 shrink-0 text-right whitespace-nowrap text-[var(--text-legend)]"
                    style={{ "--step": row + 1 } as React.CSSProperties}
                  >
                    {n}
                  </span>
                </span>
              ))}
            </div>
          ))}
        </div>
        <p className="prose mt-5 max-w-[76ch] border-t border-[var(--hairline)] pt-5">
          Counts of the 50 candidates per pathogen carrying each pathway, as
          classified in LOTUS. A compound with two pathways counts under both,
          so rows do not sum to 50.
        </p>
      </div>
    </Section>
  );
}

function Negatives({ split }: { split: ReturnType<typeof loadSplitComparison> }) {
  return (
    <Section
      id="negatives"
      title="The result we set out to find did not replicate, so it is reported as a negative."
      lede="We set out to show that holding out whole plant families is harder than holding out scaffolds. Measured four times, the magnitude never settles."
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
          <li className="draw-dot" style={{ "--step": 0 } as React.CSSProperties}>
            Regularisation does not close the gap. Minimum leaf size swept
            across 1, 4 and 16 made plant-holdout AUROC fall monotonically on
            all three, so the drop is not a tuning artefact.
          </li>
          <li className="draw-dot" style={{ "--step": 1 } as React.CSSProperties}>
            Tuning for AUPRC instead of AUROC changed nothing at equal
            budget: one inconsistent win in three, inside the noise.
          </li>
          <li className="draw-dot" style={{ "--step": 2 } as React.CSSProperties}>
            Calibration does not transport across a prevalence shift. Fitted
            at 35–55% active, applied at 9–25%, and on two of three the Brier
            score gets worse.
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
      id="limits"
      title="What is wrong with this shortlist, in our own words."
      lede="A screen that only reports its wins is not a result. These are the defects we know about in the files on this page."
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
              <span className="measure">results/</span>, never typed in by hand.
              The shortlists come from configuration{" "}
              <span className="measure">{provenance.configHash}</span> in{" "}
              <span className="measure">results/runs.jsonl</span>, which records
              every rule the stage was given. The curation and split stages were
              re-run end to end from the raw downloads on a second machine, and
              all <span className="measure">{reproduction.metrics}</span> ledger
              metrics matched to the last decimal. The model and shortlist
              stages have not been reproduced that way yet.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
