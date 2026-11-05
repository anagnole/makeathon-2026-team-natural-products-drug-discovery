import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "notebooks"))

from pipeline import curation, data, featureset, ledger, models  # noqa: E402

OUT = data.PROCESSED / "04_knn_baseline.json"
K_GRID = [1, 3, 5, 10, 25, 50]


def tanimoto(query, reference, chunk=2000):
    out = np.zeros((len(query), len(reference)), dtype=np.float32)
    for start in range(0, len(reference), chunk):
        block = reference[start:start + chunk]
        inter = query @ block.T
        union = query.sum(1)[:, None] + block.sum(1)[None, :] - inter
        out[:, start:start + chunk] = inter / np.maximum(union, 1)
    return out


def knn_scores(similarity, train_labels, k):
    order = np.argsort(-similarity, axis=1)[:, :k]
    rows = np.arange(len(similarity))[:, None]
    weights = similarity[rows, order]
    votes = train_labels[order]
    total = weights.sum(axis=1)
    return np.where(total > 0, (weights * votes).sum(axis=1) / np.maximum(total, 1e-9),
                    votes.mean(axis=1))


def run(organism, seed=0):
    slug = curation.slug(organism)
    bundle = featureset.load(f"03_features_{slug}")
    frame = pd.read_parquet(data.PROCESSED / f"03_splits_{slug}.parquet")
    part = {n: np.where(frame.partition.eq(n).to_numpy())[0]
            for n in ("train", "validation", "plant")}
    morgan = featureset.unpack_morgan(bundle["morgan"])
    y = bundle["label"].astype(int)
    train_labels = y[part["train"]]

    # k is chosen on validation, never on the holdout
    validation_similarity = tanimoto(morgan[part["validation"]], morgan[part["train"]])
    chosen_k, best = None, -np.inf
    validation_curve = {}
    for k in K_GRID:
        scores = knn_scores(validation_similarity, train_labels, k)
        auroc = models.roc_auc_score(y[part["validation"]], scores)
        validation_curve[k] = float(auroc)
        if auroc > best:
            chosen_k, best = k, auroc
    del validation_similarity

    plant_similarity = tanimoto(morgan[part["plant"]], morgan[part["train"]])
    truth = y[part["plant"]]
    variants = {
        "1-nearest neighbour": knn_scores(plant_similarity, train_labels, 1),
        f"weighted kNN (k={chosen_k}, chosen on validation)":
            knn_scores(plant_similarity, train_labels, chosen_k),
    }
    del plant_similarity, morgan

    model_scores = pd.read_parquet(
        data.PROCESSED / f"04_scores_{slug}_plant.parquet").score.to_numpy()

    result = {
        "organism": organism,
        "k chosen on validation": chosen_k,
        "validation auroc by k": validation_curve,
        "plant compounds": int(len(truth)),
        "plant base rate": float(truth.mean()),
        "model": {
            "auroc": models.roc_auc_score(truth, model_scores),
            "p_at_10pct": models.precision_at(truth, model_scores, 0.10),
        },
        "baselines": {},
    }
    rng = np.random.default_rng(seed)
    resamples = [rng.integers(0, len(truth), len(truth)) for _ in range(1000)]
    for name, scores in variants.items():
        diffs_auroc, diffs_p10 = [], []
        for index in resamples:
            if len(np.unique(truth[index])) < 2:
                continue
            diffs_auroc.append(models.roc_auc_score(truth[index], model_scores[index])
                               - models.roc_auc_score(truth[index], scores[index]))
            diffs_p10.append(models.precision_at(truth[index], model_scores[index], 0.10)
                             - models.precision_at(truth[index], scores[index], 0.10))
        result["baselines"][name] = {
            "auroc": models.roc_auc_score(truth, scores),
            "p_at_10pct": models.precision_at(truth, scores, 0.10),
            "model minus baseline, auroc": float(np.mean(diffs_auroc)),
            "auroc 95% lo": float(np.percentile(diffs_auroc, 2.5)),
            "auroc 95% hi": float(np.percentile(diffs_auroc, 97.5)),
            "model minus baseline, p@10%": float(np.mean(diffs_p10)),
            "p10 95% lo": float(np.percentile(diffs_p10, 2.5)),
            "p10 95% hi": float(np.percentile(diffs_p10, 97.5)),
        }
    return result


def main():
    everything = json.loads(OUT.read_text()) if OUT.exists() else {}
    for organism in curation.PATHOGENS:
        print(f"{organism} ...", flush=True)
        result = run(organism)
        everything[organism] = result
        OUT.write_text(json.dumps(everything, indent=2))
        print(f"  k={result['k chosen on validation']}  model {result['model']['auroc']:.4f}",
              flush=True)
        for name, payload in result["baselines"].items():
            print(f"    {name:46s} {payload['auroc']:.4f}  "
                  f"model-baseline {payload['model minus baseline, auroc']:+.4f} "
                  f"[{payload['auroc 95% lo']:+.4f}, {payload['auroc 95% hi']:+.4f}]", flush=True)
        ledger.record(
            f"knn_baseline_{curation.slug(organism)}",
            {"task": f"{organism} MIC, whole organism",
             "baseline": "Tanimoto nearest neighbour over the training partition",
             "k_grid": K_GRID, "k_selected_on": "validation partition"},
            {"k": result["k chosen on validation"],
             "plant_base_rate": result["plant base rate"],
             "model_auroc": result["model"]["auroc"],
             **{f"{n[:18]}_auroc": v["auroc"] for n, v in result["baselines"].items()}},
            note="nearest-neighbour baseline against the tuned model",
        )
    print(f"\nwrote {OUT}")


if __name__ == "__main__":
    main()
