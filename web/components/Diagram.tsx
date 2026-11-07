import type { CSSProperties, ReactNode } from "react";

/**
 * The figures the pipeline story is told in.
 *
 * All of them are built from the same four things the rest of this surface is
 * built from: a 1px polystyrene hairline, a filled block, a circle, and a
 * diagonal strike. Nothing here is a chart library and nothing is decoration;
 * each figure draws a quantity that is read out of `results/` at build time.
 *
 * Each one also draws itself on arrival, in steps, the way an instrument would
 * plot it. That is the page's one authored motion, and `prefers-reduced-motion`
 * or a browser without scroll-driven animation gets the finished figure.
 */

export type Tone = "ink" | "dim" | "faint" | "broth" | "growth";

const FILL: Record<Tone, string> = {
  ink: "var(--color-ink)",
  dim: "var(--color-ink-dim)",
  faint: "var(--color-ink-faint)",
  broth: "var(--color-broth)",
  growth: "var(--color-growth)",
};

const TEXT: Record<Tone, string> = {
  ink: "text-ink",
  dim: "text-ink-dim",
  faint: "text-ink-faint",
  broth: "text-broth",
  growth: "text-growth",
};

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/** One line under a figure. Never a paragraph: the figure carries the argument. */
export function Caption({ children }: { children: ReactNode }) {
  return (
    <p className="mt-5 max-w-[68ch] text-[var(--text-small)] leading-relaxed text-ink-dim">
      {children}
    </p>
  );
}

export function FigureLabel({ children }: { children: ReactNode }) {
  return <h3 className="legend mb-5">{children}</h3>;
}

/* --- Proportional blocks -------------------------------------------------- */

export type Row = {
  label: string;
  value: number;
  display: string;
  tone?: Tone;
  /** Written under the bar, where the quantity needs a second line. */
  note?: string;
};

/**
 * A descending run of blocks, each one as wide as its share of the first. What
 * a funnel is for: every drop is visible as the step it cut.
 */
export function Funnel({
  rows,
  drops = true,
  scale = "linear",
}: {
  rows: Row[];
  drops?: boolean;
  /** Log, where the run spans orders of magnitude and linear would hide it. */
  scale?: "linear" | "log";
}) {
  const peak = rows[0]?.value || 1;
  const width = (value: number) => {
    if (scale === "linear") return (value / peak) * 100;
    const floor = Math.min(...rows.map((r) => Math.max(r.value, 1)));
    const span = Math.log10(peak) - Math.log10(floor) || 1;
    return (1 - (Math.log10(peak) - Math.log10(Math.max(value, 1))) / span) * 88 + 12;
  };
  return (
    <div>
      {rows.map((row, i) => {
        const previous = rows[i - 1];
        const lost = previous ? previous.value - row.value : 0;
        return (
          <div key={row.label}>
            {drops && previous && lost > 0 ? (
              <p className="measure py-1 pl-1 text-[var(--text-legend)] text-ink-faint">
                &minus;{lost.toLocaleString("en-GB")}
              </p>
            ) : null}
            <div className="flex items-baseline justify-between gap-4 pb-1.5">
              <span className="text-[var(--text-small)] leading-snug">
                {row.label}
              </span>
              <span className={`measure shrink-0 text-[var(--text-small)] ${TEXT[row.tone ?? "ink"]}`}>
                {row.display}
              </span>
            </div>
            <div className="h-3 w-full">
              <div
                className="draw-x h-full"
                style={
                  {
                    width: `${Math.max(width(row.value), 0.35)}%`,
                    background: FILL[row.tone ?? "dim"],
                    "--step": i,
                  } as Vars
                }
              />
            </div>
            {row.note ? (
              <p className="mt-1.5 text-[var(--text-legend)] leading-snug text-ink-faint">
                {row.note}
              </p>
            ) : null}
            {i < rows.length - 1 ? (
              <div className="mt-4 border-t border-[var(--hairline)]" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/** One quantity split into its parts, along a single track. */
export function Strip({
  segments,
  height = "2.25rem",
}: {
  segments: Row[];
  height?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  return (
    <div>
      <div className="flex w-full gap-px" style={{ height }}>
        {segments.map((segment, i) => (
          <div
            key={segment.label}
            className="draw-y h-full"
            style={
              {
                width: `${Math.max((segment.value / total) * 100, 0.4)}%`,
                background: FILL[segment.tone ?? "dim"],
                "--step": i,
              } as Vars
            }
          />
        ))}
      </div>
      <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-2">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-baseline gap-2">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 translate-y-px"
              style={{ background: FILL[segment.tone ?? "dim"] }}
            />
            <dt className="text-[var(--text-small)] leading-snug text-ink-dim">
              {segment.label}
            </dt>
            <dd className={`measure text-[var(--text-small)] ${TEXT[segment.tone ?? "ink"]}`}>
              {segment.display}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * A quantity too small to see at full scale, drawn twice: the whole, then the
 * slice of it the next figure lives inside, with the two tied by hairlines.
 */
export function Detail({
  whole,
  wholeLabel,
  slice,
  sliceLabel,
  inner,
}: {
  whole: number;
  wholeLabel: string;
  slice: number;
  sliceLabel: string;
  inner: Row[];
}) {
  const sliceShare = Math.max(slice / whole, 0.004);
  const innerTotal = inner.reduce((sum, r) => sum + r.value, 0) || 1;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 pb-1.5">
        <span className="text-[var(--text-small)]">{wholeLabel}</span>
        <span className="measure text-[var(--text-small)]">
          {whole.toLocaleString("en-GB")}
        </span>
      </div>
      <div className="relative h-7 w-full bg-[var(--color-ink-faint)]">
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 bg-broth"
          style={{ width: `${sliceShare * 100}%`, minWidth: "2px" }}
        />
      </div>
      {/* The two hairlines that say the lower track is a magnification of the
          sliver above it, not a second quantity. */}
      <svg
        aria-hidden="true"
        className="block h-8 w-full"
        preserveAspectRatio="none"
        viewBox="0 0 100 32"
      >
        <path
          d={`M0 0 L0 32 M${sliceShare * 100} 0 L100 32`}
          fill="none"
          stroke="var(--hairline)"
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="flex items-baseline justify-between gap-4 pb-1.5">
        <span className="text-[var(--text-small)] text-broth">{sliceLabel}</span>
        <span className="measure text-[var(--text-small)] text-broth">
          {slice.toLocaleString("en-GB")}
        </span>
      </div>
      <div className="flex h-7 w-full gap-px">
        {inner.map((row, i) => (
          <div
            key={row.label}
            className="draw-y h-full"
            style={
              {
                width: `${Math.max((row.value / innerTotal) * 100, 1)}%`,
                background: FILL[row.tone ?? "broth"],
                "--step": i,
              } as Vars
            }
          />
        ))}
      </div>
      <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-2">
        {inner.map((row) => (
          <div key={row.label} className="flex items-baseline gap-2">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 translate-y-px"
              style={{ background: FILL[row.tone ?? "broth"] }}
            />
            <dt className="text-[var(--text-small)] text-ink-dim">{row.label}</dt>
            <dd className={`measure text-[var(--text-small)] ${TEXT[row.tone ?? "ink"]}`}>
              {row.display}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* --- Two sets and what they share ---------------------------------------- */

export function Overlap({
  left,
  right,
  both,
}: {
  left: Row;
  right: Row;
  both: Row;
}) {
  // Widths in a 100-unit frame, with the shared part drawn where they meet.
  const span = left.value + right.value;
  const leftWidth = (left.value / span) * 100;
  const sharedWidth = Math.max((both.value / span) * 100, 1.5);
  return (
    <div>
      <div className="relative h-24 w-full">
        <div
          className="draw-x absolute top-0 left-0 h-10"
          style={{ width: `${leftWidth}%`, background: FILL.dim, "--step": 0 } as Vars}
        />
        <div
          className="draw-x absolute bottom-0 h-10"
          style={
            {
              left: `${leftWidth - sharedWidth}%`,
              right: 0,
              background: FILL.faint,
              "--step": 1,
            } as Vars
          }
        />
        <div
          className="absolute top-0 h-24 bg-broth"
          style={{ left: `${leftWidth - sharedWidth}%`, width: `${sharedWidth}%` }}
        />
      </div>
      <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-3">
        {[left, both, right].map((row) => (
          <div key={row.label}>
            <dt className="legend mb-1.5">{row.label}</dt>
            <dd className={`measure text-lg leading-none ${TEXT[row.tone ?? "ink"]}`}>
              {row.display}
            </dd>
            {row.note ? (
              <dd className="mt-1.5 text-[var(--text-legend)] leading-snug text-ink-dim">
                {row.note}
              </dd>
            ) : null}
          </div>
        ))}
      </dl>
    </div>
  );
}

/* --- Countable things ----------------------------------------------------- */

/**
 * One cell per thing counted, so a count is seen rather than read: 37 unit
 * strings, 18 of them refused and struck; 18 model fits; 30 tuning trials.
 */
export function Cells({
  total,
  marked = 0,
  markedFrom = 0,
  struck = 0,
  size = 14,
  label,
  markedLabel,
  struckLabel,
}: {
  total: number;
  marked?: number;
  /** Where the marked run starts, for a group inside a longer sequence. */
  markedFrom?: number;
  struck?: number;
  size?: number;
  label: string;
  markedLabel?: string;
  struckLabel?: string;
}) {
  return (
    <div>
      <div
        aria-hidden="true"
        className="flex flex-wrap"
        style={{ gap: `${Math.max(size / 4, 3)}px` }}
      >
        {Array.from({ length: total }, (_, i) => {
          const isStruck = i >= total - struck;
          const isMarked = !isStruck && i >= markedFrom && i < markedFrom + marked;
          return (
            <span
              key={i}
              className={`draw-cell block ${isStruck ? "cell-struck" : ""}`}
              style={
                {
                  width: `${size}px`,
                  height: `${size}px`,
                  background: isMarked ? FILL.broth : "transparent",
                  border: `1px solid ${isStruck ? FILL.growth : isMarked ? FILL.broth : "var(--rim)"}`,
                  "--step": i % 12,
                } as Vars
              }
            />
          );
        })}
      </div>
      <p className="mt-3 text-[var(--text-small)] leading-snug text-ink-dim">
        <span className="measure text-ink">{total}</span> {label}
        {markedLabel ? (
          <>
            {" · "}
            <span className="measure text-broth">{marked}</span> {markedLabel}
          </>
        ) : null}
        {struckLabel ? (
          <>
            {" · "}
            <span className="measure text-growth">{struck}</span> {struckLabel}
          </>
        ) : null}
      </p>
    </div>
  );
}

/* --- Values on an axis ---------------------------------------------------- */

export type SlopePoint = { at: number; label: string };

/**
 * The same model read at three stations. A slope chart, because the argument is
 * the fall between the readings and not any one of them.
 */
export function Slope({
  columns,
  series,
  from,
  to,
  legend = true,
}: {
  columns: string[];
  series: { label: string; values: number[]; tone?: Tone }[];
  from: number;
  to: number;
  /** Off when the chart has one line and a heading already names it. */
  legend?: boolean;
}) {
  const height = 210;
  const padY = 16;
  const y = (value: number) =>
    padY + (1 - (value - from) / (to - from)) * (height - padY * 2);
  const x = (i: number) => (i / (columns.length - 1)) * 100;

  return (
    <div>
      <div className="relative">
        <svg
          aria-hidden="true"
          className="block w-full"
          height={height}
          preserveAspectRatio="none"
          viewBox={`0 0 100 ${height}`}
        >
          {columns.map((column, i) => (
            <line
              key={column}
              stroke="var(--hairline)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              x1={x(i)}
              x2={x(i)}
              y1={0}
              y2={height}
            />
          ))}
          {series.map((line, s) => (
            <g key={line.label}>
              <polyline
                className="draw-path"
                fill="none"
                pathLength={1}
                points={line.values
                  .map((value, i) => `${x(i)},${y(value)}`)
                  .join(" ")}
                stroke={FILL[line.tone ?? "ink"]}
                strokeWidth="1.5"
                style={{ "--step": s } as Vars}
                vectorEffect="non-scaling-stroke"
              />
              {line.values.map((value, i) => (
                <rect
                  key={columns[i]}
                  fill={FILL[line.tone ?? "ink"]}
                  height="5"
                  width="5"
                  x={0}
                  y={y(value) - 2.5}
                  style={{
                    transform: `translateX(calc(${x(i)}% - 2.5px))`,
                  }}
                />
              ))}
            </g>
          ))}
        </svg>
        {/* Values as text, outside the stretched viewBox so nothing is skewed. */}
        {series.map((line) =>
          line.values.map((value, i) => (
            <span
              key={`${line.label}-${columns[i]}`}
              className={`measure absolute text-[var(--text-legend)] ${TEXT[line.tone ?? "ink"]}`}
              style={{
                left: `${x(i)}%`,
                top: `${y(value) - 21}px`,
                transform: `translateX(${i === 0 ? "0" : i === columns.length - 1 ? "-100%" : "-50%"})`,
              }}
            >
              {value.toFixed(3)}
            </span>
          )),
        )}
      </div>
      <div className="mt-2 flex border-t border-[var(--hairline)] pt-2">
        {columns.map((column, i) => (
          <span
            key={column}
            className="legend block"
            style={{
              width: `${100 / columns.length}%`,
              textAlign:
                i === 0 ? "left" : i === columns.length - 1 ? "right" : "center",
            }}
          >
            {column}
          </span>
        ))}
      </div>
      <dl className={`mt-4 flex flex-wrap gap-x-8 gap-y-2 ${legend ? "" : "hidden"}`}>
        {series.map((line) => (
          <div key={line.label} className="flex items-baseline gap-2">
            <span
              aria-hidden="true"
              className="h-0.5 w-5 shrink-0 -translate-y-1"
              style={{ background: FILL[line.tone ?? "ink"] }}
            />
            <dt className="text-[var(--text-small)] italic text-ink-dim">
              {line.label}
            </dt>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Estimates of one effect, on an axis with zero drawn. */
export function Spread({
  points,
  from,
  to,
}: {
  points: { at: number; label: string; note?: string }[];
  from: number;
  to: number;
}) {
  const place = (value: number) => ((value - from) / (to - from)) * 100;
  return (
    <div>
      <div className="relative h-px w-full bg-[var(--hairline)]">
        <span
          aria-hidden="true"
          className="absolute -top-6 bottom-[-1.5rem] w-px bg-[var(--color-rim)] opacity-60"
          style={{ left: `${place(0)}%` }}
        />
        {points.map((point) => (
          <span
            key={point.label}
            aria-hidden="true"
            className="draw-dot absolute -top-1.5 h-3 w-3 border"
            style={
              {
                left: `${place(point.at)}%`,
                marginLeft: "-0.375rem",
                borderColor: point.at < 0 ? FILL.growth : FILL.broth,
                background: "var(--color-void)",
              } as Vars
            }
          />
        ))}
      </div>
      <div
        className="relative mt-8"
        style={{ height: `${2.2 + points.length * 1.35}rem` }}
      >
        <span
          className="legend absolute top-0"
          style={{ left: `${place(0)}%`, transform: "translateX(-50%)" }}
        >
          no effect
        </span>
        {points.map((point, i) => (
          <span
            key={point.label}
            className="absolute text-[var(--text-legend)] leading-snug"
            style={{
              left: `${place(point.at)}%`,
              top: `${1.4 + i * 1.35}rem`,
              transform: "translateX(-50%)",
              whiteSpace: "nowrap",
            }}
          >
            <span className={`measure ${point.at < 0 ? "text-growth" : "text-broth"}`}>
              {point.at > 0 ? "+" : ""}
              {point.at.toFixed(3)}
            </span>{" "}
            <span className="text-ink-dim italic">{point.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* --- Things joined in sequence ------------------------------------------- */

export type Node = {
  title: string;
  detail?: string;
  note?: string;
  tone?: Tone;
  struck?: boolean;
};

/**
 * Blocks joined by a hairline: sources feeding a table, stages feeding a
 * ledger. A struck block is one we did not use, and the strike is the same
 * mark an out-of-domain well carries.
 */
export function Chain({ nodes, joined = true }: { nodes: Node[]; joined?: boolean }) {
  return (
    <ol className="grid gap-px sm:grid-cols-2 lg:grid-cols-4">
      {nodes.map((node, i) => (
        <li
          key={node.title}
          className={`draw-cell relative border-t border-[var(--hairline)] pt-3 pr-4 pb-4 ${
            node.struck ? "node-struck" : ""
          }`}
          style={{ "--step": i } as Vars}
        >
          {joined && i < nodes.length - 1 ? (
            <span
              aria-hidden="true"
              className="absolute top-0 -right-px hidden h-px w-4 bg-broth lg:block"
            />
          ) : null}
          <p
            className={`text-[var(--text-small)] leading-snug ${
              node.struck ? "text-ink-faint" : TEXT[node.tone ?? "ink"]
            }`}
          >
            {node.title}
          </p>
          {node.detail ? (
            <p className="measure mt-1.5 text-[var(--text-legend)] leading-snug text-ink-dim">
              {node.detail}
            </p>
          ) : null}
          {node.note ? (
            <p className="mt-1.5 text-[var(--text-legend)] leading-snug text-ink-faint">
              {node.note}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
