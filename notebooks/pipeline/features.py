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


_tautomer_enumerator = None


def _enumerator():
    global _tautomer_enumerator
    if _tautomer_enumerator is None:
        from rdkit.Chem.MolStandardize import rdMolStandardize

        _tautomer_enumerator = rdMolStandardize.TautomerEnumerator()
    return _tautomer_enumerator


def enumerator_signature():
    """What produced these keys. Stored beside the cache so a change forces a rebuild."""
    import rdkit

    return f"rdkit={rdkit.__version__};tautomer=default-uncapped;block=inchikey-first"


def canonical_skeleton(smiles):
    """(skeleton, status) for one SMILES. Status is canonical, fallback or unparsed.

    skeleton() collapses stereoisomers and salt forms but not tautomers, and an enol and its
    ketone give different InChIKeys for the same molecule. Natural-product and medicinal-chemistry
    databases routinely store different tautomers of one compound, so a key that does not collapse
    them lets the same molecule appear as two.

    A molecule whose enumeration throws keeps the uncanonicalised key, which is the bug this
    function exists to fix, so it is reported as "fallback" rather than returned silently.
    """
    from rdkit import Chem, RDLogger
    from rdkit.Chem.inchi import MolToInchiKey

    RDLogger.DisableLog("rdApp.*")
    if not smiles:
        return (None, "unparsed")
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return (None, "unparsed")
    try:
        return (MolToInchiKey(_enumerator().Canonicalize(mol)).split("-")[0], "canonical")
    except Exception:
        try:
            return (MolToInchiKey(mol).split("-")[0], "fallback")
        except Exception:
            return (None, "unparsed")


def canonical_skeletons(smiles_list, workers=None, show_progress=False, chunksize=200,
                        on_batch=None, batch_size=20000):
    """canonical_skeleton over many SMILES, in parallel.

    Returns (mapping, counts). on_batch(mapping) is called every batch_size results so the
    caller can checkpoint: an uncapped tautomer enumeration over a quarter of a million natural
    products has a long tail, and losing all of it to one crash is avoidable.
    """
    import os
    from collections import Counter
    from concurrent.futures import ProcessPoolExecutor

    unique = list(dict.fromkeys(s for s in smiles_list if isinstance(s, str) and s))
    if not unique:
        return {}, Counter()
    workers = workers or max(1, (os.cpu_count() or 2) - 1)
    out, counts = {}, Counter()
    with ProcessPoolExecutor(max_workers=workers) as pool:
        results = pool.map(canonical_skeleton, unique, chunksize=chunksize)
        for i, (smiles, (key, status)) in enumerate(zip(unique, results, strict=False), 1):
            out[smiles] = key
            counts[status] += 1
            if i % batch_size == 0:
                if on_batch is not None:
                    on_batch(out)
                if show_progress:
                    print(f"    canonical skeletons {i:,}/{len(unique):,} "
                          f"(fallback {counts['fallback']}, unparsed {counts['unparsed']})",
                          flush=True)
    return out, counts
