"""Refit the three final models exactly as notebook 04 does and save what a predictor needs.

Notebook 04 writes the fitted models to data/processed/04_models_<organism>.pkl, which is
large and not in git. This script rebuilds them from the committed ledger (feature set and
tuned parameters per organism), the processed features and the cluster-level splits, and
checks the refit against the ledger's plant-holdout AUROC before writing anything, so the
served model is the reported one and not a lookalike.

Output, per organism, in data/processed/serving/:
  <slug>.joblib   model, Platt calibrator, feature set, decision threshold, applicability
                  domain cutoff and the training fingerprints the cutoff is measured against.

Run:  .venv/bin/python scripts/export_predictor.py [slug ...]
"""

import json
import sys
import time
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.frozen import FrozenEstimator
from sklearn.metrics import roc_auc_score

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "notebooks"))
from pipeline import curation, data, featureset, models  # noqa: E402

OUT = data.PROCESSED / "serving"
AD_CUTOFF = 0.328358  # notebook 05: 25th percentile of plant-holdout nearest-neighbour Tanimoto
TOLERANCE = 0.005


def latest_runs():
    runs = {}
    for line in (ROOT / "results" / "runs.jsonl").read_text().splitlines():
        entry = json.loads(line)
        if entry["run"].startswith("model_"):
            runs[entry["run"].removeprefix("model_")] = entry
    return runs


def export(organism, entry):
    slug = curation.slug(organism)
    config, reported = entry["config"], entry["metrics"]
    feature_name, params = config["feature_set"], config["params"]
    assert config["model"] == "random_forest", "only the forest is served"

    bundle = featureset.load(f"03_features_{slug}")
    frame = pd.read_parquet(data.PROCESSED / f"03_splits_{slug}.parquet")
    assert list(frame.skeleton) == list(bundle["skeleton"])
    part = {n: np.where(frame.partition.eq(n).to_numpy())[0]
            for n in ("train", "validation", "test", "plant")}
    y = bundle["label"]
    X = featureset.matrices(bundle, feature_name)[feature_name]

    start = time.time()
    model = models.random_forest(seed=0, **params)
    model.fit(X[part["train"]], y[part["train"]])
    calibrator = CalibratedClassifierCV(FrozenEstimator(model), method="sigmoid")
    calibrator.fit(X[part["validation"]], y[part["validation"]])

    plant = roc_auc_score(y[part["plant"]],
                          model.predict_proba(X[part["plant"]])[:, 1])
    drift = abs(plant - reported["plant_auroc"])
    print(f"{organism}: refit in {time.time() - start:.0f}s, plant AUROC {plant:.4f} "
          f"vs ledger {reported['plant_auroc']:.4f} (drift {drift:.4f})", flush=True)
    if drift > TOLERANCE:
        raise SystemExit(f"{organism}: refit does not reproduce the ledger; not writing")

    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{slug}.joblib"
    joblib.dump({
        "organism": organism,
        "feature_set": feature_name,
        "model": model,
        "calibrator": calibrator,
        "threshold": float(reported["threshold"]),
        "ad_cutoff": AD_CUTOFF,
        "train_morgan": bundle["morgan"][part["train"]],
        "metrics": {k: reported[k] for k in (
            "plant_auroc", "plant_auroc_lo", "plant_auroc_hi", "plant_base_rate",
            "plant_p_at_10pct", "plant_precision_at_threshold", "test_auroc")},
    }, path, compress=3)
    print(f"  wrote {path.relative_to(ROOT)} ({path.stat().st_size / 1e6:.0f} MB)", flush=True)


if __name__ == "__main__":
    wanted = set(sys.argv[1:])
    for organism in curation.PATHOGENS:
        if wanted and curation.slug(organism) not in wanted:
            continue
        export(organism, latest_runs()[curation.slug(organism)])
