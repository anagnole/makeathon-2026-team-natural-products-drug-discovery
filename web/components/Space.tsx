"use client";

import { useEffect, useState } from "react";
import type { ChemicalSpace, Pathogen } from "@/lib/data";
import { count, dec } from "@/lib/format";

/**
 * The measured world, and the plant corner of it.
 *
 * Every other panel on this page states distance as a number. This one is the
 * only place it is a picture, and it is drawn with the figure's own disclaimer
 * attached, because two components of a 2048-bit fingerprint throw away most of
 * what the model is actually looking at.
 *
 * It says three things at once: how little of medicine's measured chemistry
 * came from a plant, where this run's candidates fell on it, and that the
 * applicability-domain boundary cannot be seen here at all. The third is the
 * reason the figure is worth having, and the reason it is captioned the way
 * it is rather than left to imply a separation the numbers do not support.
 */
export default function Space({
  pathogens,
  spaces,
}: {
  pathogens: Pathogen[];
  spaces: Record<string, ChemicalSpace>;
}) {
  const [slug, setSlug] = useState(pathogens[0].slug);

  // The plate owns which strain is being read; this follows it rather than
  // offering a second, competing control for the same choice.
  useEffect(() => {
    const onStrain = (event: Event) => {
      const next = (event as CustomEvent<{ slug: string }>).detail?.slug;
      if (next && spaces[next]) setSlug(next);
    };
    window.addEventListener("plate:reading", onStrain);
    return () => window.removeEventListener("plate:reading", onStrain);
  }, [spaces]);

  const pathogen = pathogens.find((p) => p.slug === slug) ?? pathogens[0];
  const space = spaces[slug] ?? spaces[pathogens[0].slug];

  return (
    <div>
      <figure className="m-0">
        <svg
          viewBox="-4 -4 108 108"
          /* Square, because the two axes are on one shared scale, and bounded,
             because at the full width of the evidence column it would be 850px
             tall and push its own key off the screen. */
          className="block w-full max-w-[40rem]"
          role="img"
          aria-label={`A two-component projection of the ${count(
            space.measuredTotal,
          )} compounds measured against ${pathogen.binomial}, with this run's ${
            space.candidates.length
          } candidates on it. The candidates beyond the applicability domain sit no further from measured chemistry than the shortlisted ones.`}
        >
          {/* The figure's own edge. A hairline, like every other division in
              this system, never a filled panel. */}
          <rect
            x="-4"
            y="-4"
            width="108"
            height="108"
            fill="none"
            stroke="var(--hairline)"
            strokeWidth="0.3"
          />

          {/* Measured chemistry, plotted band by band from the left. */}
          {space.bands.map((d, i) => (
            <path
              key={i}
              className="draw-dot"
              style={{ "--step": i } as React.CSSProperties}
              d={d}
              stroke="var(--color-rim)"
              strokeWidth="1"
              strokeLinecap="round"
              fill="none"
              opacity="0.3"
            />
          ))}

          {/* The part of it that came from a plant. */}
          <g
            className="draw-dot"
            style={{ "--step": space.bands.length + 1 } as React.CSSProperties}
          >
            {space.plants.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="1" fill="var(--color-broth)" />
            ))}
          </g>

          {/* Where this run's candidates landed. In-domain is a ring; beyond the
              read carries the same diagonal strike a well does, so the two tiers
              are told apart without colour. */}
          <g
            className="draw-dot"
            style={{ "--step": space.bands.length + 3 } as React.CSSProperties}
          >
            {space.candidates.map((p, i) => {
              const out = p.tier === "exploratory";
              const stroke = out ? "var(--color-growth)" : "var(--color-ink)";
              return (
                <g key={i}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="1.5"
                    fill="none"
                    stroke={stroke}
                    strokeWidth="0.45"
                  />
                  {out ? (
                    <line
                      x1={p.x - 1.5}
                      y1={p.y + 1.5}
                      x2={p.x + 1.5}
                      y2={p.y - 1.5}
                      stroke={stroke}
                      strokeWidth="0.45"
                    />
                  ) : null}
                </g>
              );
            })}
          </g>
        </svg>
      </figure>

      <Key space={space} pathogen={pathogen} />
    </div>
  );
}

function Key({
  space,
  pathogen,
}: {
  space: ChemicalSpace;
  pathogen: Pathogen;
}) {
  const shortlisted = space.candidates.filter(
    (c) => c.tier === "in-domain",
  ).length;
  const beyond = space.candidates.length - shortlisted;

  const marks = [
    {
      mark: (
        <circle cx="8" cy="8" r="2.4" fill="var(--color-rim)" opacity="0.45" />
      ),
      title: `${count(space.measuredDrawn)} measured compounds`,
      body: `A sample of the ${count(space.measuredTotal)} with a published MIC against ${pathogen.short}.`,
    },
    {
      mark: <circle cx="8" cy="8" r="3.6" fill="var(--color-broth)" />,
      title: `${space.measuredFromPlants} of them from plants`,
      body: `In the whole measured set, ${count(pathogen.plantLabelled)} of ${count(pathogen.labelled)}. That ratio is the problem this project exists for.`,
    },
    {
      mark: (
        <circle
          cx="8"
          cy="8"
          r="4.4"
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="1.4"
        />
      ),
      title: `${shortlisted} shortlisted`,
      body: "Scored inside the applicability domain, and ranked.",
    },
    {
      mark: (
        <g>
          <circle
            cx="8"
            cy="8"
            r="4.4"
            fill="none"
            stroke="var(--color-growth)"
            strokeWidth="1.4"
          />
          <line
            x1="3.6"
            y1="12.4"
            x2="12.4"
            y2="3.6"
            stroke="var(--color-growth)"
            strokeWidth="1.4"
          />
        </g>
      ),
      title: `${beyond} beyond the read`,
      body: "Published, not ranked. Note where they are: not at the edges.",
    },
  ];

  return (
    <>
      <dl className="mt-5 grid gap-x-7 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
        {marks.map((m) => (
          <div key={m.title} className="flex items-start gap-2.5">
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="mt-0.5 w-4 shrink-0"
            >
              {m.mark}
            </svg>
            <div className="min-w-0">
              <dt className="text-[var(--text-small)] leading-tight font-medium">
                {m.title}
              </dt>
              <dd className="mt-0.5 text-[var(--text-legend)] leading-snug text-ink-dim">
                {m.body}
              </dd>
            </div>
          </div>
        ))}
      </dl>

      {/* The disclaimer is a measurement, not a hedge. */}
      <p className="prose mt-6 max-w-[76ch] border-t border-[var(--hairline)] pt-5">
        This figure argues against itself. The median shortlisted candidate
        sits{" "}
        <span className="measure text-ink">{dec(space.nearestInDomain, 4)}</span>{" "}
        from its nearest measured neighbour here; the median candidate{" "}
        <em>beyond</em> the read sits{" "}
        <span className="measure text-ink">
          {dec(space.nearestExploratory, 4)}
        </span>
        . Two components carry{" "}
        <span className="measure text-ink">
          {dec(space.varianceExplained * 100, 1)}%
        </span>{" "}
        of the variance, so the boundary this page is built on is invisible
        here. That is why every well carries a Tanimoto and not a position on a
        map, and why we did not reach for a prettier embedding.
      </p>
    </>
  );
}
