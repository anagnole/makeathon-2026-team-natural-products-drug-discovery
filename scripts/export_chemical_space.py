"""Project the measured chemistry and this run's candidates into one 2D map.

The whole claim on the shortlist page is distance: a predicted score means nothing
without how far the compound sits from anything the model was trained on. That
distance currently only ever appears as a Tanimoto number and a liquid level. This
writes the coordinates that let it be *seen*: the chemistry the model has measured
as a cloud, and the 50 in-domain and 15 exploratory candidates landing on it.

Honesty, because a projection is very easy to lie with:

  * The fingerprints are the project's own. This imports notebooks/pipeline and calls
    the same features.fingerprint() the training set was built with, at the same
    radius 2 / 2048 bits, so the candidates are embedded in the space the model
    actually used and not a lookalike of it.
  * The projection is PCA, which is linear and deterministic. t-SNE and UMAP make a
    prettier picture, but they distort global distance by construction, and global
    distance is the one thing this figure exists to show. A figure whose subject is
    distance may not use a method that discards it.
  * PCA is fitted on the training set alone. The candidates are transformed into that
    fitted space, never fitted with it, because the map has to mean "where this sits
    relative to what we knew" and not "where this sits relative to itself".
  * The cloud is a random sample of the measured set, not all of it, so that the page
    stays small enough to open. The sample size and the seed are written out, and the
    variance these two components carry is written out too, because it is low and the
    caption has to say so.

Output, per organism:
  results/chemical_space_<slug>.csv    one row per plotted point
  results/chemical_space.json          what the caption needs to be honest about

Run:  .venv/bin/python scripts/export_chemical_space.py [slug ...]
"""

import csv
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.decomposition import PCA

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "notebooks"))
from pipeline import featureset, features  # noqa: E402

RESULTS = ROOT / "results"
SLUGS = [
    "staphylococcus_aureus",
    "escherichia_coli",
    "mycobacterium_tuberculosis",
]

SEED = 0
# Enough of the measured set to show the shape of it, few enough that three of these
# inline in a static page without making it slow to open.
CLOUD = 1500
# PCA is fitted on more than it draws: the axes should come from the measured set, not
# from the fifteen hundred points that happen to be drawn.
FIT = 20000


def candidates(slug):
    """The 65 compounds on the plate, in the order the page ranks them."""
    frames = []
    for tier, name in (("in-domain", "shortlist"), ("exploratory", "exploratory")):
        frame = pd.read_csv(RESULTS / f"{name}_{slug}.csv")
        frame["tier"] = tier
        frames.append(frame)
    return pd.concat(frames, ignore_index=True)


def fingerprints(smiles_list):
    """Same generator, same radius, same bit count as the training set."""
    rows, kept = [], []
    for i, smiles in enumerate(smiles_list):
        fp = features.fingerprint(features.molecule(smiles))
        if fp is None:
            continue
        rows.append(fp)
        kept.append(i)
    return np.array(rows, dtype=np.uint8), kept


def project(slug):
    bundle = featureset.load(f"03_features_{slug}")
    total = len(bundle["skeleton"])
    rng = np.random.default_rng(SEED)

    # One draw, then a prefix of it for the cloud: the drawn points are a subset of the
    # fitted ones rather than a second, unrelated sample.
    order = rng.permutation(total)
    fit_idx = order[: min(FIT, total)]
    cloud_idx = fit_idx[: min(CLOUD, len(fit_idx))]

    fit_x = featureset.unpack_morgan(bundle["morgan"][fit_idx])
    pca = PCA(n_components=2, svd_solver="randomized", random_state=SEED).fit(fit_x)

    cloud_xy = pca.transform(featureset.unpack_morgan(bundle["morgan"][cloud_idx]))

    frame = candidates(slug)
    fps, kept = fingerprints(frame.canonical_smiles.tolist())
    frame = frame.iloc[kept].reset_index(drop=True)
    cand_xy = pca.transform(fps.astype(np.float32))

    # One frame for both, so the normalisation below cannot be applied to the cloud and
    # the candidates on two different scales. Both axes are then divided by the *same*
    # span and centred, rather than stretched to the box independently: this figure's
    # subject is distance, and scaling the two axes differently would make a given
    # distance mean one thing horizontally and another thing vertically.
    every = np.vstack([cloud_xy, cand_xy])
    low, high = every.min(axis=0), every.max(axis=0)
    span = float(np.max(high - low)) or 1.0
    unit = (every - (high + low) / 2) / span + 0.5
    cloud_unit, cand_unit = unit[: len(cloud_xy)], unit[len(cloud_xy) :]

    rows = []
    for (x, y), plant, label in zip(
        cloud_unit,
        bundle["from_plant"][cloud_idx],
        bundle["label"][cloud_idx],
    ):
        rows.append(
            {
                "kind": "measured",
                "x": round(float(x), 4),
                "y": round(float(y), 4),
                "plant": int(bool(plant)),
                "active": int(label),
                "rank": "",
                "tier": "",
                "skeleton": "",
            }
        )
    for (x, y), row in zip(cand_unit, frame.itertuples(index=False)):
        rows.append(
            {
                "kind": "candidate",
                "x": round(float(x), 4),
                "y": round(float(y), 4),
                "plant": "",
                "active": "",
                "rank": int(row.rank),
                "tier": row.tier,
                "skeleton": row.skeleton,
            }
        )

    # The figure's own disclaimer, measured rather than asserted. If the two tiers sit
    # the same distance from the measured cloud on this map, then the applicability
    # domain is not visible in it, and the caption has to say so in the page's own
    # numbers instead of leaving a reader to infer a separation that is not there.
    def to_cloud(points):
        if not len(points):
            return None
        d = np.sqrt(((cloud_unit[None, :, :] - points[:, None, :]) ** 2).sum(axis=2))
        return round(float(np.median(d.min(axis=1))), 4)

    tiers = frame.tier.to_numpy()
    meta = {
        "nearest_measured_in_domain": to_cloud(cand_unit[tiers == "in-domain"]),
        "nearest_measured_exploratory": to_cloud(cand_unit[tiers == "exploratory"]),
        "measured_total": int(total),
        "measured_drawn": int(len(cloud_idx)),
        "measured_fitted": int(len(fit_idx)),
        "measured_from_plants": int(bundle["from_plant"][cloud_idx].sum()),
        "candidates": int(len(frame)),
        "variance_explained": round(float(pca.explained_variance_ratio_.sum()), 4),
        "component_variance": [round(float(v), 4) for v in pca.explained_variance_ratio_],
        "fingerprint_bits": int(features.FINGERPRINT_BITS),
        "fingerprint_radius": int(features.FINGERPRINT_RADIUS),
        "seed": SEED,
    }
    return rows, meta


def main(slugs):
    meta_path = RESULTS / "chemical_space.json"
    meta = json.loads(meta_path.read_text()) if meta_path.exists() else {}

    for slug in slugs:
        rows, info = project(slug)
        out = RESULTS / f"chemical_space_{slug}.csv"
        with out.open("w", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
            writer.writeheader()
            writer.writerows(rows)
        meta[slug] = info
        print(
            f"{slug}: {info['measured_drawn']:,} of {info['measured_total']:,} measured "
            f"+ {info['candidates']} candidates, "
            f"{info['variance_explained'] * 100:.1f}% of variance in two components "
            f"-> {out.relative_to(ROOT)}",
            flush=True,
        )

    meta_path.write_text(json.dumps(meta, indent=2, sort_keys=True) + "\n")
    print(f"wrote {meta_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main(sys.argv[1:] or SLUGS)
