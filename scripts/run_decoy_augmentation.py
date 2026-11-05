import argparse
import json
import pickle
import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "notebooks"))

from pipeline import curation, data, featureset, models  # noqa: E402

OUT = data.PROCESSED / "04_decoy_augmentation.json"


def screening_pool(labelled_skeletons):
    plant = pd.read_parquet(
        data.PROCESSED / "01_plant_structures.parquet",
        columns=["structure_inchikey", "structure_smiles"],
    ).dropna(subset=["structure_smiles"])
    keys = data.canonical_skeleton_map(list(plant.structure_smiles.unique()), show_progress=False)
    plant["skeleton"] = plant.structure_smiles.map(keys)
    plant = plant.dropna(subset=["skeleton"])
    plant["length"] = plant.structure_smiles.str.len()
    plant = plant.sort_values(["skeleton", "length"]).drop_duplicates("skeleton")
    return plant[~plant.skeleton.isin(labelled_skeletons)].reset_index(drop=True)


def evaluate(model, X, y, index, threshold_source):
    scores = model.predict_proba(X[index])[:, 1]
    truth = y[index]
    validation_scores = model.predict_proba(X[threshold_source[0]])[:, 1]
    threshold, rule = models.choose_threshold(
        y[threshold_source[0]], validation_scores, recall_floor=0.40
    )
    at_threshold = models.threshold_metrics(truth, scores, threshold)
    return {
        "auroc": models.roc_auc_score(truth, scores),
        "p_at_10pct": models.precision_at(truth, scores, 0.10),
        "precision_at_floor": at_threshold["precision"],
        "recall_at_floor": at_threshold["recall"],
        "flagged_at_floor": at_threshold["flagged"],
        "threshold_rule": rule,
    }


def run(organism, ratios, seed=0):
    slug = curation.slug(organism)
    payload = pickle.loads((data.PROCESSED / f"04_models_{slug}.pkl").read_bytes())
    feature_name, params = payload["feature_set"], payload["params"]

    bundle = featureset.load(f"03_features_{slug}")
    splits_frame = pd.read_parquet(data.PROCESSED / f"03_splits_{slug}.parquet")
    part = {
        name: np.where(splits_frame.partition.eq(name).to_numpy())[0]
        for name in ("train", "validation", "test", "plant")
    }
    X = featureset.matrix(bundle, feature_name)
    y = bundle["label"].astype(int)

    labelled = set(bundle["skeleton"])
    holdout = set(bundle["skeleton"][part["plant"]])
    pool = screening_pool(labelled)
    assert not (set(pool.skeleton) & labelled), "a decoy shares a skeleton with a labelled compound"
    assert not (set(pool.skeleton) & holdout), "a decoy shares a skeleton with the plant holdout"

    measured_negatives = int((y[part["train"]] == 0).sum())
    results = {
        "organism": organism, "feature_set": feature_name, "params": params,
        "measured_negatives_in_train": measured_negatives,
        "measured_positives_in_train": int((y[part["train"]] == 1).sum()),
        "screening_pool": len(pool),
        "assumption": (
            "every decoy is labelled inactive. Our plant holdout, the closest measurement we "
            "have of plant compounds, is 15.6% to 32.8% active, inflated by publication bias; "
            "the true rate among unmeasured plant compounds is lower and unknown. At high "
            "ratios even a few percent of genuine actives mislabelled adds thousands of false "
            "negatives to the class the model is being taught."
        ),
        "threshold_note": (
            "each arm recomputes its operating threshold from its own validation scores, "
            "because a threshold from a different model does not transfer"
        ),
        "arms": {},
    }

    baseline = models.random_forest(seed=seed, **params).fit(X[part["train"]], y[part["train"]])
    results["arms"]["baseline"] = evaluate(
        baseline, X, y, part["plant"], (part["validation"],))
    print(f"  baseline plant P@10% {results['arms']['baseline']['p_at_10pct']:.3f}", flush=True)

    rng = np.random.default_rng(seed)
    for ratio in ratios:
        wanted = min(len(pool), ratio * measured_negatives)
        picked = pool.iloc[rng.choice(len(pool), wanted, replace=False)]
        decoy_table = pd.DataFrame({
            "skeleton": picked.skeleton.to_numpy(),
            "canonical_smiles": picked.structure_smiles.to_numpy(),
            "label": np.zeros(len(picked), dtype=int),
            "from_plant": True, "family": np.nan,
        })
        start = time.time()
        decoy_bundle = featureset.build(decoy_table, show_progress=False)
        decoy_X = featureset.matrix(decoy_bundle, feature_name)
        X_aug = np.vstack([X[part["train"]], decoy_X])
        y_aug = np.concatenate([y[part["train"]], np.zeros(len(decoy_X), dtype=int)])

        for arm in ("plain", "reweighted"):
            if arm == "plain":
                weights = None
            else:
                # hold the negative class mass at its pre-augmentation total, so the only
                # thing that changes against the baseline is which chemistry the negatives
                # cover, not how much the negative class weighs overall
                scale = measured_negatives / max(1, int((y_aug == 0).sum()))
                weights = np.where(y_aug == 0, scale, 1.0)
            model = models.random_forest(seed=seed, **params).fit(
                X_aug, y_aug, sample_weight=weights)
            scored = evaluate(model, X, y, part["plant"], (part["validation"],))
            scored.update({"decoys": int(len(decoy_X)),
                           "seconds": round(time.time() - start, 1)})
            key = f"decoys_x{ratio}" + ("" if arm == "plain" else "_reweighted")
            results["arms"][key] = scored
            print(f"  x{ratio} {arm:10s}: {len(decoy_X):,} decoys, "
                  f"plant P@10% {scored['p_at_10pct']:.3f} "
                  f"AUROC {scored['auroc']:.3f}", flush=True)
        del X_aug, y_aug, decoy_X
    del X
    return results


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--organisms", nargs="*", default=curation.PATHOGENS)
    parser.add_argument("--ratios", nargs="*", type=int, default=[1, 5])
    parser.add_argument("--seed", type=int, default=0)
    args = parser.parse_args()

    everything = json.loads(OUT.read_text()) if OUT.exists() else {}
    for organism in args.organisms:
        print(f"{organism}", flush=True)
        everything[organism] = run(organism, args.ratios, args.seed)
        OUT.write_text(json.dumps(everything, indent=2))
    print(f"\nwrote {OUT}")


if __name__ == "__main__":
    main()
