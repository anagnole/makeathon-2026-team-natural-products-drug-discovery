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
    "umol/cm3": 1e3,
    "umol/ul": 1e6,
    "10^-3mm": 1.0,
    "10^-6 um": 1e-6,
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
    "ug l-1": 1e-3,
    "p.p.m.": 1.0,
    "microg/cm3": 1.0,
    "ug cm**-3": 1.0,
    "10^-4 ug/ml": 1e-4,
    "10'4pg/ml": 1e-2,
}

# ChEMBL stores a few rows with the exponent mangled into the unit string. Each of these is a
# concentration per millilitre with a leading power of ten, so the factor below is the power
# multiplied by that unit's own conversion to micromolar.
ODDITIES = {
    "10'-2 umol/ml": 10.0,
    "10'-2umol/ml": 10.0,
    "10'-2micromol/ml": 10.0,
    "10'-3micromol/ml": 1.0,
    "10^-3micromol/ml": 1.0,
    "10'-2mmol/ml": 1e4,
    "10^2umol/ml": 1e5,
}

# Deliberately not converted. Each is either a different physical quantity or too ambiguous to
# guess at, and a wrong conversion is worse than a dropped row.
REFUSED_UNITS = {
    "ug cm**-2": "per unit area, not a concentration",
    "ug/sq.cm": "per unit area, not a concentration",
    "ug disk-1": "disk diffusion, not a broth MIC",
    "ug/disk": "disk diffusion, not a broth MIC",
    "ug": "mass with no volume",
    "microg": "mass with no volume",
    "mg": "mass with no volume",
    "10'-2umol": "amount of substance with no volume",
    "ug mg-1": "per unit mass of something else",
    "ul/ml": "volume ratio, not a concentration",
    "%": "a percentage of an unstated reference",
    "%v/v": "a percentage of an unstated reference",
    "u ml-1": "enzyme activity units",
    "iu/ml": "international units",
    "ucm/s": "a velocity",
    "10'-3um/ml": "malformed: a concentration divided by a volume",
    "pug ml-1": "ambiguous prefix",
    "ug m1 l-1": "garbled",
}

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


def consensus_label(rows, threshold_um):
    """Label one compound from the median of its measurements rather than the best one.

    "Active wins over inactive" lets a single optimistic paper override many negative ones, and
    27,000 of our compounds carry more than one measurement, so the collapse rule matters more
    than the threshold does. The median observation is the defensible default: it needs half the
    evidence to agree before a compound is called active.

    Censored rows keep their relation, so a median that lands on a ">" row is read the way
    binary_label reads it rather than being treated as an exact value.
    """
    ordered = sorted(
        ((float(value), (relation.strip() if isinstance(relation, str) else "=") or "=")
         for relation, value in rows),
        key=lambda pair: pair[0],
    )
    if not ordered:
        return None
    value, relation = ordered[len(ordered) // 2]
    return binary_label([(relation, value)], threshold_um)


def straddles_threshold(rows, threshold_um):
    """True when a compound's measurements fall on both sides of the threshold."""
    values = [float(value) for _, value in rows]
    return bool(values) and min(values) <= threshold_um < max(values)


def consensus_table(frame, compound_column, relation_column, value_column, threshold_um):
    labels = {}
    conflicts = {}
    grouped = frame.groupby(compound_column)
    for key, rows in grouped[[relation_column, value_column]]:
        pairs = list(rows.itertuples(index=False, name=None))
        label = consensus_label(pairs, threshold_um)
        if label is not None:
            labels[key] = label
        conflicts[key] = straddles_threshold(pairs, threshold_um)
    return labels, conflicts
