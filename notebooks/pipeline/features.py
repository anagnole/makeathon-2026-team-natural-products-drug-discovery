"""Structure features, and the two grouping keys an honest evaluation needs.

skeleton() collapses stereoisomers and salts, so near-duplicates cannot sit on both sides of
a split. murcko_scaffold() is the chemical-series key used by the scaffold split.
"""

import numpy as np

FINGERPRINT_RADIUS = 2
FINGERPRINT_BITS = 2048

_generator = None


def _morgan_generator():
    global _generator
    if _generator is None:
        from rdkit.Chem import rdFingerprintGenerator

        _generator = rdFingerprintGenerator.GetMorganGenerator(
            radius=FINGERPRINT_RADIUS, fpSize=FINGERPRINT_BITS
        )
    return _generator


def molecule(smiles):
    from rdkit import Chem, RDLogger

    RDLogger.DisableLog("rdApp.*")
    return Chem.MolFromSmiles(smiles) if smiles else None


def fingerprint(mol):
    """Morgan fingerprint as a uint8 vector, or None for an unparsed molecule."""
    if mol is None:
        return None
    return np.array(_morgan_generator().GetFingerprintAsNumPy(mol), dtype=np.uint8)


def murcko_scaffold(mol):
    """Bemis-Murcko scaffold SMILES, or "none" for a molecule with no ring system."""
    from rdkit.Chem.Scaffolds import MurckoScaffold

    if mol is None:
        return None
    try:
        return MurckoScaffold.MurckoScaffoldSmiles(mol=mol, includeChirality=False) or "none"
    except Exception:
        return "none"


def skeleton(inchikey):
    """First block of an InChIKey: the connectivity, ignoring stereochemistry and salt form."""
    if not inchikey:
        return None
    return str(inchikey).split("-")[0]


def featurise(records):
    """Turn (key, smiles, inchikey) records into a list of feature dicts, dropping duplicates.

    Deduplication is by skeleton: two entries with the same connectivity are the same compound
    for modelling purposes, whatever their registry identifiers say.
    """
    seen = set()
    out = []
    for key, smiles, inchikey in records:
        mol = molecule(smiles)
        if mol is None:
            continue
        sk = skeleton(inchikey) or key
        if sk in seen:
            continue
        seen.add(sk)
        out.append(
            {
                "key": key,
                "fingerprint": fingerprint(mol),
                "scaffold": murcko_scaffold(mol),
                "skeleton": sk,
            }
        )
    return out


def matrix(features):
    """Stack fingerprints into a float matrix for scikit-learn."""
    return np.array([f["fingerprint"] for f in features], dtype=float)
