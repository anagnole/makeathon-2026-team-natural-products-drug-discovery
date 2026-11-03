import argparse
import os
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "notebooks"))

from pipeline import viz  # noqa: E402

DATA = Path(os.environ.get("ETHNOHACK_DATA_DIR", ROOT / "data"))
EVALUABLE_FLOOR = 200

GRAM = {
    "staphylococcus_aureus": "Gram-positive",
    "bacillus_subtilis": "Gram-positive",
    "enterococcus_faecalis": "Gram-positive",
    "enterococcus_faecium": "Gram-positive",
    "escherichia_coli": "Gram-negative",
    "pseudomonas_aeruginosa": "Gram-negative",
    "klebsiella_pneumoniae": "Gram-negative",
    "acinetobacter_baumannii": "Gram-negative",
    "mycobacterium_tuberculosis": "Acid-fast",
}
GROUP_ORDER = ["Gram-positive", "Gram-negative", "Acid-fast"]
GROUP_COLOUR = dict(zip(GROUP_ORDER, viz.SERIES, strict=False))


def short_name(slug):
    genus, species = slug.split("_", 1)
    return f"{genus[0].upper()}. {species.replace('_', ' ')}"


def skeletons_of(smiles_values, cache):
    from rdkit import Chem, RDLogger

    RDLogger.DisableLog("rdApp.*")
    out = set()
    for smiles in smiles_values:
        if smiles not in cache:
            mol = Chem.MolFromSmiles(smiles)
            key = Chem.MolToInchiKey(mol) if mol is not None else None
            cache[smiles] = key.split("-")[0] if key else None
        if cache[smiles]:
            out.add(cache[smiles])
    return out


def plant_families(processed):
    occurrences = pd.read_parquet(
        processed / "01_plant_occurrences.parquet", columns=["structure_inchikey", "family"]
    ).dropna()
    skeleton = occurrences.structure_inchikey.str.split("-").str[0]
    return occurrences.assign(skeleton=skeleton).groupby("skeleton").family.agg(set)


def survey(raw, processed):
    families = plant_families(processed)
    single = {k: next(iter(v)) for k, v in families.items() if len(v) == 1}
    known = set(families.index)
    cache = {}
    rows = []
    for path in sorted(raw.glob("chembl_mic_*.parquet")):
        slug = path.stem[len("chembl_mic_") :]
        frame = pd.read_parquet(path, columns=["canonical_smiles"]).dropna()
        skeletons = skeletons_of(frame.canonical_smiles.unique(), cache)
        one_family = skeletons & set(single)
        rows.append(
            {
                "bacterium": short_name(slug),
                "group": GRAM.get(slug, "Unclassified"),
                "rows": len(frame),
                "compounds": len(skeletons),
                "plant": len(skeletons & known),
                "one_family": len(one_family),
                "families": len({single[k] for k in one_family}),
            }
        )
    return pd.DataFrame(rows).sort_values("one_family", ascending=False).reset_index(drop=True)


def figure(table):
    import matplotlib.pyplot as plt

    viz.use_style()
    fig, ax = plt.subplots(figsize=(7.4, 4.2))
    order = table.iloc[::-1]
    y = range(len(order))
    ax.barh(
        y,
        order.one_family,
        height=0.62,
        color=[GROUP_COLOUR[g] for g in order.group],
        edgecolor=viz.SURFACE,
        linewidth=2,
    )
    ax.set_yticks(list(y), order.bacterium)
    ax.grid(axis="y", visible=False)
    ax.spines["left"].set_visible(False)
    top = order.one_family.max()
    for i, value in enumerate(order.one_family):
        ax.text(
            value + top * 0.012,
            i,
            f"{value:,}",
            va="center",
            fontsize=8.5,
            color=viz.INK_SECONDARY,
            bbox={"facecolor": viz.SURFACE, "edgecolor": "none", "pad": 1.5},
        )
    ax.axvline(EVALUABLE_FLOOR, color=viz.MUTED, linewidth=1, linestyle=(0, (4, 3)), zorder=0)
    ax.text(
        EVALUABLE_FLOOR + top * 0.012,
        len(order) - 0.35,
        f"{EVALUABLE_FLOOR} compounds",
        fontsize=8,
        color=viz.MUTED,
    )
    ax.set_xlim(0, top * 1.14)
    ax.set_xlabel("plant compounds with exactly one reported plant family")
    ax.set_title("How much plant data each bacterial target actually has")
    handles = [
        plt.Line2D([], [], marker="s", markersize=8, linestyle="", color=GROUP_COLOUR[g], label=g)
        for g in GROUP_ORDER
        if (table.group == g).any()
    ]
    ax.legend(handles=handles, loc="lower right", fontsize=9)
    return fig


def main():
    parser = argparse.ArgumentParser(
        description="Count the usable plant-compound data behind every bacterial target in "
        "data/raw, grouped by Gram stain, and plot it. Targets below "
        f"{EVALUABLE_FLOOR} compounds cannot carry a plant-family split."
    )
    parser.add_argument("--data-dir", type=Path, default=DATA)
    parser.add_argument("--no-figure", action="store_true", help="print the table only")
    args = parser.parse_args()

    raw, processed = args.data_dir / "raw", args.data_dir / "processed"
    if not list(raw.glob("chembl_mic_*.parquet")):
        raise SystemExit(f"no chembl_mic_*.parquet in {raw}. Run scripts/fetch_chembl.py first.")

    table = survey(raw, processed)
    print(table.to_string(index=False))
    evaluable = table[table.one_family >= EVALUABLE_FLOOR]
    print(
        f"\n{len(evaluable)} of {len(table)} targets carry at least {EVALUABLE_FLOOR} plant "
        f"compounds from a single family, the floor below which a family-held-out split has "
        f"too few test compounds to score."
    )
    for group in GROUP_ORDER:
        part = evaluable[evaluable.group == group]
        if len(part):
            print(f"  {group}: {', '.join(part.bacterium)}")

    if not args.no_figure:
        print(f"\nfigure {viz.save(figure(table), '01_target_survey')}")


if __name__ == "__main__":
    main()
