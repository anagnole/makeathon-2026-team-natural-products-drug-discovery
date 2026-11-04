import pandas as pd

from . import data, features, labels

PATHOGENS = [
    "Staphylococcus aureus",
    "Escherichia coli",
    "Mycobacterium tuberculosis",
]

PRIMARY_THRESHOLD_UM = 32.0
SENSITIVITY_THRESHOLD_UM = 10.0

_inchikey_cache = {}
_weight_cache = {}


def slug(organism):
    return organism.lower().replace(" ", "_")


def _load_known_inchikeys():
    if _inchikey_cache:
        return
    path = data.PROCESSED / "01_structures.parquet"
    if path.exists():
        saved = pd.read_parquet(path, columns=["canonical_smiles", "inchikey"]).dropna()
        _inchikey_cache.update(zip(saved.canonical_smiles, saved.inchikey, strict=False))


def inchikeys_for(smiles_list):
    _load_known_inchikeys()
    missing = [s for s in smiles_list if s not in _inchikey_cache]
    if missing:
        _inchikey_cache.update(zip(missing, data.inchikeys(missing), strict=False))
    return _inchikey_cache


def weights_for(smiles_list):
    missing = [s for s in smiles_list if s not in _weight_cache]
    for smiles in missing:
        _weight_cache[smiles] = labels.mol_weight_from_smiles(smiles)
    return _weight_cache


def load_activity(organism, standard_type="mic"):
    path = data.RAW / f"chembl_{standard_type}_{slug(organism)}.parquet"
    if not path.exists():
        raise FileNotFoundError(
            f"{path} missing. Run scripts/fetch_chembl.py {standard_type.upper()} first."
        )
    return pd.read_parquet(
        path,
        columns=[
            "activity_id",
            "canonical_smiles",
            "standard_relation",
            "standard_value",
            "standard_units",
            "data_validity_comment",
        ],
    )


def plant_annotation():
    path = data.PROCESSED / "01_plant_occurrences.parquet"
    if not path.exists():
        raise FileNotFoundError(f"{path} missing. Run notebook 01 first.")
    occurrences = pd.read_parquet(
        path, columns=["structure_inchikey", "family"]
    ).dropna(subset=["structure_inchikey"])
    occurrences["skeleton"] = occurrences.structure_inchikey.str.split("-").str[0]
    grouped = occurrences.groupby("skeleton").family.agg(lambda s: set(s.dropna()))
    single = {k: next(iter(v)) for k, v in grouped.items() if len(v) == 1}
    return set(grouped.index), single


def representative_smiles(frame):
    counts = (
        frame.groupby(["skeleton", "canonical_smiles"])
        .size()
        .rename("rows")
        .reset_index()
    )
    counts["length"] = counts.canonical_smiles.str.len()
    counts = counts.sort_values(
        ["skeleton", "rows", "length", "canonical_smiles"],
        ascending=[True, False, True, True],
    )
    return counts.drop_duplicates("skeleton").set_index("skeleton").canonical_smiles


def curate(organism, threshold_um=PRIMARY_THRESHOLD_UM, standard_type="mic", drop_flagged=True):
    steps = []

    def note(label, frame, unit="rows"):
        steps.append({"step": label, unit: len(frame)})
        return frame

    frame = load_activity(organism, standard_type)
    note("raw MIC rows", frame)

    if drop_flagged:
        frame = frame[frame.data_validity_comment.isna()]
        note("drop rows ChEMBL flagged as suspect", frame)

    frame = frame.dropna(subset=["canonical_smiles"])
    note("drop rows with no structure", frame)

    frame["standard_value"] = pd.to_numeric(frame.standard_value, errors="coerce")
    frame = frame.dropna(subset=["standard_value"])
    frame = frame[frame.standard_value > 0]
    note("drop rows with no usable numeric value", frame)

    unique_smiles = list(frame.canonical_smiles.unique())
    keys = inchikeys_for(unique_smiles)
    weights = weights_for(unique_smiles)

    frame["skeleton"] = [features.skeleton(keys.get(s)) for s in frame.canonical_smiles]
    frame = frame.dropna(subset=["skeleton"])
    note("drop rows whose structure does not parse", frame)

    frame["value_um"] = [
        labels.to_micromolar(value, unit, weights.get(smiles))
        for smiles, value, unit in zip(
            frame.canonical_smiles, frame.standard_value, frame.standard_units, strict=False
        )
    ]
    before = len(frame)
    frame = frame.dropna(subset=["value_um"])
    steps.append(
        {
            "step": "drop rows whose units cannot be converted",
            "rows": len(frame),
            "share lost here": f"{(before - len(frame)) / before:.1%}" if before else "",
        }
    )

    steps.append({"step": "distinct structures in those rows", "rows": frame.canonical_smiles.nunique()})
    steps.append({"step": "distinct compounds after InChIKey-skeleton dedup", "rows": frame.skeleton.nunique()})

    label_of = labels.label_table(
        frame, "skeleton", "standard_relation", "value_um", threshold_um
    )
    steps.append({"step": f"compounds with a verdict at {threshold_um:g} uM", "rows": len(label_of)})

    measured = frame.groupby("skeleton").size()
    smiles_of = representative_smiles(frame)
    known_plants, single_family = plant_annotation()

    table = pd.DataFrame(
        {
            "skeleton": list(label_of),
            "label": [label_of[k] for k in label_of],
        }
    )
    table["canonical_smiles"] = table.skeleton.map(smiles_of)
    table["n_measurements"] = table.skeleton.map(measured).astype(int)
    table["from_plant"] = table.skeleton.isin(known_plants)
    table["family"] = table.skeleton.map(single_family)
    table = table.dropna(subset=["canonical_smiles"])
    steps.append({"step": "labelled table written", "rows": len(table)})

    return table, pd.DataFrame(steps), frame


def censored_contribution(rows, threshold_um):
    censored = rows.standard_relation.isin([">", ">="])
    per_compound = rows.assign(is_censored=censored).groupby("skeleton").is_censored
    return pd.DataFrame(
        {
            "all measurements censored": per_compound.all(),
            "any measurement censored": per_compound.any(),
        }
    )
