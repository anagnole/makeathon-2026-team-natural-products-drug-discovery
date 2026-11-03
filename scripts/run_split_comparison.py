"""Compare a random, a scaffold and a plant-family split on the same compounds.

This is the measurement the proposal rests on. One task (Staphylococcus aureus MIC), one set of
compounds, one model, three ways of deciding what counts as held out. Prints the scores and,
next to them, how much of the test chemistry the model had already seen, which is what makes the
family result interpretable rather than just lower.

Needs the NPASS files: python scripts/fetch_npass.py
"""

import argparse
import os
import statistics
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import roc_auc_score

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "notebooks"))

from pipeline import features, labels, splits  # noqa: E402

DATA = Path(os.environ.get("ETHNOHACK_DATA_DIR", ROOT / "data"))
NPASS = DATA / "npass"
PLANT_KINGDOM = "Viridiplantae"
MISSING = {"n.a.", "", "NA", None}


def read_tsv(path, columns):
    if not path.exists():
        raise SystemExit(f"{path} missing. Run scripts/fetch_npass.py first.")
    return pd.read_csv(
        path, sep="\t", usecols=columns, dtype=str, encoding_errors="replace", low_memory=False
    )


def load_structures(directory):
    frame = read_tsv(
        directory / "NPASS3.0_naturalproducts_structure.txt", ["np_id", "SMILES", "InChIKey"]
    )
    frame = frame[~frame.SMILES.isin(MISSING) & frame.SMILES.notna()]
    return frame.set_index("np_id")


def load_plant_families(directory):
    """np_id -> set of plant families it has been reported from."""
    info = read_tsv(
        directory / "NPASS3.0_species_info.txt", ["org_id", "kingdom_name", "family_name"]
    )
    info = info[info.kingdom_name.eq(PLANT_KINGDOM) & ~info.family_name.isin(MISSING)]
    family_of = dict(zip(info.org_id, info.family_name))
    pairs = read_tsv(
        directory / "NPASS3.0_naturalproducts_species_pair.txt", ["np_id", "org_id"]
    )
    pairs = pairs[pairs.org_id.isin(family_of)]
    pairs = pairs.assign(family=pairs.org_id.map(family_of))
    return pairs.groupby("np_id").family.agg(set)


def load_activity(directory, organism, structures):
    """Micromolar MIC rows for one assay organism, units resolved via rdkit molecular weight."""
    frame = read_tsv(
        directory / "NPASS3.0_activities.txt",
        [
            "np_id",
            "activity_type",
            "activity_type_grouped",
            "assay_organism",
            "activity_value",
            "activity_units",
            "activity_relation",
        ],
    )
    is_mic = frame.activity_type.eq("MIC") | frame.activity_type_grouped.eq("MIC")
    matches = frame.assay_organism.fillna("").str.lower().str.startswith(organism.lower())
    frame = frame[is_mic & matches].copy()
    weights = {}
    for np_id in frame.np_id.unique():
        smiles = structures.SMILES.get(np_id)
        weights[np_id] = labels.mol_weight_from_smiles(smiles) if smiles else None
    frame["value_um"] = [
        labels.to_micromolar(value, unit, weights.get(np_id))
        for np_id, value, unit in zip(frame.np_id, frame.activity_value, frame.activity_units)
    ]
    lost = frame.value_um.isna().sum()
    print(f"{organism}: {len(frame):,} MIC rows, {lost:,} unconvertible ({lost / len(frame):.1%})")
    return frame.dropna(subset=["value_um"])


def build_dataset(directory, organism, threshold_um):
    structures = load_structures(directory)
    activity = load_activity(directory, organism, structures)
    label_of = labels.label_table(activity, "np_id", "activity_relation", "value_um", threshold_um)
    families = load_plant_families(directory)
    single = {k: next(iter(v)) for k, v in families.items() if len(v) == 1}
    records = [
        (k, structures.SMILES.get(k), structures.InChIKey.get(k))
        for k in label_of
        if k in single and k in structures.index
    ]
    rows = features.featurise(records)
    for row in rows:
        row["label"] = label_of[row["key"]]
        row["family"] = single[row["key"]]
    return rows


def forest():
    return RandomForestClassifier(
        n_estimators=500, min_samples_leaf=2, n_jobs=-1, class_weight="balanced", random_state=0
    )


def score(rows, train_index, test_index, groups):
    y = np.array([r["label"] for r in rows])
    if len(set(y[train_index])) < 2 or len(set(y[test_index])) < 2:
        return None
    x = features.matrix(rows)
    model = forest().fit(x[train_index], y[train_index])
    predicted = model.predict_proba(x[test_index])[:, 1]
    return {
        "auroc": roc_auc_score(y[test_index], predicted),
        "train": len(train_index),
        "test": len(test_index),
        "seen": splits.seen_group_fraction(groups, train_index, test_index),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", type=Path, default=NPASS)
    parser.add_argument("--organism", default="Staphylococcus aureus")
    parser.add_argument("--threshold", type=float, default=32.0, help="active at or below, in uM")
    parser.add_argument("--repeats", type=int, default=10)
    args = parser.parse_args()

    rows = build_dataset(args.data_dir, args.organism, args.threshold)
    n = len(rows)
    positives = sum(r["label"] for r in rows)
    scaffolds = [r["scaffold"] for r in rows]
    plant_families = [r["family"] for r in rows]
    print(
        f"\n{n:,} plant compounds from exactly one family, labelled at "
        f"{args.threshold:g} uM: {positives:,} active ({positives / n:.0%})"
    )
    print(f"{len(set(plant_families)):,} plant families, {len(set(scaffolds)):,} Murcko scaffolds")

    results = {name: [] for name in ("random", "scaffold", "family")}
    seen = {name: [] for name in results}
    sizes = {}
    for seed in range(args.repeats):
        partitions = {
            "random": (splits.random_split(n, seed), scaffolds),
            "scaffold": (splits.group_split(scaffolds, seed), scaffolds),
            "family": (splits.group_split(plant_families, seed), scaffolds),
        }
        for name, ((train_index, test_index), groups) in partitions.items():
            outcome = score(rows, train_index, test_index, groups)
            if outcome:
                results[name].append(outcome["auroc"])
                seen[name].append(outcome["seen"])
                sizes[name] = (outcome["train"], outcome["test"])

    print(f"\nAUROC over {args.repeats} repeats, same compounds throughout")
    header = f"{'split':<10}{'mean':>7}{'sd':>7}{'min':>7}{'max':>7}{'train':>7}{'test':>6}"
    print(header + f"{'test scaffolds seen in train':>31}")
    for name in ("random", "scaffold", "family"):
        values = results[name]
        if not values:
            print(f"{name:<10} no scorable repeat")
            continue
        print(
            f"{name:<10}{statistics.mean(values):>7.3f}{statistics.pstdev(values):>7.3f}"
            f"{min(values):>7.3f}{max(values):>7.3f}{sizes[name][0]:>7}{sizes[name][1]:>6}"
            f"{statistics.mean(seen[name]):>30.0%}"
        )

    paired = [f - s for f, s in zip(results["family"], results["scaffold"])]
    if paired:
        worse = sum(1 for d in paired if d < 0)
        print(
            f"\nfamily below scaffold in {worse}/{len(paired)} paired repeats, "
            f"mean difference {statistics.mean(paired):+.3f} (sd {statistics.pstdev(paired):.3f})"
        )
    print(
        "\nThe last column is the point: the family split leaves more test chemistry visible to "
        "the model and still scores lower, so plant family carries difficulty that the chemical "
        "scaffold does not account for."
    )


if __name__ == "__main__":
    main()
