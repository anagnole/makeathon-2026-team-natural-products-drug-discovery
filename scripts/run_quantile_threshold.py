import json
import pickle
import sys
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "notebooks"))

from pipeline import curation, data, featureset, ledger, models  # noqa: E402

OUT = data.PROCESSED / "04_quantile_threshold.json"
QUANTILES = [0.0005, 0.001, 0.005, 0.01]


def screening_scores(organism):
    slug = curation.slug(organism)
    payload = pickle.loads((data.PROCESSED / f"04_models_{slug}.pkl").read_bytes())
    plant = pd.read_parquet(
        data.PROCESSED / "01_plant_structures.parquet",
        columns=["structure_smiles"]).dropna()
    keys = data.canonical_skeleton_map(list(plant.structure_smiles.unique()),
                                       show_progress=False)
    plant["skeleton"] = plant.structure_smiles.map(keys)
    plant = plant.dropna(subset=["skeleton"]).drop_duplicates("skeleton")
    labelled = set(pd.read_parquet(
        data.PROCESSED / f"02_labelled_{slug}.parquet", columns=["skeleton"]).skeleton)
    plant = plant[~plant.skeleton.isin(labelled)]
    table = plant.rename(columns={"structure_smiles": "canonical_smiles"})[
        ["skeleton", "canonical_smiles"]].assign(label=-1, from_plant=True, family=np.nan)
    bundle = featureset.build(table, show_progress=False)
    X = featureset.matrix(bundle, payload["feature_set"])
    return payload, payload["calibrator"].predict_proba(X)[:, 1]


def run(organism, seed=0):
    slug = curation.slug(organism)
    payload, screen = screening_scores(organism)
    scored = pd.read_parquet(data.PROCESSED / f"04_scores_{slug}_plant.parquet")
    truth = scored.label.to_numpy()
    probability = scored.score_calibrated.to_numpy()

    absolute = float(payload["threshold"])
    rule = payload.get("threshold_rule", "")
    rows = [{
        "rule": f"absolute probability, chosen on {payload.get('threshold_partition', '?')}"
                " with a 0.40 recall floor",
        "threshold": float(absolute),
        "nominations from the screening set": int((screen >= absolute).sum()),
        **{k: v for k, v in models.threshold_metrics(truth, probability, absolute).items()
           if k != "threshold"},
    }]
    for q in QUANTILES:
        cut = float(np.quantile(screen, 1 - q))
        metrics = models.threshold_metrics(truth, probability, cut)
        rows.append({
            "rule": f"top {q * 100:g}% of the screening-set score distribution",
            "threshold": cut,
            "nominations from the screening set": int(round(q * len(screen))),
            **{k: v for k, v in metrics.items() if k != "threshold"},
        })
    frame = pd.DataFrame(rows)
    ledger.record(
        f"quantile_threshold_{slug}",
        {"task": f"{organism} MIC, whole organism",
         "absolute_rule": rule, "quantiles": QUANTILES,
         "screening_compounds": int(len(screen))},
        {"absolute_threshold": float(absolute),
         "absolute_recall_on_plant": float(frame.iloc[0].recall),
         "absolute_precision_on_plant": float(frame.iloc[0].precision),
         **{f"recall_top_{q * 100:g}pct": float(frame.iloc[i + 1].recall)
            for i, q in enumerate(QUANTILES)},
         **{f"precision_top_{q * 100:g}pct": float(frame.iloc[i + 1].precision)
            for i, q in enumerate(QUANTILES)}},
        note="quantile operating point against the absolute threshold",
    )
    return {"organism": organism, "screening_compounds": int(len(screen)),
            "plant_base_rate": float(truth.mean()), "rows": frame.to_dict("records")}


def main():
    everything = json.loads(OUT.read_text()) if OUT.exists() else {}
    for organism in curation.PATHOGENS:
        print(f"{organism} ...", flush=True)
        result = run(organism)
        everything[organism] = result
        OUT.write_text(json.dumps(everything, indent=2))
        for row in result["rows"]:
            print(f"  {row['rule'][:52]:54s} nominate {row['nominations from the screening set']:>6,}"
                  f"  plant precision {row['precision']:.3f} recall {row['recall']:.3f}", flush=True)
    print(f"\nwrote {OUT}")


if __name__ == "__main__":
    main()
