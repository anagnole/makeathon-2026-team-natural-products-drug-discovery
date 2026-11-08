"use client";

import { useEffect, useState } from "react";
import type { Pathogen } from "@/lib/data";
import WellMark from "./WellMark";

/**
 * The cold open.
 *
 * This surface is recorded rather than browsed, so it is allowed one frame that
 * does nothing but establish what this is, who made it and what it is for. It
 * holds the full viewport so the first shot of the take has no half-scrolled
 * second element in it.
 *
 * The question is the organisers' own, verbatim from the Track 2 brief, because
 * the honest opening of this pitch is their question and not our answer. The
 * wells across the middle are the first twelve candidates of the first plate,
 * reading themselves as the title lands: real rows from `results/`, not an
 * ornament.
 *
 * It is a client component for one reason. A recording starts with the page
 * already open, so an entrance that only fires on load has already happened by
 * the time the take does — the most important frame in the video would open
 * static. The first beat of record mode re-fires it instead.
 */
export default function Title({ pathogens }: { pathogens: Pathogen[] }) {
  const [take, setTake] = useState(0);
  const twelve = pathogens[0].shortlist.slice(0, 12);

  useEffect(() => {
    const replay = () => setTake((n) => n + 1);
    window.addEventListener("title:replay", replay);
    return () => window.removeEventListener("title:replay", replay);
  }, []);

  return (
    <section
      id="title"
      className="flex min-h-[calc(100svh-3.5rem)] flex-col justify-between pt-14 pb-10 lg:pt-20"
    >
      {/* Keyed on the take: a CSS entrance only replays on a new element. */}
      <div key={take} className="contents">
        <div>
          <h1 className="opens display max-w-[20ch] text-thesis leading-[0.95] font-semibold tracking-[-0.035em] text-balance">
            Among hundreds of thousands of plant compounds, which deserve a
            closer look?
          </h1>

          <p
            className="opens prose mt-6 max-w-[56ch]"
            style={{ "--open": 1 } as React.CSSProperties}
          >
            We took that question literally, for three bacterial pathogens, and
            answered it with a number next to every compound saying how far the
            answer can be trusted.
          </p>
        </div>

        {/* The read the whole surface is built on, stated once at the start as
            twelve real wells rather than described. It fills the middle of the
            frame, which otherwise opens the video on a third of a screen of
            nothing. `plate-reading` rather than the scroll-driven class: at the
            top of the page there is no scroll left to drive it. */}
        <div
          className="plate-reading flex w-full max-w-[52rem] gap-[var(--well-gap)] self-center"
          aria-hidden="true"
        >
          {twelve.map((compound, i) => (
            <div key={compound.skeleton + compound.well} className="flex-1">
              <WellMark compound={compound} column={i} />
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--hairline)] pt-5">
          <h2 className="legend mb-3">Built by</h2>
          <p className="text-base leading-tight font-medium text-broth">
            Team Arxigoi
          </p>
          <p className="mt-1 text-base leading-tight font-medium">
            Leonidas Anagnou · Eleni Nasopoulou
          </p>
          <p className="mt-2 text-[var(--text-small)] text-ink-dim">
            School of Electrical and Computer Engineering, National Technical
            University of Athens
          </p>
        </div>
      </div>
    </section>
  );
}
