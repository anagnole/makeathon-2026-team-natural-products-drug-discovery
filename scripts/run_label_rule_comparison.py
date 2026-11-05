import json
import pickle
import sys
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "notebooks"))

from pipeline import curation, data, featureset, labels, models  # noqa: E402

OUT = data.PROCESSED / "04_label_rule_comparison.json"


def run(organism, seed=0):
    slug = curation.slug(organism)
    payload = pickle.loads((data.PROCESSED / f"04_models_{slug}.pkl").read_bytes())
    feature_name, params = payload["feature_set"], payload["params"]

    bundle = featureset.load(f"03_features_{slug}")
    frame = pd.read_parquet(data.PROCESSED / f"03_splits_{slug}.parquet")
    part = {n: np.where(frame.partition.eq(n).to_numpy())[0]
            for n in ("train", "plant")}
    X = featureset.matrix(bundle, feature_name)
    skeletons = bundle["skeleton"]
    new_label = pd.Series(bundle["label"], index=skeletons)

    _, _, rows = curation.curate(organism, collapse="optimistic")
    old = labels.label_table(rows, "skeleton", "standard_relation", "value_um",
                             curation.PRIMARY_THRESHOLD_UM)
    old_label = pd.Series(old).reindex(skeletons)

    agree = (old_label.to_numpy() == new_label.to_numpy()) & old_label.notna().to_numpy()
    fixed = np.array([i for i in part["plant"] if agree[i]])

    y_old = np.where(np.isnan(old_label.to_numpy().astype(float)),
                     new_label.to_numpy(), old_label.to_numpy()).astype(int)
    y_new = new_label.to_numpy().astype(int)

    scores = {}
    for name, y in (("old rule", y_old), ("new rule", y_new)):
        model = models.random_forest(seed=seed, **params).fit(X[part["train"]], y[part["train"]])
        scores[name] = model.predict_proba(X[fixed])[:, 1]

    truth = y_new[fixed]
    rng = np.random.default_rng(seed)
    diffs = []
    for _ in range(1000):
        index = rng.integers(0, len(truth), len(truth))
        if len(np.unique(truth[index])) < 2:
            continue
        diffs.append(models.roc_auc_score(truth[index], scores["new rule"][index])
                     - models.roc_auc_score(truth[index], scores["old rule"][index]))
    del X
    return {
        "organism": organism,
        "plant holdout": int(len(part["plant"])),
        "labels agree under both rules": int(len(fixed)),
        "share agreeing": float(len(fixed) / len(part["plant"])),
        "base rate on the fixed set": float(np.mean(truth)),
        "auroc, trained on old rule": models.roc_auc_score(truth, scores["old rule"]),
        "auroc, trained on new rule": models.roc_auc_score(truth, scores["new rule"]),
        "paired difference": float(np.mean(diffs)),
        "95% lo": float(np.percentile(diffs, 2.5)),
        "95% hi": float(np.percentile(diffs, 97.5)),
    }


def main():
    results = {}
    for organism in curation.PATHOGENS:
        print(f"{organism} ...", flush=True)
        results[organism] = run(organism)
        r = results[organism]
        print(f"  fixed set {r['labels agree under both rules']:,} of "
              f"{r['plant holdout']:,} ({r['share agreeing']:.1%}); "
              f"old {r['auroc, trained on old rule']:.4f} new "
              f"{r['auroc, trained on new rule']:.4f} "
              f"diff {r['paired difference']:+.4f} "
              f"[{r['95% lo']:+.4f}, {r['95% hi']:+.4f}]", flush=True)
        OUT.write_text(json.dumps(results, indent=2))
    print(f"\nwrote {OUT}")


if __name__ == "__main__":
    main()
