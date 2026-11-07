"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The 2D depiction is drawn in the browser from the canonical SMILES in the
 * result file. It is the only authentic image of a compound we hold, so it is
 * drawn in the surface's own palette rather than a library default.
 */
const THEME = {
  C: "#eef3fc",
  N: "#6f9fe0",
  O: "#e8341f",
  S: "#a9c6e8",
  P: "#a9c6e8",
  F: "#93a7c4",
  CL: "#93a7c4",
  BR: "#93a7c4",
  I: "#93a7c4",
  B: "#93a7c4",
  SI: "#93a7c4",
  H: "#6e84a6",
  BACKGROUND: "transparent",
};

type Props = {
  smiles: string;
  /** Larger depictions get thicker bonds so they hold up at video bitrates. */
  scale?: "slip" | "inline";
  label: string;
  /** Wait until the depiction is near the viewport. A list of 65 rows would
   *  otherwise lay out 65 molecules before the first row could be read. */
  defer?: boolean;
};

/**
 * A handful of the macrolides run past a thousand characters, and laying one
 * out blocks the main thread for seconds for a thumbnail nobody could read.
 * Those are named in the list and drawn only at slip size.
 */
const INLINE_LIMIT = 400;

export default function Structure({
  smiles,
  scale = "slip",
  label,
  defer = false,
}: Props) {
  const tooLarge = scale === "inline" && smiles.length > INLINE_LIMIT;
  const host = useRef<SVGSVGElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [near, setNear] = useState(!defer);

  useEffect(() => {
    if (!defer || near) return;
    const target = frame.current;
    if (!target || typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setNear(true);
      },
      { rootMargin: "400px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [defer, near]);

  useEffect(() => {
    const target = host.current;
    if (!target || !near || tooLarge) return;
    let cancelled = false;
    setFailed(false);

    (async () => {
      const { default: SmilesDrawer } = await import("smiles-drawer");
      if (cancelled || !host.current) return;

      const drawer = new SmilesDrawer.SmiDrawer({
        width: scale === "slip" ? 440 : 170,
        height: scale === "slip" ? 260 : 120,
        bondThickness: scale === "slip" ? 1.1 : 0.9,
        bondLength: scale === "slip" ? 17 : 13,
        fontSizeLarge: scale === "slip" ? 7 : 6,
        fontSizeSmall: scale === "slip" ? 4.5 : 4,
        padding: 6,
        terminalCarbons: false,
        compactDrawing: false,
        themes: { plate: THEME },
      });

      try {
        target.replaceChildren();
        drawer.draw(smiles, target, "plate", null, () => setFailed(true));
      } catch {
        setFailed(true);
        return;
      }
      // smiles-drawer does not always reach its error callback; a depiction
      // that drew nothing is a failure whatever the library reported.
      if (!cancelled && target.childElementCount === 0) setFailed(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [smiles, scale, near, tooLarge]);

  if (tooLarge || failed) {
    const note = tooLarge
      ? "Too large to draw at this size"
      : "Could not be laid out in the browser";
    if (scale === "inline") {
      return (
        <span
          className="measure flex h-12 items-center justify-center text-[var(--text-legend)] text-ink-faint"
          title={`${label}: ${note.toLowerCase()}`}
        >
          {tooLarge ? "···" : "n.d."}
        </span>
      );
    }
    return (
      <p className="text-[var(--text-small)] leading-relaxed text-ink-faint">
        {note}. The SMILES string below is the authoritative record.
      </p>
    );
  }

  return (
    <div
      ref={frame}
      className="structure"
      data-scale={scale}
      role="img"
      aria-label={`Chemical structure of ${label}`}
    >
      <svg ref={host} aria-hidden="true" />
    </div>
  );
}
