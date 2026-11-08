#!/usr/bin/env python3
"""Plot the biosynthetic pathway composition of the three shortlists.

Reads the committed shortlists in results/ and nothing else, so the figure
cannot disagree with the deliverable it describes. No raw download, no model,
no notebook run.

A compound is counted once for every pathway it is annotated with: LOTUS
writes multi-pathway compounds as "Polyketides $ Terpenoids", and both halves
are real. That is the same convention the deck's 30 / 21 / 19 counts use, so
the figure and the headline numbers agree by construction.

The classes are drawn in descending order of total count, deliberately not in
the order that flatters the argument. Polyketides come out second and almost
level across all three organisms, which is the part of this result that does
not support the headline and is therefore the part most worth showing.

    uv run python scripts/export_pathway_figure.py
"""
from __future__ import annotations

import collections
import sys
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "notebooks"))
from pipeline import viz  # noqa: E402

ORGANISMS = [
    ("staphylococcus_aureus", "S. aureus", "Gram-positive"),
    ("escherichia_coli", "E. coli", "Gram-negative"),
    ("mycobacterium_tuberculosis", "M. tuberculosis", "acid-fast"),
]
SEP = "$"


def memberships(path: Path) -> collections.Counter:
    """How many shortlisted compounds carry each pathway annotation."""
    counts = collections.Counter()
    for value in pd.read_csv(path)["np_pathway"].fillna(""):
        for part in (p.strip() for p in str(value).split(SEP)):
            if part:
                counts[part] += 1
    return counts


def main() -> int:
    results = ROOT / "results"
    tables = {
        label: memberships(results / f"shortlist_{slug}.csv")
        for slug, label, _ in ORGANISMS
    }
    classes = sorted(
        {k for t in tables.values() for k in t},
        key=lambda k: -sum(t[k] for t in tables.values()),
    )

    viz.use_style()
    fig, ax = plt.subplots(figsize=(10.6, 3.75))

    n = len(ORGANISMS)
    height = 0.78 / n
    for i, (_, label, envelope) in enumerate(ORGANISMS):
        offset = (i - (n - 1) / 2) * height
        ys = [j + offset for j in range(len(classes))]
        ax.barh(
            ys,
            [tables[label][c] for c in classes],
            height=height * 0.92,
            color=viz.SERIES[i],
            edgecolor=viz.SURFACE,
            linewidth=0.6,
            label=f"{label}  ({envelope})",
        )
        for y, c in zip(ys, classes):
            v = tables[label][c]
            if v:
                ax.text(v + 0.35, y, str(v), va="center", fontsize=7.6,
                        color=viz.INK_SECONDARY)

    ax.set_yticks(range(len(classes)), classes)
    ax.invert_yaxis()
    ax.grid(axis="y", visible=False)
    ax.spines["left"].set_visible(False)
    top = max(max(t.values()) for t in tables.values())
    ax.set_xlim(0, top * 1.13)
    # Counts are whole compounds, so a tick at 2.5 is meaningless.
    ax.set_xticks(range(0, top + 3, 5))
    ax.set_xlabel("shortlisted compounds carrying the annotation (50 per pathogen)")
    ax.legend(loc="lower right", fontsize=8.6)
    # An axes title, not a suptitle: viz.save reserves a band at the top of the
    # figure for a suptitle and then lifts the text above it, which leaves an
    # empty strip on a figure this short. The shared style already sets axes
    # titles bold and left-aligned.
    ax.set_title(
        "Biosynthetic pathways of the three shortlists, every annotation counted",
        fontsize=11,
    )

    path = viz.save(fig, "05_pathway_envelope")
    print(f"wrote {path}")
    for label in tables:
        total = sum(tables[label][c] for c in classes)
        print(f"  {label:<18} {total} annotations over 50 compounds")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
