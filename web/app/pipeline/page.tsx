import Link from "next/link";
import type { ReactNode } from "react";
import {
  Caption,
  Cells,
  Chain,
  Detail,
  FigureLabel,
  Funnel,
  Overlap,
  Slope,
  Spread,
  Strip,
} from "@/components/Diagram";
import Scale from "@/components/Scale";
import Structure from "@/components/Structure";
import WellMark from "@/components/WellMark";
import {
  loadPathogens,
  loadProvenance,
  loadReproduction,
  loadRunConfig,
  loadScaffoldExample,
  loadSplitRuns,
  loadStageHashes,
  type Pathogen,
} from "@/lib/data";
import { BEATS, type Beat, type Choice } from "@/lib/story";
import { count, dec, pct, tanimoto } from "@/lib/format";

export const metadata = {
  title: "How the screen was built, beat by beat",
  description:
    "One scroll through the whole pipeline: the question, the two datasets, what the raw download said, every cleaning cut, the features, the splits, the model, the three readings of it, the shortlist, and the results that did not replicate.",
};

/**
 * The pipeline, told as one scroll. Twelve beats, each one a claim, the steps
 * it ran, and a figure drawn from numbers read at build time out of
 * `results/`. The prose is in `lib/story.ts` and the quantities are not, so
 * neither can quietly contradict the other.
 */
export default function Pipeline() {
  const pathogens = loadPathogens();
  const context: Context = {
    pathogens,
    provenance: loadProvenance(),
    reproduction: loadReproduction(),
    splitRuns: loadSplitRuns(),
    scaffold: loadScaffoldExample(),
    curation: loadRunConfig("curation_staphylococcus_aureus"),
    splitConfig: loadRunConfig("splits_staphylococcus_aureus"),
    hashes: loadStageHashes(),
  };

  return (
    <>
      {/* Sticky, as on the other surface: this strip is the way back. */}
      <header className="sticky top-0 z-50 border-b border-[var(--hairline)] bg-void">
        <div className="mx-auto flex max-w-[96rem] flex-wrap items-center justify-between gap-x-8 gap-y-1.5 px-4 py-3.5 sm:px-8 lg:px-12">
          <p className="legend">
            EthnoHack 2026 · Track 2
            <span className="hidden sm:inline"> · How it was built</span>
          </p>
          <p className="text-[var(--text-legend)] text-ink-dim">
            <Link href="/">The shortlists</Link>
          </p>
        </div>
      </header>

      <div className="relative mx-auto max-w-[96rem] px-4 sm:px-8 lg:px-12">
        {/* The margin rule of the plate: a hairline the whole way down, with
            the read so far drawn in straw. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-4 w-8 sm:left-8 sm:w-12 lg:left-12"
        >
          <div className="spine">
            <span className="spine-rule" />
            <span className="spine-fill" />
          </div>
        </div>

        <main className="pl-12 sm:pl-[4.5rem]">
          <Opening pathogens={pathogens} />

          {BEATS.map((beat) => (
            <BeatSection key={beat.id} beat={beat}>
              {figure(beat.id, context)}
            </BeatSection>
          ))}

          <Closing />
        </main>
      </div>

      <footer className="border-t border-[var(--hairline)] bg-void">
        <div className="mx-auto max-w-[96rem] px-4 py-10 sm:px-8 lg:px-12">
          <p className="max-w-[76ch] text-[var(--text-small)] leading-relaxed text-ink-dim">
            Nothing here is a clinical or therapeutic claim. A shortlist is a
            hypothesis for a laboratory bench, and no dose, preparation or use
            is implied or recommended.{" "}
            <Link href="/">The shortlists themselves are here</Link>.
          </p>
        </div>
      </footer>
    </>
  );
}

/* --- The opening and the close ------------------------------------------- */

function Opening({ pathogens }: { pathogens: Pathogen[] }) {
  const first = pathogens[0];
  return (
    <section className="relative pt-10 pb-14 lg:pt-12 lg:pb-16">
      <BeatNumber n="" />
      <div className="grid gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)]">
        <div>
          <h1 className="display text-thesis leading-[0.95] font-semibold tracking-[-0.035em] text-balance">
            {count(first.screened)} plant compounds in.{" "}
            <span className="text-growth">
              {pathogens.reduce((n, p) => n + p.shortlist.length, 0)}
            </span>{" "}
            out, each with its distance from everything we checked.
          </h1>
          <p className="prose mt-5 max-w-[52ch]">
            Twelve stages, in the order they were built. Scroll and each one
            draws itself from the run that produced it.
          </p>
        </div>
        <ol className="grid grid-cols-1 gap-px self-end sm:grid-cols-2">
          {BEATS.map((beat) => (
            <li
              key={beat.id}
              className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-3 border-t border-[var(--hairline)] py-2.5"
            >
              <span className="measure self-baseline text-[var(--text-legend)] text-ink-faint">
                {beat.n}
              </span>
              <a
                className="self-baseline text-[var(--text-small)] leading-snug"
                href={`#${beat.id}`}
              >
                {beat.claim}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Closing() {
  return (
    <section className="relative border-t border-[var(--hairline)] py-16">
      <div className="grid gap-x-14 gap-y-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <h2 className="display text-section leading-tight font-semibold tracking-[-0.025em] text-balance">
          That is the whole pipeline.
        </h2>
        <p className="prose max-w-[58ch]">
          The shortlists it produced are on{" "}
          <Link href="/">the other page</Link>, read as the plate they came
          from: one well per compound, the liquid at its distance from known
          chemistry, the line across every well where our evidence stops.
        </p>
      </div>
    </section>
  );
}

/* --- One beat ------------------------------------------------------------- */

function BeatNumber({ n }: { n: string }) {
  return (
    <span
      aria-hidden="true"
      className="beat-number absolute top-[1.15rem] -left-12 sm:-left-[4.5rem]"
    >
      {n}
    </span>
  );
}

function BeatSection({ beat, children }: { beat: Beat; children: ReactNode }) {
  return (
    <section
      /* No min-height. Each beat used to be held to 78vh so it filled the
         frame of a screen-recorded take; the pitch is slides now, and on a
         page that is read rather than filmed that floor only added scroll
         between one claim and the next. */
      className="relative scroll-mt-4 border-t border-[var(--hairline)] py-10 lg:py-14"
      id={beat.id}
    >
      <BeatNumber n={beat.n} />
      <div className="grid gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <div>
          <h2 className="display text-section leading-tight font-semibold tracking-[-0.025em] text-balance">
            {italicise(beat.claim)}
          </h2>
          <p className="prose mt-4 max-w-[46ch]">{italicise(beat.reads)}</p>
          {beat.steps ? <Steps steps={beat.steps} /> : null}
          <p className="legend mt-7">{beat.where}</p>
        </div>

        <div className="min-w-0">
          {children}
          {beat.source ? (
            <p className="mt-8 max-w-[68ch] border-l border-broth pl-4 text-[var(--text-small)] leading-relaxed text-broth">
              {beat.source}
            </p>
          ) : null}
          {beat.choices ? <Choices choices={beat.choices} /> : null}
          {beat.writes || beat.code ? (
            <dl className="mt-8 grid gap-x-10 gap-y-3 border-t border-[var(--hairline)] pt-4 sm:grid-cols-2">
              {beat.writes ? (
                <div>
                  <dt className="legend mb-1.5">Writes</dt>
                  <dd className="measure text-[var(--text-legend)] leading-relaxed text-ink-faint">
                    {beat.writes.join("  ·  ")}
                  </dd>
                </div>
              ) : null}
              {beat.code ? (
                <div>
                  <dt className="legend mb-1.5">Code</dt>
                  <dd className="measure text-[var(--text-legend)] leading-relaxed text-ink-faint">
                    {beat.code}
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Steps({ steps }: { steps: string[] }) {
  return (
    <ol className="mt-7 grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-3">
      {steps.map((step, i) => (
        <li
          key={step}
          className="col-span-2 grid grid-cols-subgrid border-t border-[var(--hairline)] py-2"
        >
          <span className="measure self-baseline text-[var(--text-legend)] text-ink-faint">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="self-baseline text-[var(--text-small)] leading-snug">
            {italicise(step)}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Choices({ choices }: { choices: Choice[] }) {
  return (
    <div className="mt-9">
      <FigureLabel>What we chose, and what we turned down</FigureLabel>
      <ul className="grid gap-x-10 gap-y-0 sm:grid-cols-2">
        {choices.map((choice) => (
          <li
            key={choice.chose}
            className="border-t border-[var(--hairline)] py-3"
          >
            <p className="text-[var(--text-small)] leading-snug">
              {italicise(choice.chose)}
            </p>
            {/* Deliberately not growth pink: a road not taken is not a value
                that cannot be banked, and pink is kept for those. */}
            {choice.instead ? (
              <p className="mt-1 text-[var(--text-legend)] leading-snug text-ink-faint">
                <span className="legend mr-2">instead of</span>{" "}
                {italicise(choice.instead)}
              </p>
            ) : null}
            <p className="mt-1.5 text-[var(--text-legend)] leading-relaxed text-ink-dim">
              {italicise(choice.because)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* --- Small shared blocks -------------------------------------------------- */

function Facts({ children }: { children: ReactNode }) {
  return (
    <dl className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
      {children}
    </dl>
  );
}

function Fact({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note?: string;
  tone?: "ink" | "broth" | "growth" | "dim";
}) {
  const colour = {
    ink: "",
    broth: "text-broth",
    growth: "text-growth",
    dim: "text-ink-dim",
  }[tone ?? "ink"];
  return (
    <div>
      <dt className="legend mb-1.5">{label}</dt>
      <dd className={`measure text-lg leading-none ${colour}`}>{value}</dd>
      {note ? (
        <dd className="mt-1.5 text-[var(--text-legend)] leading-snug text-ink-dim">
          {note}
        </dd>
      ) : null}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-9 first:mt-0">
      <FigureLabel>{title}</FigureLabel>
      {children}
    </div>
  );
}

function Strain({
  pathogen,
  children,
}: {
  pathogen: Pathogen;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-[var(--hairline)] py-5 first:border-t-0 first:pt-0">
      <div className="flex items-baseline justify-between gap-6">
        <h4 className="text-base leading-tight font-medium italic">
          {pathogen.binomial}
        </h4>
        <p className="legend shrink-0">{pathogen.envelope}</p>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

/** Fifty wells inside the read and fifteen beyond it, at plate scale. */
function MiniPlate({ pathogen }: { pathogen: Pathogen }) {
  const wells = [...pathogen.shortlist, ...pathogen.exploratory];
  return (
    <div
      aria-hidden="true"
      className="plate-view grid w-fit gap-[5px]"
      style={{ gridTemplateColumns: "repeat(13, 15px)" }}
    >
      {wells.map((compound, i) => (
        <WellMark key={compound.skeleton} column={i % 13} compound={compound} />
      ))}
    </div>
  );
}

/* --- The figures ---------------------------------------------------------- */

type Context = {
  pathogens: Pathogen[];
  provenance: ReturnType<typeof loadProvenance>;
  reproduction: ReturnType<typeof loadReproduction>;
  splitRuns: ReturnType<typeof loadSplitRuns>;
  scaffold: ReturnType<typeof loadScaffoldExample>;
  curation: Record<string, unknown>;
  splitConfig: Record<string, unknown>;
  hashes: ReturnType<typeof loadStageHashes>;
};

const FEATURE_ORDER = ["morgan", "descriptors", "hybrid"];

const STAGE_TITLES = {
  curation: "Curation",
  splits: "Splits",
  model: "Model",
  shortlist: "Shortlist",
} as const;

const STAGE_NOTES = {
  curation: "threshold, censoring, dedup, collapse rule",
  splits: "group key, fractions, seed",
  model: "feature set, params, calibration, threshold rule",
  shortlist: "pool, size, diversity, domain cutoff",
} as const;

function figure(id: string, ctx: Context): ReactNode {
  const { pathogens } = ctx;
  const first = pathogens[0];

  switch (id) {
    case "question":
      return (
        <>
          <Detail
            inner={[
              {
                label: "Shortlist, in domain",
                value: first.shortlistSize,
                display: String(first.shortlistSize),
                tone: "broth",
              },
              {
                label: "Exploratory, outside it",
                value: first.exploratoryCount,
                display: String(first.exploratoryCount),
                tone: "growth",
              },
              {
                label: "Scored, pooled, not carried",
                value:
                  first.candidatePool -
                  first.shortlistSize -
                  first.exploratoryCount,
                display: count(
                  first.candidatePool -
                    first.shortlistSize -
                    first.exploratoryCount,
                ),
                tone: "faint",
              },
            ]}
            slice={first.candidatePool}
            sliceLabel="Top-scoring candidate pool"
            whole={first.screened}
            wholeLabel="Plant structures scored, per pathogen"
          />
          <Caption>
            The bright sliver is the whole pool, at true scale. What reaches a
            chemist is{" "}
            <span className="measure text-ink">
              {pct(first.shortlistSize / first.screened, 3)}
            </span>{" "}
            of the screen, which is why precision at the head of the ranking is
            the only metric that buys anything here.
          </Caption>
        </>
      );

    case "idea":
      return (
        <>
          <Overlap
            both={{
              label: "Measured and from a plant",
              value: first.plantLabelled,
              display: count(first.plantLabelled),
              tone: "broth",
              note: "the only place the screen can be checked",
            }}
            left={{
              label: "Measured against this pathogen",
              value: first.labelled,
              display: count(first.labelled),
              tone: "dim",
              note: "ChEMBL MIC, mostly synthetic chemistry",
            }}
            right={{
              label: "Plant structures, never measured",
              value: first.screened,
              display: count(first.screened),
              tone: "faint",
              note: "LOTUS, with a plant and a reference each",
            }}
          />
          <Caption>
            Drawn for <em>{first.binomial}</em>. The model learns on the left
            block and is pointed at the right one; everything we know about how
            well that works comes from the narrow band where they meet.
          </Caption>
          <Panel title="The same join, on the other two">
            <Chain
              joined={false}
              nodes={pathogens.slice(1).map((p) => ({
                title: p.binomial,
                detail: `${count(p.labelled)} measured · ${count(p.plantLabelled)} from plants`,
                note: p.envelope,
              }))}
            />
          </Panel>
        </>
      );

    case "sources":
      return (
        <>
          <Panel title="What the pipeline reads">
            <Chain
              nodes={[
                {
                  title: "ChEMBL",
                  detail: "CC BY-SA 3.0",
                  note: "measured activity, one row per assay result",
                },
                {
                  title: "LOTUS",
                  detail: "CC0",
                  note: "which plant a compound came from, with a DOI",
                },
                {
                  title: "GBIF backbone",
                  detail: "CC BY-NC 4.0",
                  note: "a second read on which organisms are plants",
                },
                {
                  title: "The labelled table",
                  detail: "joined on the InChIKey skeleton",
                  note: "one row per compound, per pathogen",
                  tone: "broth",
                },
              ]}
            />
          </Panel>
          <Panel title="Considered and turned down">
            <Chain
              joined={false}
              nodes={[
                {
                  title: "NPASS",
                  note: "a copy of ChEMBL, and no licence published",
                  struck: true,
                },
                {
                  title: "COCONUT, ChEBI, WFO, taxtree",
                  note: "hosted wrappers whose certificate does not verify here",
                  struck: true,
                },
                {
                  title: "Wikidata SPARQL",
                  note: "the plant query times out on the public endpoint",
                  struck: true,
                },
                {
                  title: "DrugBank, KEGG, NAPRALERT",
                  note: "registration, restricted download, subscription",
                  struck: true,
                },
              ]}
            />
          </Panel>
          <Caption>
            Four scripts, all resumable, about half an hour of downloading, and
            nothing committed to the repository. The licences travel with the
            output on both pages.
          </Caption>
        </>
      );

    case "survey":
      return (
        <>
          <Panel title="What the MIC rows are measured against">
            <Strip
              segments={[
                {
                  label: "Whole organism",
                  value: 99.6,
                  display: "99.6%",
                  tone: "dim",
                },
                {
                  label: "A single protein",
                  value: 0.4,
                  display: "0.4%",
                  tone: "growth",
                },
              ]}
            />
          </Panel>
          <Panel title="How the values are reported">
            <Strip
              segments={[
                {
                  label: "An exact value",
                  value: 78.4,
                  display: "78.4%",
                  tone: "dim",
                },
                {
                  label: "Censored: tested, inactive",
                  value: 21.6,
                  display: "21.6%",
                  tone: "broth",
                },
              ]}
            />
          </Panel>
          <Panel title="Where those values fall">
            <Strip
              segments={[
                {
                  label: "At or below 32 µg/mL",
                  value: 68.6,
                  display: "68.6%",
                  tone: "broth",
                },
                { label: "Above it", value: 31.4, display: "31.4%", tone: "dim" },
              ]}
            />
          </Panel>
          <Panel title="And the units they are reported in">
            <Cells label="distinct unit strings in the download" total={37} />
          </Panel>
        </>
      );

    case "curation":
      return (
        <>
          <Panel title="Every cut, counted">
            <div className="grid gap-x-10 gap-y-8 xl:grid-cols-3">
              {pathogens.map((p) => (
                <div key={p.slug}>
                  <h4 className="mb-4 text-base leading-tight font-medium italic">
                    {p.binomial}
                  </h4>
                  <Funnel
                    rows={[
                      {
                        label: "Raw MIC rows",
                        value: p.rawRows,
                        display: count(p.rawRows),
                        tone: "faint",
                      },
                      {
                        label: "Rows that survive",
                        value: p.usableRows,
                        display: count(p.usableRows),
                        tone: "faint",
                      },
                      {
                        label: "Compounds after dedup",
                        value: p.labelled,
                        display: count(p.labelled),
                        tone: "dim",
                        note: `${pct(p.activeRate)} active at 32 µM`,
                      },
                      {
                        label: "Of those, from a plant",
                        value: p.plantLabelled,
                        display: count(p.plantLabelled),
                        tone: "broth",
                      },
                    ]}
                  />
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="The units, now refused">
            <Cells
              label="unit strings"
              struck={18}
              struckLabel="refused: per disk, per area, a percentage, a velocity"
              total={37}
            />
          </Panel>
          <Caption>
            Quoted from the run&rsquo;s own configuration: censoring,{" "}
            <span className="measure text-ink">
              {String(ctx.curation.censored_rule)}
            </span>
            ; repeats,{" "}
            <span className="measure text-ink">
              {String(ctx.curation.repeat_rule)}
            </span>
            ; key,{" "}
            <span className="measure text-ink">{String(ctx.curation.dedup)}</span>
            .
          </Caption>
        </>
      );

    case "features":
      return (
        <>
          <Panel title="One compound, and the ring skeleton the next beat splits on">
            <div className="grid items-center gap-x-8 gap-y-6 sm:grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)]">
              <div>
                <Structure
                  label={`${ctx.scaffold.skeleton}, a shortlisted compound`}
                  smiles={ctx.scaffold.smiles}
                />
                <p className="measure mt-2 text-[var(--text-legend)] text-ink-dim">
                  {ctx.scaffold.skeleton}
                </p>
                <p className="mt-1 text-[var(--text-legend)] text-ink-faint">
                  reported in <em>{ctx.scaffold.plant}</em>
                </p>
              </div>
              <svg
                aria-hidden="true"
                className="hidden h-8 w-8 sm:block"
                viewBox="0 0 32 32"
              >
                <path
                  d="M4 16 H26 M20 10 L26 16 L20 22"
                  fill="none"
                  stroke="var(--color-broth)"
                  strokeWidth="1"
                />
              </svg>
              <div>
                <Structure
                  label="its Murcko scaffold"
                  smiles={ctx.scaffold.scaffold}
                />
                <p className="measure mt-2 text-[var(--text-legend)] text-broth">
                  Murcko scaffold
                </p>
                <p className="mt-1 text-[var(--text-legend)] text-ink-faint">
                  the grouping key of the split
                </p>
              </div>
            </div>
          </Panel>
          <Panel title="Three feature sets, by width">
            <Funnel
              drops={false}
              rows={[
                {
                  label: "Hybrid",
                  value: 2062,
                  display: "2,062",
                  tone: "broth",
                  note: "fingerprint and descriptors side by side",
                },
                {
                  label: "Morgan fingerprint",
                  value: 2048,
                  display: "2,048",
                  tone: "dim",
                  note: "radius 2, hashed to bits",
                },
                {
                  label: "Descriptors",
                  value: 14,
                  display: "14",
                  tone: "faint",
                  note: "weight, logP, TPSA, donors, acceptors, and nine more",
                },
              ]}
            />
          </Panel>
          <Panel title="And the one each model was finally fitted on">
            <Chain
              joined={false}
              nodes={pathogens.map((p) => ({
                title: p.binomial,
                detail: p.featureSet,
                tone: "broth" as const,
              }))}
            />
          </Panel>
        </>
      );

    case "splits":
      return (
        <>
          <Panel title="Where the compounds went">
            {pathogens.map((p) => (
              <Strain key={p.slug} pathogen={p}>
                <Strip
                  height="1.75rem"
                  segments={[
                    {
                      label: "Train",
                      value: p.train,
                      display: count(p.train),
                      tone: "faint",
                    },
                    {
                      label: "Validation",
                      value: p.validation,
                      display: count(p.validation),
                      tone: "dim",
                    },
                    {
                      label: "Test",
                      value: p.test,
                      display: count(p.test),
                      tone: "dim",
                    },
                    {
                      label: "Plant holdout",
                      value: p.plantLabelled,
                      display: count(p.plantLabelled),
                      tone: "broth",
                    },
                  ]}
                />
              </Strain>
            ))}
          </Panel>
          <Panel title="Share of held-out compounds whose scaffold was already in training">
            <Funnel
              drops={false}
              rows={[
                ...pathogens.map((p) => ({
                  label: `${p.short}, split at random`,
                  value: p.seenScaffoldsRandom,
                  display: dec(p.seenScaffoldsRandom, 3),
                  tone: "faint" as const,
                })),
                ...pathogens.map((p) => ({
                  label: `${p.short}, split on scaffolds`,
                  value: p.seenScaffoldsScaffold,
                  display: dec(p.seenScaffoldsScaffold, 3),
                  tone: "broth" as const,
                })),
              ]}
            />
          </Panel>
          <Panel title="How far the held-out chemistry really sits">
            {pathogens.map((p) => (
              <Strain key={p.slug} pathogen={p}>
                <Scale
                  from={0}
                  marks={[
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
                      tone: "broth",
                    },
                  ]}
                  ticks={[
                    { at: 0.25, label: "0.25" },
                    { at: 0.5, label: "0.5" },
                    { at: 0.75, label: "0.75" },
                  ]}
                  to={1}
                />
              </Strain>
            ))}
            <Caption>
              Tanimoto to the nearest compound the model trained on, where{" "}
              <span className="measure">1.000</span> is an identical fingerprint.
              Holding out a ring system does not hold out the analogue beside
              it, which is why the test column of the next beat stays high.
            </Caption>
          </Panel>
        </>
      );

    case "model":
      return (
        <>
          <Panel title="Eighteen untuned fits per pathogen, and the combination that won">
            {pathogens.map((p) => (
              <Strain key={p.slug} pathogen={p}>
                {/* Where the eighteen come from is step 01 and the panel
                    title; saying it again on each of three rows was three
                    copies of one sentence. */}
                <Cells
                  label="fits, untuned"
                  marked={3}
                  markedFrom={
                    FEATURE_ORDER.indexOf(p.featureSet) * 6 +
                    (p.modelFamily === "random_forest" ? 0 : 3)
                  }
                  markedLabel={`seeds of the combination that won: ${p.featureSet}, ${p.modelFamily.replace("_", " ")}`}
                  total={18}
                />
              </Strain>
            ))}
          </Panel>
          <Panel title="Then the winner is tuned, frozen and calibrated">
            <Cells
              label="Optuna trials per pathogen, against validation AUROC"
              size={12}
              total={30}
            />
            <div className="mt-7">
              <Facts>
                <Fact
                  label="Sampler"
                  note="not a grid search"
                  value="TPE"
                />
                <Fact
                  label="Calibration"
                  note="on validation, forest frozen"
                  value="Platt"
                />
                <Fact
                  label="Threshold rule"
                  note="most precision at recall 0.40 or better"
                  value="P|R≥0.40"
                />
                <Fact
                  label="Bootstrap"
                  note="stratified resamples per interval"
                  tone="dim"
                  value={count(first.bootstrapRepeats)}
                />
              </Facts>
            </div>
          </Panel>
          <Panel title="What the search returned">
            <Chain
              joined={false}
              nodes={pathogens.map((p) => ({
                title: p.binomial,
                detail: `${p.params.n_estimators} trees · leaf ${p.params.min_samples_leaf} · ${dec(Number(p.params.max_features ?? 0), 3)} of columns per split`,
                note: `operating threshold ${dec(p.operatingThreshold, 3)}, precision ${pct(p.precisionAtThreshold, 0)} at recall ${pct(p.recallAtThreshold, 1)}`,
              }))}
            />
          </Panel>
        </>
      );

    case "ladder":
      return (
        <>
          <div className="grid gap-x-10 gap-y-10 xl:grid-cols-3">
            {pathogens.map((p) => (
              <div key={p.slug}>
                <h4 className="mb-5 text-base leading-tight font-medium italic">
                  {p.binomial}
                </h4>
                <Slope
                  columns={["validation", "scaffold test", "plant holdout"]}
                  from={0.55}
                  legend={false}
                  series={[
                    {
                      label: p.binomial,
                      tone: "broth",
                      values: [p.validationAuroc, p.testAuroc, p.plantAuroc],
                    },
                  ]}
                  to={0.95}
                />
                <p className="mt-1 text-[var(--text-legend)] leading-snug text-ink-dim">
                  plant holdout 95% interval{" "}
                  <span className="measure">
                    {dec(p.plantAurocLo, 3)}&ndash;{dec(p.plantAurocHi, 3)}
                  </span>
                </p>
              </div>
            ))}
          </div>
          <Caption>
            AUROC: the chance the model ranks a random active compound above a
            random inactive one, where <span className="measure">0.500</span> is
            a coin flip. No scaffold appears on both sides of the middle
            station, and the fall to the right is what a plant screen actually
            asks of this model.
          </Caption>
          {/* What the ranking buys a laboratory — precision and enrichment at
              its head — is the deliverable's own argument, and `/` gives all
              twelve figures. Repeating them here only lengthened the scroll.
              What belongs to this beat is the one thing the hardest reading
              produced that the rest of the pipeline then runs on. */}
          {/* One cutoff, not three. `in_domain_tanimoto` is a single value in
              the shortlist configuration and the same line is applied to all
              three pathogens, so printing it once per pathogen was the same
              number three times over. */}
          <Panel title="The cutoff the hardest reading produced">
            <Facts>
              <Fact
                label="Domain cutoff"
                note="the 25th percentile of the plant holdout, one line applied to all three pathogens"
                value={tanimoto(first.domainCutoff)}
              />
            </Facts>
          </Panel>
        </>
      );

    case "screen":
      return (
        <>
          <Panel title="From the screening set to two tiers, on a log track">
            <Funnel
              scale="log"
              rows={[
                {
                  label: "Plant structures scored",
                  value: first.screened,
                  display: count(first.screened),
                  tone: "faint",
                },
                {
                  label: "Top-scoring candidate pool",
                  value: first.candidatePool,
                  display: count(first.candidatePool),
                  tone: "dim",
                },
                {
                  label: "Shortlist, in domain",
                  value: first.shortlistSize,
                  display: String(first.shortlistSize),
                  tone: "broth",
                },
                {
                  label: "Exploratory, outside the domain",
                  value: first.exploratoryCount,
                  display: String(first.exploratoryCount),
                  tone: "growth",
                },
              ]}
            />
          </Panel>
          <Panel title="The result, read as the plate it came from">
            <div className="grid gap-x-8 gap-y-7 xl:grid-cols-3">
              {pathogens.map((p) => (
                <div key={p.slug}>
                  <h4 className="mb-4 text-base leading-tight font-medium italic">
                    {p.binomial}
                  </h4>
                  <MiniPlate pathogen={p} />
                  <p className="mt-3 text-[var(--text-legend)] leading-snug text-ink-dim">
                    median score{" "}
                    <span className="measure text-ink">
                      {dec(p.medianShortlistProbability, 3)}
                    </span>
                    , median distance{" "}
                    <span className="measure text-ink">
                      {tanimoto(p.medianShortlistTanimoto)}
                    </span>
                    , {p.distinctPathways} biosynthetic pathways
                  </p>
                </div>
              ))}
            </div>
            <Caption>
              One well per candidate. The liquid rises to that compound&rsquo;s
              distance from known chemistry and clouds with its predicted score;
              the last fifteen are struck through because they fall outside the
              domain, and their scores are not evidence of activity.
            </Caption>
          </Panel>
        </>
      );

    case "negatives":
      return (
        <>
          <Panel title="Four runs of the family split, as the gap each one measured">
            <Spread
              from={-0.2}
              points={ctx.splitRuns.map((run) => ({
                at: run.gap,
                label: `${run.task.replace(/^(\w)\w+ /, "$1. ")}, n=${count(run.compounds)}, ${
                  run.labelSource.startsWith("NPASS") ? "NPASS" : "ChEMBL"
                }`,
              }))}
              to={0.08}
            />
            <Caption>
              Left of the line, holding out plant families was harder than
              holding out scaffolds; right of it, easier. Across the four runs
              the repeat-to-repeat spread is wider than the effect, so it ships
              as a negative result rather than as the contribution.
            </Caption>
          </Panel>
          <Panel title="And the defects we know are in the shortlist">
            <Chain
              joined={false}
              nodes={[
                {
                  title: "The top-ranked candidate is a near-copy",
                  detail: pathogens
                    .map((p) => tanimoto(p.shortlist[0].tanimoto))
                    .join(" / "),
                  note: "nearest training compound, per pathogen",
                  tone: "growth",
                },
                {
                  title: "Candidates above 0.90",
                  detail: pathogens
                    .map((p) => p.shortlist.filter((c) => c.tanimoto >= 0.9).length)
                    .join(" / "),
                  note: "of fifty, per pathogen",
                  tone: "growth",
                },
                {
                  title: "No source plant on record",
                  detail: pathogens
                    .map((p) => p.shortlist.filter((c) => !c.plants.length).length)
                    .join(" / "),
                  note: "of fifty, per pathogen",
                  tone: "growth",
                },
                {
                  title: "Per-compound SHAP withheld",
                  detail: "10^24",
                  note: "magnitudes a probability output cannot produce",
                  tone: "growth",
                },
              ]}
            />
          </Panel>
        </>
      );

    case "ledger":
      return (
        <>
          <Panel title="Four stages, each stamped with the configuration that produced it">
            <Chain
              nodes={ctx.hashes.map(({ stage, hash }, i) => ({
                title: STAGE_TITLES[stage],
                detail: hash,
                note: STAGE_NOTES[stage],
                tone: i === ctx.hashes.length - 1 ? ("broth" as const) : undefined,
              }))}
            />
          </Panel>
          <Panel title="What stands behind every number on both pages">
            <Facts>
              <Fact
                label="Metrics reproduced"
                note={`${ctx.reproduction.stages.join(" and ")}, on a second machine`}
                tone="broth"
                value={String(ctx.reproduction.metrics)}
              />
              <Fact
                label="Data fingerprint"
                note="the table the winning model was fitted on"
                tone="dim"
                value={first.dataFingerprint}
              />
              <Fact
                label="Retrained here"
                note="this page reads committed files only"
                tone="dim"
                value="none"
              />
            </Facts>
          </Panel>
          <Panel title="And the obligations that ship with it">
            <Chain
              joined={false}
              nodes={[
                {
                  title: "Licences",
                  detail: "ChEMBL CC BY-SA 3.0 · LOTUS CC0 · GBIF CC BY-NC 4.0",
                  note: "carried on both pages, beside the data they cover",
                },
                {
                  title: "Generative AI",
                  detail: "pipeline, interface, parts of the analysis",
                  note: "every number and claim is the team's own responsibility",
                },
                {
                  title: "Traditional knowledge",
                  detail: "published literature only",
                  note: "where it sits behind a record, it belongs to the community that holds it",
                },
                {
                  title: "No health claim",
                  detail: "a hypothesis for a bench",
                  note: "no efficacy, no dose, no recommendation, anywhere",
                  tone: "growth",
                },
              ]}
            />
          </Panel>
        </>
      );

    default:
      return null;
  }
}

/**
 * Scientific names are set in italics, which means prose kept as data needs one
 * mark the content can carry. The mark is `*Escherichia coli*`: an asterisk
 * rather than an underscore, because half the strings on this page name a file
 * or a config key and those are full of underscores.
 */
function italicise(text: string): ReactNode {
  if (!text.includes("*")) return text;
  return text
    .split("*")
    .map((part, i) => (i % 2 ? <em key={i}>{part}</em> : <span key={i}>{part}</span>));
}
