import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import average_precision_score, roc_auc_score

TOP_FRACTIONS = (0.01, 0.05, 0.10)


def random_forest(seed=0, **kwargs):
    params = dict(
        n_estimators=300,
        min_samples_leaf=2,
        n_jobs=-1,
        class_weight="balanced",
        random_state=seed,
    )
    params.update(kwargs)
    return RandomForestClassifier(**params)


def gradient_boosting(seed=0, scale_pos_weight=1.0, **kwargs):
    from xgboost import XGBClassifier

    params = dict(
        n_estimators=400,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.9,
        colsample_bytree=0.6,
        tree_method="hist",
        n_jobs=-1,
        eval_metric="logloss",
        random_state=seed,
        scale_pos_weight=scale_pos_weight,
    )
    params.update(kwargs)
    return XGBClassifier(**params)


def positive_weight(y):
    positives = float(np.sum(y))
    negatives = float(len(y) - positives)
    return negatives / positives if positives else 1.0


def precision_at(y_true, scores, fraction):
    n = max(1, int(round(fraction * len(scores))))
    order = np.argsort(-np.asarray(scores), kind="stable")[:n]
    return float(np.mean(np.asarray(y_true)[order]))


def enrichment_at(y_true, scores, fraction):
    base = float(np.mean(y_true))
    if base == 0:
        return float("nan")
    return precision_at(y_true, scores, fraction) / base


def evaluate(y_true, scores):
    out = {
        "auroc": roc_auc_score(y_true, scores),
        "average_precision": average_precision_score(y_true, scores),
        "base_rate": float(np.mean(y_true)),
        "n": int(len(y_true)),
    }
    for fraction in TOP_FRACTIONS:
        tag = f"{int(fraction * 100)}pct"
        out[f"precision_top_{tag}"] = precision_at(y_true, scores, fraction)
        out[f"enrichment_top_{tag}"] = enrichment_at(y_true, scores, fraction)
    return out


def bootstrap_metric(y_true, scores, metric, repeats=2000, seed=0):
    rng = np.random.default_rng(seed)
    y_true = np.asarray(y_true)
    scores = np.asarray(scores)
    values = []
    for _ in range(repeats):
        index = rng.integers(0, len(y_true), len(y_true))
        if len(np.unique(y_true[index])) < 2:
            continue
        values.append(metric(y_true[index], scores[index]))
    if not values:
        return (float("nan"), float("nan"))
    return (float(np.percentile(values, 2.5)), float(np.percentile(values, 97.5)))
