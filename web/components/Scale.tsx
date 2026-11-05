/**
 * One measured value on a shared axis, with the thing it must be compared to
 * sitting on the same axis. A number without its comparison is not a result.
 *
 * Marks take one tier each so labels can never overlap however close the
 * values fall, and each label hugs the edge it would otherwise run off.
 */
export type Mark = {
  at: number;
  /** The number, set in mono so marks line up down the axis. */
  value: string;
  /** What the number is, set in prose so it can be read. */
  label: string;
  tone?: "ink" | "dim" | "growth" | "broth";
};

const TONES: Record<NonNullable<Mark["tone"]>, string> = {
  ink: "var(--color-ink)",
  dim: "var(--color-ink-dim)",
  growth: "var(--color-growth)",
  broth: "var(--color-broth)",
};

export default function Scale({
  from,
  to,
  marks,
  ticks,
}: {
  from: number;
  to: number;
  marks: Mark[];
  ticks?: { at: number; label: string }[];
}) {
  const fraction = (value: number) =>
    Math.min(Math.max((value - from) / (to - from), 0), 1);

  return (
    <div>
      <div className="relative h-px bg-[var(--hairline)]">
        {ticks?.map((tick) => (
          <span
            key={tick.label}
            aria-hidden="true"
            className="absolute top-0 h-1.5 w-px bg-[var(--hairline)]"
            style={{ left: `${fraction(tick.at) * 100}%` }}
          />
        ))}
        {marks.map((mark) => (
          <span
            key={mark.label}
            aria-hidden="true"
            className="absolute -top-1.5 h-3.5 w-0.5"
            style={{
              left: `${fraction(mark.at) * 100}%`,
              background: TONES[mark.tone ?? "ink"],
            }}
          />
        ))}
      </div>

      <div
        className="relative mt-2"
        style={{ height: `${marks.length * 1.3}rem` }}
      >
        {marks.map((mark, tier) => {
          const at = fraction(mark.at);
          return (
            <span
              key={mark.label}
              className="absolute text-[var(--text-small)] leading-none whitespace-nowrap"
              style={{
                left: `${at * 100}%`,
                top: `${tier * 1.3}rem`,
                // Anchored in proportion to its own position, so a label at the
                // far right ends at the track's edge and one at the far left
                // starts there. It can never push the page wider.
                transform: `translateX(${-at * 100}%)`,
                color: TONES[mark.tone ?? "ink"],
              }}
            >
              <span className="measure">{mark.value}</span>{" "}
              <span className="text-ink-dim">{mark.label}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
