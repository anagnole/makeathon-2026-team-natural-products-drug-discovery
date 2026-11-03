"""Unit normalisation and censored-aware labelling for measured bioactivity rows.

Two jobs that notebook 01 showed cannot be skipped: 37 distinct unit strings, and 21.6% of
MIC rows carrying a `>` or `>=` relation. A censored row is a real measurement of inactivity,
so it becomes a negative label rather than being dropped.
"""

# factor to micromolar, for units already expressed per mole
MOLAR_TO_UM = {
    "m": 1e6,
    "mol/l": 1e6,
    "mm": 1e3,
    "mmol/l": 1e3,
    "um": 1.0,
    "µm": 1.0,
    "umol/l": 1.0,
    "nm": 1e-3,
    "nmol/l": 1e-3,
    "pm": 1e-6,
}

# factor to microgram per millilitre, for units expressed per volume
MASS_TO_UG_ML = {
    "ug/ml": 1.0,
    "µg/ml": 1.0,
    "ug.ml-1": 1.0,
    "ug ml-1": 1.0,
    "microg/ml": 1.0,
    "mg/l": 1.0,
    "mg.l-1": 1.0,
    "ppm": 1.0,
    "mg/ml": 1e3,
    "g/l": 1e3,
    "ng/ml": 1e-3,
    "ug/l": 1e-3,
}

# NPASS writes a handful of rows this way; 1 * 10^-2 umol/ml is 10 uM
ODDITIES = {"10'-2 umol/ml": 10.0}

ACTIVE_RELATIONS = frozenset({"=", "<", "<="})
INACTIVE_RELATIONS = frozenset({">", ">="})


def to_micromolar(value, units, mol_weight=None):
    """Convert one measurement to micromolar, or None if it cannot be converted.

    A mass-per-volume unit needs mol_weight (g/mol); without it the row is unconvertible
    and must be counted as a loss, not silently treated as molar.
    """
    try:
        value = float(value)
    except (TypeError, ValueError):
        return None
    if value <= 0:
        return None
    key = units.strip().lower() if isinstance(units, str) else ""
    if key in MOLAR_TO_UM:
        return value * MOLAR_TO_UM[key]
    if key in ODDITIES:
        return value * ODDITIES[key]
    if key in MASS_TO_UG_ML:
        if not mol_weight:
            return None
        return value * MASS_TO_UG_ML[key] / float(mol_weight) * 1000.0
    return None


def mol_weight_from_smiles(smiles):
    """Average molecular weight, or None if the structure does not parse."""
    from rdkit import Chem, RDLogger
    from rdkit.Chem import Descriptors

    RDLogger.DisableLog("rdApp.*")
    mol = Chem.MolFromSmiles(smiles) if smiles else None
    return None if mol is None else Descriptors.MolWt(mol)


def binary_label(rows, threshold_um):
    """Label one compound from all of its measurements against a threshold.

    rows is an iterable of (relation, value_in_uM). Active wins over inactive, because a
    compound shown potent in any assay is active whatever another lab reported. Returns
    1 (active), 0 (measured inactive) or None (the measurements say nothing at this
    threshold, e.g. only `>` rows below it).
    """
    active = False
    inactive = False
    for relation, value in rows:
        relation = relation.strip() if isinstance(relation, str) else "="
        if relation in ACTIVE_RELATIONS and value <= threshold_um:
            active = True
        elif relation == "=" and value > threshold_um:
            inactive = True
        elif relation in INACTIVE_RELATIONS and value >= threshold_um:
            inactive = True
    if active:
        return 1
    return 0 if inactive else None


def label_table(frame, compound_column, relation_column, value_column, threshold_um):
    """Apply binary_label per compound over a dataframe of micromolar values."""
    grouped = frame.groupby(compound_column)
    labels = {}
    for key, rows in grouped[[relation_column, value_column]]:
        label = binary_label(rows.itertuples(index=False, name=None), threshold_um)
        if label is not None:
            labels[key] = label
    return labels
