import numpy as np

from . import data, features

DESCRIPTOR_NAMES = [
    "molecular_weight",
    "logp",
    "tpsa",
    "h_donors",
    "h_acceptors",
    "rotatable_bonds",
    "rings",
    "aromatic_rings",
    "fraction_csp3",
    "heavy_atoms",
    "formal_charge",
    "heteroatoms",
    "molar_refractivity",
    "valence_electrons",
]


def _descriptor_functions():
    from rdkit.Chem import Crippen, Descriptors, Lipinski, rdMolDescriptors

    return [
        Descriptors.MolWt,
        Crippen.MolLogP,
        rdMolDescriptors.CalcTPSA,
        Lipinski.NumHDonors,
        Lipinski.NumHAcceptors,
        Lipinski.NumRotatableBonds,
        rdMolDescriptors.CalcNumRings,
        rdMolDescriptors.CalcNumAromaticRings,
        rdMolDescriptors.CalcFractionCSP3,
        lambda m: m.GetNumHeavyAtoms(),
        lambda m: sum(a.GetFormalCharge() for a in m.GetAtoms()),
        lambda m: sum(1 for a in m.GetAtoms() if a.GetSymbol() not in ("C", "H")),
        Crippen.MolMR,
        Descriptors.NumValenceElectrons,
    ]


def build(table, show_progress=True):
    from rdkit import RDLogger

    RDLogger.DisableLog("rdApp.*")
    funcs = _descriptor_functions()

    keep, morgan, desc, scaffolds = [], [], [], []
    for i, row in enumerate(table.itertuples(index=False), 1):
        mol = features.molecule(row.canonical_smiles)
        if mol is None:
            continue
        fp = features.fingerprint(mol)
        try:
            values = [float(f(mol)) for f in funcs]
        except Exception:
            continue
        if not np.all(np.isfinite(values)):
            continue
        keep.append(row.skeleton)
        morgan.append(fp)
        desc.append(values)
        scaffolds.append(features.murcko_scaffold(mol))
        if show_progress and i % 20000 == 0:
            print(f"    featurised {i:,}/{len(table):,}", flush=True)

    index = table.set_index("skeleton").loc[keep]
    return {
        "skeleton": np.array(keep),
        "morgan": np.packbits(np.array(morgan, dtype=np.uint8), axis=1),
        "descriptors": np.array(desc, dtype=np.float32),
        "scaffold": np.array(scaffolds, dtype=object),
        "label": index.label.to_numpy().astype(np.int8),
        "from_plant": index.from_plant.to_numpy().astype(bool),
        "family": index.family.fillna("").to_numpy().astype(object),
    }


def unpack_morgan(packed):
    expected = features.FINGERPRINT_BITS // 8
    if packed.ndim != 2 or packed.shape[1] != expected:
        raise ValueError(
            f"expected a packed array of width {expected}, got {packed.shape}. "
            "Fingerprints are stored packed; unpack them through this function, never feed "
            "bundle['morgan'] to a model or a similarity calculation directly."
        )
    unpacked = np.unpackbits(packed, axis=1)[:, : features.FINGERPRINT_BITS].astype(np.float32)
    assert set(np.unique(unpacked)) <= {0.0, 1.0}
    return unpacked


def matrices(bundle):
    morgan = unpack_morgan(bundle["morgan"])
    desc = bundle["descriptors"]
    return {
        "morgan": morgan,
        "descriptors": desc,
        "hybrid": np.hstack([morgan, desc]),
    }


def save(bundle, name):
    data.PROCESSED.mkdir(parents=True, exist_ok=True)
    path = data.PROCESSED / f"{name}.npz"
    np.savez_compressed(
        path,
        skeleton=bundle["skeleton"],
        morgan=bundle["morgan"],
        descriptors=bundle["descriptors"],
        scaffold=bundle["scaffold"].astype(str),
        label=bundle["label"],
        from_plant=bundle["from_plant"],
        family=bundle["family"].astype(str),
    )
    return path


def load(name):
    path = data.PROCESSED / f"{name}.npz"
    with np.load(path, allow_pickle=False) as handle:
        return {k: handle[k] for k in handle.files}
