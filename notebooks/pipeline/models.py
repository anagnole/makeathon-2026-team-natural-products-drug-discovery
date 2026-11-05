import numpy as np
import pandas as pd
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


def stratified_bootstrap(y_true, scores, metric, repeats=2000, seed=0):
    rng = np.random.default_rng(seed)
    y_true = np.asarray(y_true)
    scores = np.asarray(scores)
    positives = np.where(y_true == 1)[0]
    negatives = np.where(y_true == 0)[0]
    if len(positives) == 0 or len(negatives) == 0:
        return (float("nan"), float("nan"))
    values = []
    for _ in range(repeats):
        index = np.concatenate([
            rng.choice(positives, len(positives), replace=True),
            rng.choice(negatives, len(negatives), replace=True),
        ])
        try:
            values.append(metric(y_true[index], scores[index]))
        except ValueError:
            continue
    if not values:
        return (float("nan"), float("nan"))
    return (float(np.percentile(values, 2.5)), float(np.percentile(values, 97.5)))


def matthews(y_true, predicted):
    from sklearn.metrics import matthews_corrcoef

    return float(matthews_corrcoef(y_true, predicted))


def choose_threshold(y_true, scores, recall_floor=0.40):
    y_true = np.asarray(y_true)
    scores = np.asarray(scores)
    candidates = np.unique(scores)
    if len(candidates) > 400:
        candidates = np.quantile(scores, np.linspace(0.01, 0.99, 400))
    best_precision, best_mcc = None, None
    for t in candidates:
        predicted = (scores >= t).astype(int)
        if predicted.sum() == 0:
            continue
        tp = float(((predicted == 1) & (y_true == 1)).sum())
        recall = tp / max(1.0, float((y_true == 1).sum()))
        precision = tp / float(predicted.sum())
        mcc = matthews(y_true, predicted)
        if best_mcc is None or mcc > best_mcc[1]:
            best_mcc = (float(t), mcc)
        if recall >= recall_floor and (best_precision is None or precision > best_precision[1]):
            best_precision = (float(t), precision)
    if best_precision is not None:
        threshold = best_precision[0]
        predicted = (scores >= threshold).astype(int)
        tp = float(((predicted == 1) & (y_true == 1)).sum())
        recall = tp / max(1.0, float((y_true == 1).sum()))
        bound = "the recall floor" if recall <= recall_floor + 0.02 else "the precision optimum"
        return threshold, f"max precision s.t. recall >= {recall_floor:.2f}; bound by {bound}"
    return (best_mcc[0] if best_mcc else 0.5), "MCC-maximising (recall floor unreachable)"


def threshold_metrics(y_true, scores, threshold):
    from sklearn.metrics import f1_score, precision_score, recall_score

    y_true = np.asarray(y_true)
    predicted = (np.asarray(scores) >= threshold).astype(int)
    return {
        "threshold": float(threshold),
        "flagged": int(predicted.sum()),
        "precision": float(precision_score(y_true, predicted, zero_division=0)),
        "recall": float(recall_score(y_true, predicted, zero_division=0)),
        "f1": float(f1_score(y_true, predicted, zero_division=0)),
        "mcc": matthews(y_true, predicted),
    }


def reliability(y_true, scores, bins=10):
    y_true = np.asarray(y_true)
    scores = np.asarray(scores)
    edges = np.unique(np.quantile(scores, np.linspace(0, 1, bins + 1)))
    which = np.clip(np.digitize(scores, edges[1:-1]), 0, max(0, len(edges) - 2))
    rows = []
    for b in range(max(1, len(edges) - 1)):
        mask = which == b
        if mask.sum() >= 15:
            rows.append({
                "mean_predicted": float(scores[mask].mean()),
                "observed": float(y_true[mask].mean()),
                "n": int(mask.sum()),
            })
    return pd.DataFrame(rows)


def operating_rates(y_true, scores, threshold):
    y_true = np.asarray(y_true)
    predicted = (np.asarray(scores) >= threshold).astype(int)
    positives = max(1, int((y_true == 1).sum()))
    negatives = max(1, int((y_true == 0).sum()))
    sensitivity = float(((predicted == 1) & (y_true == 1)).sum()) / positives
    specificity = float(((predicted == 0) & (y_true == 0)).sum()) / negatives
    return sensitivity, specificity


def precision_at_prevalence(sensitivity, specificity, prevalence):
    hits = sensitivity * prevalence
    false_alarms = (1.0 - specificity) * (1.0 - prevalence)
    return float(hits / (hits + false_alarms)) if (hits + false_alarms) > 0 else float("nan")


def yield_interval(y_true, scores, threshold, prevalence, synthesised,
                   repeats=2000, seed=0):
    rng = np.random.default_rng(seed)
    y_true = np.asarray(y_true)
    scores = np.asarray(scores)
    positives = np.where(y_true == 1)[0]
    negatives = np.where(y_true == 0)[0]
    draws = []
    for _ in range(repeats):
        index = np.concatenate([
            rng.choice(positives, len(positives), replace=True),
            rng.choice(negatives, len(negatives), replace=True),
        ])
        sens, spec = operating_rates(y_true[index], scores[index], threshold)
        draws.append(precision_at_prevalence(sens, spec, prevalence) * synthesised)
    return (float(np.percentile(draws, 2.5)), float(np.percentile(draws, 97.5)))
