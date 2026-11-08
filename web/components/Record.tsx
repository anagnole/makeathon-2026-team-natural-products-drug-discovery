"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * NOT MOUNTED. This was the presenter aid for a screen-recorded demo segment,
 * and it is deliberately not rendered by either page: on the published site a
 * stray `r` keypress would have hijacked the scroll and put a beat strip over
 * the argument. The pitch is slides with a voiceover instead. Kept because it
 * is the only record of the running order the two surfaces were built around;
 * mount it in `app/page.tsx` and `app/pipeline/page.tsx` to use it again.
 *
 * Record mode: the running order of the pitch video, driven from the keyboard.
 *
 * The demo segment of the pitch is two to three minutes of narration over this
 * page, and a presenter cannot narrate and hunt for a scroll position at the
 * same time. Each beat below is one thing to say and the one state change that
 * goes under it, so a take is advanced with a single key and never depends on
 * finding a well with the mouse on camera.
 *
 * The beats follow /pipeline's account of the build, in the same order, so the
 * video and the written argument cannot drift apart. What to say over each one
 * is in docs/video-script.md.
 */

type Beat = {
  /** What is on screen. Shown in the strip, so it stays short. */
  title: string;
  /** Which surface the beat lives on. A beat on the other one navigates
   *  there, and the run picks up where it left off. */
  page?: "/" | "/pipeline/";
  /** Where the page goes. `null` leaves the scroll position alone. */
  anchor: string | null;
  /** Where in frame the anchor lands. Centre for the boundary, which has to
   *  be seen with struck wells on both sides of it. */
  block?: ScrollLogicalPosition;
  /** The state change that happens under the narration, if any. */
  act?: { event: string; detail?: Record<string, string> };
  /** Held before the act fires, so the target is in frame when it moves. */
  settle?: number;
};

const BEATS: Beat[] = [
  {
    title: "The question, and who is asking it",
    anchor: "title",
    act: { event: "title:replay" },
    settle: 120,
  },
  { title: "Almost none of it came from a plant", anchor: "problem" },
  {
    title: "The plate reads itself",
    anchor: "screen",
    act: { event: "plate:replay" },
    settle: 460,
  },
  {
    title: "What one well says",
    anchor: "slip",
    act: { event: "plate:well", detail: { well: "A1" } },
    settle: 220,
  },
  {
    title: "Where the read stops",
    anchor: "beyond",
    block: "center",
    act: { event: "plate:well", detail: { tier: "exploratory" } },
    settle: 320,
  },
  {
    title: "A second envelope",
    anchor: "screen",
    act: { event: "plate:strain", detail: { slug: "escherichia_coli" } },
    settle: 320,
  },
  {
    title: "A third envelope",
    anchor: "screen",
    act: {
      event: "plate:strain",
      detail: { slug: "mycobacterium_tuberculosis" },
    },
    settle: 320,
  },

  // How it was built. Four stops on the other surface rather than all twelve:
  // the pipeline page is the written record, and the video quotes from it.
  { title: "How it was built", page: "/pipeline/", anchor: "question" },
  // Stage 03, not 04: the narration over this beat is the survey's numbers,
  // the ones that killed the per-protein plan. See docs/video-script.md.
  { title: "What the data actually said", page: "/pipeline/", anchor: "survey" },
  { title: "Splitting it honestly", page: "/pipeline/", anchor: "splits" },
  { title: "Every number has a run behind it", page: "/pipeline/", anchor: "ledger" },

  { title: "The evaluation ladder", anchor: "ladder" },
  { title: "How far it had to reach", anchor: "distance" },
  { title: "The measured world, and the plant corner", anchor: "map" },
  { title: "What it buys a lab", anchor: "yield" },
  { title: "Chemistry tracks the envelope", anchor: "biology" },
  { title: "The result that did not replicate", anchor: "negatives" },
  { title: "What is wrong with it", anchor: "limits" },
  { title: "What it is for, and what is next", anchor: "impact" },
  { title: "Who built it", anchor: "credits" },
];

/** Carries the run across a navigation, and nothing else. */
const KEY = "record-beat";

export default function Record() {
  const [on, setOn] = useState(false);
  const [beat, setBeat] = useState(0);
  const [strip, setStrip] = useState(true);
  const timer = useRef<number | undefined>(undefined);

  /** Leaving the run forgets it, so a plain reload is not a resume. */
  const stop = useCallback(() => {
    setOn(false);
    try {
      window.sessionStorage.removeItem(KEY);
    } catch {
      // Nothing was stored to begin with.
    }
  }, []);

  const play = useCallback((index: number) => {
    const next = BEATS[index];
    if (!next) return;
    setBeat(index);

    // A beat on the other surface is a navigation, and the run has to survive
    // it: the index goes to session storage and the component picks it up on
    // the way in. A hard navigation rather than a router push, because the
    // plate has to mount fresh and read itself from the top.
    const here = window.location.pathname;
    const wanted = next.page ?? "/";
    try {
      window.sessionStorage.setItem(KEY, String(index));
    } catch {
      // Private windows refuse storage. The run still works on one surface.
    }
    if (here !== wanted) {
      window.location.assign(`${wanted}#${next.anchor ?? ""}`);
      return;
    }

    if (next.anchor === "top") {
      window.scrollTo({ top: 0 });
    } else if (next.anchor) {
      document
        .getElementById(next.anchor)
        ?.scrollIntoView({ block: next.block ?? "start" });
    }

    window.clearTimeout(timer.current);
    if (!next.act) return;
    const { event, detail } = next.act;
    timer.current = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent(event, { detail }));
    }, next.settle ?? 0);
  }, []);

  // Coming back from the other surface mid-run: resume where it left off,
  // once, after the page has laid out enough for an anchor to be found.
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.sessionStorage.getItem(KEY);
    } catch {
      return;
    }
    if (stored === null) return;
    const index = Number(stored);
    const here = window.location.pathname;
    if (!BEATS[index] || (BEATS[index].page ?? "/") !== here) return;
    setOn(true);
    const id = window.setTimeout(() => play(index), 120);
    return () => window.clearTimeout(id);
  }, [play]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable || /^(INPUT|TEXTAREA)$/.test(target?.tagName ?? "")) {
        return;
      }

      if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        if (on) stop();
        else {
          setOn(true);
          play(0);
        }
        return;
      }

      if (!on) return;

      // While recording the arrows belong to the running order, not to the
      // plate: capture them before the plate's own key handling sees them.
      switch (event.key) {
        case "ArrowRight":
        case " ":
        case "PageDown":
          event.preventDefault();
          event.stopPropagation();
          play(Math.min(beat + 1, BEATS.length - 1));
          break;
        case "ArrowLeft":
        case "PageUp":
          event.preventDefault();
          event.stopPropagation();
          play(Math.max(beat - 1, 0));
          break;
        case "h":
        case "H":
          event.preventDefault();
          setStrip((was) => !was);
          break;
        case "Escape":
          event.preventDefault();
          stop();
          break;
      }
    };

    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [on, beat, play, stop]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  if (!on || !strip) return null;

  const current = BEATS[beat];
  const next = BEATS[beat + 1];

  return (
    /* The other edge of the plate. It is the same stock as the header and the
       footer, carrying the same register, so a frame that catches it reads as
       instrument chrome rather than as a control panel laid over the page. */
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--hairline)] bg-void">
      <div className="mx-auto flex max-w-[96rem] flex-wrap items-baseline justify-between gap-x-8 gap-y-1 px-4 py-2.5 sm:px-8 lg:px-12">
        <p className="flex items-baseline gap-3">
          <span className="measure text-[var(--text-legend)] text-ink-faint">
            {String(beat + 1).padStart(2, "0")}&thinsp;/&thinsp;
            {BEATS.length}
          </span>
          <span className="text-[var(--text-small)] text-ink">
            {current.title}
          </span>
          {next ? (
            <span className="hidden text-[var(--text-small)] text-ink-faint sm:inline">
              next · {next.title}
            </span>
          ) : null}
        </p>
        <p className="legend">
          &rarr; next · &larr; back · H hide · Esc exit
        </p>
      </div>
    </div>
  );
}
