"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Compound, Pathogen } from "@/lib/data";
import { count, dec, tanimoto } from "@/lib/format";
import Slip from "./Slip";
import Structure from "./Structure";
import WellMark from "./WellMark";

const COLUMNS = 12;
const ROWS = 8;
const SLOTS = COLUMNS * ROWS;
const ROW_LETTERS = "ABCDEFGH".split("");

/** Two tiers, two grids, so a grid never has a rule for a child. */
const TIERS = [
  { label: "Shortlist plate, inside the read", from: 0, to: 5, rule: false },
  { label: "Wells beyond the read", from: 5, to: 8, rule: true },
] as const;

type Slot = { compound: Compound | null; index: number };

function buildSlots(pathogen: Pathogen): Slot[] {
  const byWell = new Map<string, Compound>();
  for (const c of [...pathogen.shortlist, ...pathogen.exploratory]) {
    byWell.set(c.well, c);
  }
  return Array.from({ length: SLOTS }, (_, index) => {
    const label = `${ROW_LETTERS[Math.floor(index / COLUMNS)]}${(index % COLUMNS) + 1}`;
    return { compound: byWell.get(label) ?? null, index };
  });
}

function describe(compound: Compound, pathogen: Pathogen): string {
  const tier =
    compound.tier === "in-domain" ? "inside the read" : "beyond the read";
  const plant = compound.plants.length
    ? `reported in ${compound.plants.join(", ")}`
    : "no source plant on record";
  return `Well ${compound.well}, rank ${compound.rank}. ${compound.skeleton}. Predicted ${dec(
    compound.probability,
  )}, nearest training compound at Tanimoto ${tanimoto(compound.tanimoto)}, ${tier}. ${plant}. Base rate for ${pathogen.short} is ${Math.round(
    pathogen.plantBaseRate * 100,
  )} percent.`;
}

export default function Plate({
  pathogens,
  children,
}: {
  pathogens: Pathogen[];
  children: React.ReactNode;
}) {
  const [slug, setSlug] = useState(pathogens[0].slug);
  const [readIndex, setReadIndex] = useState(0);
  const [reading, setReading] = useState(true);
  const grid = useRef<HTMLDivElement>(null);

  const pathogen = pathogens.find((p) => p.slug === slug) ?? pathogens[0];
  const slots = useMemo(() => buildSlots(pathogen), [pathogen]);
  const occupied = useMemo(
    () => slots.filter((s) => s.compound).map((s) => s.index),
    [slots],
  );

  const read = slots[readIndex]?.compound ?? pathogen.shortlist[0];

  // The plate reads itself once, then stops; switching strains is a hard cut
  // and does not replay the read.
  useEffect(() => {
    const timer = window.setTimeout(() => setReading(false), 1400);
    return () => window.clearTimeout(timer);
  }, []);

  const step = useCallback(
    (from: number, delta: number) => {
      if (!occupied.length) return from;
      if (Math.abs(delta) === 1) {
        const at = occupied.indexOf(from);
        const next = at === -1 ? 0 : at + delta;
        return occupied[Math.min(Math.max(next, 0), occupied.length - 1)];
      }
      // Vertical: move a row, then settle on the nearest occupied well.
      let candidate = from + delta;
      while (candidate >= 0 && candidate < SLOTS) {
        if (slots[candidate].compound) return candidate;
        candidate += delta;
      }
      return from;
    },
    [occupied, slots],
  );

  const onKeyDown = (event: React.KeyboardEvent) => {
    const moves: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: COLUMNS,
      ArrowUp: -COLUMNS,
    };
    const delta = moves[event.key];
    if (delta === undefined) return;
    event.preventDefault();
    const next = step(readIndex, delta);
    setReadIndex(next);
    const button = grid.current?.querySelector<HTMLButtonElement>(
      `[data-slot="${next}"]`,
    );
    button?.focus();
  };

  return (
    <div className="grid gap-x-14 gap-y-12 lg:grid-cols-[minmax(0,27rem)_minmax(0,1fr)]">
      <div className="lg:pt-1">
        {children}
        <StrainSelector
          pathogens={pathogens}
          slug={slug}
          onSelect={(next) => {
            setSlug(next);
            setReadIndex(0);
          }}
        />
      </div>

      <div className="min-w-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
        <h2 className="display text-section leading-tight font-medium tracking-[-0.02em]">
          <em className="not-italic">{pathogen.binomial}</em>
        </h2>
        <p className="text-[var(--text-small)] text-ink-dim">
          {count(pathogen.screened)} compounds screened ·{" "}
          {count(pathogen.shortlist.length)} shortlisted ·{" "}
          {count(pathogen.exploratory.length)} beyond the read
        </p>
      </div>

      {read ? <ReadBar compound={read} pathogen={pathogen} /> : null}

      {/* Desktop and tablet: the plate itself. */}
      <div className="mt-5 hidden md:block">
        <ReadLegend pathogen={pathogen} />
        <div className="mt-5 flex gap-2">
          <div className="w-4 shrink-0" />
          <div
            className="grid flex-1 gap-[var(--well-gap)]"
            style={{ gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: COLUMNS }, (_, i) => (
              <span
                key={i}
                className="measure text-center text-[var(--text-legend)] text-ink-faint"
              >
                {i + 1}
              </span>
            ))}
          </div>
        </div>

        <div
          ref={grid}
          className={reading ? "plate-reading" : undefined}
          onKeyDown={onKeyDown}
        >
          {TIERS.map((tier) => (
            <div key={tier.label}>
              {tier.rule ? (
                <div className="my-3 flex items-center gap-3">
                  <hr className="rule flex-1" />
                  <p className="legend shrink-0 text-growth">
                    Below this rule · beyond the read
                  </p>
                </div>
              ) : null}
              <div
                role="grid"
                aria-label={`${tier.label} for ${pathogen.binomial}`}
              >
          {ROW_LETTERS.slice(tier.from, tier.to).map((letter) => {
            const row = ROW_LETTERS.indexOf(letter);
            return (
              <div
                key={letter}
                role="row"
                className="flex items-center gap-2"
                style={{ marginBottom: "var(--well-gap)" }}
              >
                <span className="measure w-4 shrink-0 text-[var(--text-legend)] text-ink-faint">
                  {letter}
                </span>
                <div
                  className="grid flex-1 gap-[var(--well-gap)]"
                  style={{
                    gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))`,
                  }}
                >
                  {slots
                    .slice(row * COLUMNS, row * COLUMNS + COLUMNS)
                    .map((slot) => {
                      const column = slot.index % COLUMNS;
                      if (!slot.compound) {
                        return (
                          <div key={slot.index} role="gridcell">
                            <WellMark compound={null} column={column} />
                          </div>
                        );
                      }
                      return (
                        <div key={slot.index} role="gridcell">
                          <button
                            type="button"
                            className="well-button"
                            data-slot={slot.index}
                            data-read={slot.index === readIndex}
                            tabIndex={slot.index === readIndex ? 0 : -1}
                            aria-label={describe(slot.compound, pathogen)}
                            onPointerEnter={() => setReadIndex(slot.index)}
                            onFocus={() => setReadIndex(slot.index)}
                            onClick={() => setReadIndex(slot.index)}
                          >
                            <WellMark compound={slot.compound} column={column} />
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })}
              </div>
            </div>
          ))}
        </div>

        <p className="prose mt-3 max-w-[70ch]">
          Wells run in rank order, left to right. Hover one to read it, or walk
          the plate with the arrow keys.
        </p>
      </div>

      {/* Phones: the plate is a desktop artifact, so the read becomes a list. */}
      <ol className="mt-5 md:hidden">
        {[...pathogen.shortlist, ...pathogen.exploratory].map((compound) => {
          const active = compound.well === read?.well;
          return (
            <li key={compound.skeleton + compound.well}>
              <button
                type="button"
                className="flex w-full items-center gap-3 border-b border-[var(--hairline)] py-3 text-left"
                aria-current={active}
                onClick={() =>
                  setReadIndex(
                    slots.findIndex((s) => s.compound?.well === compound.well),
                  )
                }
              >
                <span className="w-7 shrink-0">
                  <WellMark compound={compound} column={0} />
                </span>
                <span aria-hidden="true" className="w-[4.5rem] shrink-0">
                  <Structure
                    smiles={compound.smiles}
                    scale="inline"
                    label={compound.skeleton}
                  />
                </span>
                {/* The skeleton is the compound's identifier, so it prints in
                    full; the plate coordinate is dropped here because there is
                    no plate on a phone to find it on. */}
                <span className="min-w-0 flex-1">
                  <span className="measure block text-[var(--text-legend)]">
                    {compound.skeleton}
                  </span>
                  <span className="block truncate text-[var(--text-legend)] text-ink-dim">
                    {compound.plants[0] ? (
                      <em>{compound.plants[0]}</em>
                    ) : (
                      "no source plant on record"
                    )}
                  </span>
                </span>
                <span className="measure shrink-0 text-right text-[var(--text-legend)]">
                  <span className="block">{dec(compound.probability)}</span>
                  <span
                    className={`block text-[var(--text-legend)] ${
                      compound.tanimoto >= pathogen.domainCutoff
                        ? "text-ink-faint"
                        : "text-growth"
                    }`}
                  >
                    {tanimoto(compound.tanimoto)}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      </div>

      {/* The slip reads across the whole page: it is the detail, and the two
          columns above are the way in, not a frame to keep it inside. */}
      {read ? (
        <div className="mt-10 lg:col-span-2 lg:mt-4">
          <Slip compound={read} pathogen={pathogen} />
        </div>
      ) : null}
    </div>
  );
}

/**
 * What the read says, in the first viewport. The full determination slip is
 * below the plate; this is the line a viewer sees change while a well is
 * hovered, which is what the signature interaction owes a screen recording.
 */
function ReadBar({
  compound,
  pathogen,
}: {
  compound: Compound;
  pathogen: Pathogen;
}) {
  const reaches = compound.tanimoto >= pathogen.domainCutoff;
  return (
    <p className="mt-3 flex flex-wrap items-baseline gap-x-7 gap-y-1.5 border-y border-[var(--hairline)] py-3">
      <span className="text-[var(--text-small)] text-ink">
        <span className="legend mr-2">Well</span>
        <span className="measure">{compound.well}</span>
        <span className="text-ink-dim">
          {" "}
          · rank {compound.rank} of {pathogen.shortlist.length}
        </span>
      </span>
      <span className="measure text-[var(--text-small)] break-all text-ink">
        {compound.skeleton}
      </span>
      <span className="text-[var(--text-small)] text-ink">
        <span className="legend mr-2">Predicted</span>
        <span className="measure">{dec(compound.probability)}</span>
      </span>
      <span className="text-[var(--text-small)]">
        <span className="legend mr-2">Nearest known</span>
        <span
          className={`measure ${reaches ? "text-ink" : "text-growth"}`}
        >
          {tanimoto(compound.tanimoto)}
        </span>
      </span>
      <span className="text-[var(--text-small)] text-ink-dim">
        {compound.plants[0] ? (
          <em>{compound.plants[0]}</em>
        ) : compound.tier === "exploratory" ? (
          "beyond the read"
        ) : (
          "no source plant on record"
        )}
      </span>
    </p>
  );
}

/**
 * The key to the plate. It sits in the first viewport because without it the
 * wells are decoration, and it reads in greyscale because every tier is a mark.
 */
function ReadLegend({ pathogen }: { pathogen: Pathogen }) {
  const rows = [
    {
      compound: {
        tanimoto: 0.82,
        probability: 0.93,
        tier: "in-domain",
        twin: false,
      },
      title: "Likely active",
      body: "Full and clear: a high score, and a close neighbour in the training set.",
    },
    {
      compound: {
        tanimoto: 0.41,
        probability: 0.56,
        tier: "in-domain",
        twin: false,
      },
      title: "Less certain",
      body: "Shallow and cloudy: a weaker score, and further from known chemistry.",
    },
    {
      compound: {
        tanimoto: 0.2,
        probability: 0.78,
        tier: "exploratory",
        twin: false,
      },
      title: "Not read",
      body: `Struck through: its nearest known compound is past the gold line at ${tanimoto(pathogen.domainCutoff)}, so the score is not evidence of activity.`,
    },
  ];

  return (
    <div>
      {/* The encoding is stated once, here, where the marks are shown. */}
      <p className="prose mb-3.5 max-w-[88ch] text-[var(--text-small)]">
        Every well is one compound. How{" "}
        <strong className="font-medium text-ink">full</strong> it is shows how
        close that compound sits to known chemistry; how{" "}
        <strong className="font-medium text-ink">cloudy</strong>, the predicted
        score. The gold line is where the read stops.
      </p>
      <dl className="grid gap-x-7 gap-y-3 sm:grid-cols-3">
      {rows.map((row) => (
        <div key={row.title} className="flex items-start gap-3">
          <span aria-hidden="true" className="mt-0.5 w-6 shrink-0">
            <WellMark compound={row.compound as unknown as Compound} column={0} />
          </span>
          <div className="min-w-0">
            <dt className="text-[var(--text-small)] leading-tight font-medium">
              {row.title}
            </dt>
            <dd className="mt-0.5 text-[var(--text-small)] leading-snug text-ink-dim">
              {row.body}
            </dd>
          </div>
        </div>
      ))}
      </dl>
    </div>
  );
}

function StrainSelector({
  pathogens,
  slug,
  onSelect,
}: {
  pathogens: Pathogen[];
  slug: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <div className="mt-7 border-t border-[var(--hairline)] pt-4">
      <p className="legend mb-3">Plates</p>
      <div className="grid gap-px bg-[var(--hairline)]">
        {pathogens.map((p) => {
          const active = p.slug === slug;
          return (
            <button
              key={p.slug}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(p.slug)}
              className={`bg-plate px-3.5 py-3 text-left transition-colors duration-[90ms] ease-linear ${
                active ? "bg-plate-raised" : "hover:bg-plate-raised"
              }`}
            >
              <span className="flex items-baseline gap-2">
                <span
                  aria-hidden="true"
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                    active ? "bg-broth" : "bg-transparent ring-1 ring-ink-faint"
                  }`}
                />
                <span className="text-base leading-tight font-medium italic">
                  {p.binomial}
                </span>
              </span>
              <span className="legend mt-1.5 block">{p.envelope}</span>
              {/* One line where it fits, two deliberate ones where it does
                  not, rather than a wrap through the middle of a phrase. */}
              <span className="mt-1 block text-[var(--text-small)] text-ink-dim">
                <span className="block sm:inline">
                  {count(p.labelled)} measured
                </span>
                <span className="hidden sm:inline"> · </span>
                <span className="block sm:inline">
                  {count(p.plantLabelled)} from plants
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
