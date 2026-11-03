"""Compare a random, a scaffold and a plant-family split on the same compounds.

This is the measurement the proposal rests on. One task (Staphylococcus aureus MIC), one set of
compounds, one model, three ways of deciding what counts as held out. Prints the scores and,
next to them, how much of the test chemistry the model had already seen, which is what makes the
family result interpretable rather than just lower.

Labels come from ChEMBL and the plant families from LOTUS, cross-checked against GBIF. Needs the
downloads and notebook 01:

    uv run python scripts/fetch_chembl.py MIC
    uv run python scripts/fetch_lotus.py
    uv run python scripts/fetch_taxonomy.py
    uv run jupyter nbconvert --to notebook --execute --inplace notebooks/01_data.ipynb
"""

import argparse
import statistics
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import roc_auc_score

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "notebooks"))

from pipeline import data, features, labels, ledger, splits  # noqa: E402

PLANT_OCCURRENCES = "01_plant_occurrences.parquet"
STRUCTURES = "01_structures.parquet"


def slug(organism):
    return organism.lower().replace(" ", "_")


def inchikey_map(smiles):
    """SMILES to InChIKey, reusing notebook 01's table and computing only what it misses."""
    path = data.PROCESSED / STRUCTURES
    known = {}
    if path.exists():
        saved = pd.read_parquet(path, columns=["canonical_smiles", "inchikey"]).dropna()
        known = dict(zip(saved.canonical_smiles, saved.inchikey, strict=False))
    missing = [s for s in smiles if s not in known]
    if missing:
        print(f"  computing {len(missing):,} InChIKeys not in {STRUCTURES}")
        known.update(dict(zip(missing, data.inchikeys(missing), strict=False)))
    return known


def load_activity(organism, standard_type):
    """MIC rows for one bacterium, with an InChIKey skeleton and a micromolar value per row."""
    path = data.RAW / f"chembl_{standard_type}_{slug(organism)}.parquet"
    if not path.exists():
        raise SystemExit(f"{path} missing. Run scripts/fetch_chembl.py {standard_type.upper()}.")
    frame = pd.read_parquet(
        path,
        columns=["canonical_smiles", "standard_relation", "standard_value", "standard_units"],
    ).dropna(subset=["canonical_smiles", "standard_value"])
    frame["standard_value"] = pd.to_numeric(frame.standard_value, errors="coerce")
    frame = frame.dropna(subset=["standard_value"])

    unique = frame.canonical_smiles.unique()
    print(f"{organism}: {len(frame):,} MIC rows, {len(unique):,} structures")
    inchikey = inchikey_map(unique)
    weight = {s: labels.mol_weight_from_smiles(s) for s in unique}

    frame["skeleton"] = [features.skeleton(inchikey.get(s)) for s in frame.canonical_smiles]
    frame["value_um"] = [
        labels.to_micromolar(value, unit, weight.get(smiles))
        for smiles, value, unit in zip(
            frame.canonical_smiles, frame.standard_value, frame.standard_units, strict=False
        )
    ]
    lost = frame.value_um.isna().sum()
    print(f"{organism}: {lost:,} rows unconvertible ({lost / len(frame):.1%})")
    return frame.dropna(subset=["skeleton", "value_um"])


def load_plant_families():
    """InChIKey skeleton -> set of plant families LOTUS reports it from."""
    path = data.PROCESSED / PLANT_OCCURRENCES
    if not path.exists():
        raise SystemExit(f"{path} missing. Run notebook 01 first; notebooks/README.md says how.")
    occurrences = pd.read_parquet(
        path, columns=["structure_inchikey", "structure_smiles", "family"]
    ).dropna(subset=["structure_inchikey", "family"])
    occurrences["skeleton"] = occurrences.structure_inchikey.str.split("-").str[0]
    return occurrences


def build_dataset(organism, standard_type, threshold_um):
    activity = load_activity(organism, standard_type)
    label_of = labels.label_table(
        activity, "skeleton", "standard_relation", "value_um", threshold_um
    )
    occurrences = load_plant_families()
    families = occurrences.groupby("skeleton").family.agg(set)
    single = {k: next(iter(v)) for k, v in families.items() if len(v) == 1}
    smiles_of = dict(zip(activity.skeleton, activity.canonical_smiles, strict=False))
    records = [(k, smiles_of[k], k) for k in label_of if k in single]
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
    parser.add_argument("--organism", default="Staphylococcus aureus")
    parser.add_argument("--standard-type", default="mic", help="which ChEMBL readout to read")
    parser.add_argument("--threshold", type=float, default=32.0, help="active at or below, in uM")
    parser.add_argument("--repeats", type=int, default=10)
    parser.add_argument("--note", default="random vs scaffold vs plant-family split")
    parser.add_argument("--no-ledger", action="store_true", help="skip the results/ ledger entry")
    args = parser.parse_args()

    rows = build_dataset(args.organism, args.standard_type, args.threshold)
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

    paired = [f - s for f, s in zip(results["family"], results["scaffold"], strict=False)]
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

    if args.no_ledger:
        return
    config = {
        "task": f"{args.organism} MIC",
        "threshold_um": args.threshold,
        "label_source": "ChEMBL MIC, plant families from LOTUS cross-checked against GBIF",
        "compounds": "plant-derived, exactly one reported family, deduplicated by InChIKey skeleton",
        "features": f"Morgan r={features.FINGERPRINT_RADIUS} bits={features.FINGERPRINT_BITS}",
        "model": "RandomForestClassifier(500, min_samples_leaf=2, class_weight=balanced)",
        "repeats": args.repeats,
        "test_fraction": 0.2,
    }
    metrics = {"n_compounds": n, "positive_rate": positives / n}
    for name in ("random", "scaffold", "family"):
        if results[name]:
            metrics[f"auroc_{name}"] = statistics.mean(results[name])
            metrics[f"auroc_{name}_sd"] = statistics.pstdev(results[name])
            metrics[f"seen_scaffolds_{name}"] = statistics.mean(seen[name])
    if paired:
        metrics["family_minus_scaffold"] = statistics.mean(paired)
        metrics["family_worse_repeats"] = sum(1 for d in paired if d < 0)
    entry = ledger.record("split_comparison", config, metrics, note=args.note)
    print(f"\nledger entry {entry['id']} (config {entry['config_hash']})")


if __name__ == "__main__":
    main()
