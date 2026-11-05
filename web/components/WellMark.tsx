import type { Compound } from "@/lib/data";

/**
 * A well. Two independent physical channels, both native to the assay:
 * the liquid level is the nearest-training Tanimoto, and its turbidity is the
 * predicted probability. The line across every well is the applicability-domain
 * cutoff, so a well whose liquid stops below the line was read as out of range.
 */
export default function WellMark({
  compound,
  column,
}: {
  compound: Compound | null;
  column: number;
}) {
  if (!compound) {
    return (
      <div
        className="well well-empty"
        style={{ "--col": column } as React.CSSProperties}
      />
    );
  }

  const classes = [
    "well",
    compound.tier === "exploratory" ? "well-struck" : "",
    compound.twin ? "well-twin" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      style={
        {
          "--level": compound.tanimoto,
          "--turbidity": 1 - compound.probability,
          "--col": column,
        } as React.CSSProperties
      }
    >
      <div className="well-liquid" />
    </div>
  );
}
