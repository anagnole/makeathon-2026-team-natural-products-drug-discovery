import os
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
DATA = Path(os.environ.get("ETHNOHACK_DATA_DIR", ROOT / "data"))
RAW = DATA / "raw"
PROCESSED = DATA / "processed"

LOTUS_FILE = RAW / "lotus" / "260413_frozen_metadata.csv.gz"
TAXONOMY_FILE = RAW / "gbif_organisms.parquet"
TARGETS_FILE = RAW / "chembl_targets.parquet"

LOTUS_COLUMNS = [
    "structure_inchikey",
    "structure_smiles",
    "structure_exact_mass",
    "structure_xlogp",
    "structure_taxonomy_npclassifier_01pathway",
    "structure_taxonomy_npclassifier_02superclass",
    "structure_taxonomy_npclassifier_03class",
    "organism_name",
    "organism_taxonomy_02kingdom",
    "organism_taxonomy_03phylum",
    "organism_taxonomy_06family",
    "organism_taxonomy_08genus",
    "reference_doi",
]

LAND_PLANTS = "Streptophyta"

SOURCES = {
    "ChEMBL": {
        "what": "measured antibacterial activity, one row per assay result",
        "licence": "CC BY-SA 3.0",
        "access": "REST API, scripts/fetch_chembl.py",
    },
    "LOTUS": {
        "what": "referenced taxon to natural-product occurrence pairs",
        "licence": "CC0",
        "access": "Zenodo frozen export, scripts/fetch_lotus.py",
    },
    "GBIF backbone": {
        "what": "kingdom and family for each LOTUS organism name",
        "licence": "CC BY-NC 4.0 (name matching API)",
        "access": "species/match API, scripts/fetch_taxonomy.py",
    },
}


def activity_files(standard_type="mic"):
    return sorted(RAW.glob(f"chembl_{standard_type}_*.parquet"))


def load_activities(standard_type="mic"):
    files = activity_files(standard_type)
    if not files:
        raise FileNotFoundError(
            f"no {standard_type.upper()} files in {RAW}. Run scripts/fetch_chembl.py first."
        )
    frame = pd.concat([pd.read_parquet(f) for f in files], ignore_index=True)
    for column in ["standard_value", "pchembl_value"]:
        frame[column] = pd.to_numeric(frame[column], errors="coerce")
    return frame


def load_lotus(columns=None):
    if not LOTUS_FILE.exists():
        raise FileNotFoundError(f"{LOTUS_FILE} missing. Run scripts/fetch_lotus.py first.")
    frame = pd.read_csv(LOTUS_FILE, usecols=columns or LOTUS_COLUMNS, low_memory=False)
    return frame.rename(columns={
        "structure_taxonomy_npclassifier_01pathway": "np_pathway",
        "structure_taxonomy_npclassifier_02superclass": "np_superclass",
        "structure_taxonomy_npclassifier_03class": "np_class",
        "organism_taxonomy_02kingdom": "kingdom",
        "organism_taxonomy_03phylum": "phylum",
        "organism_taxonomy_06family": "family",
        "organism_taxonomy_08genus": "genus",
    })


def load_taxonomy():
    if not TAXONOMY_FILE.exists():
        raise FileNotFoundError(f"{TAXONOMY_FILE} missing. Run scripts/fetch_taxonomy.py first.")
    return pd.read_parquet(TAXONOMY_FILE)


def load_targets():
    if not TARGETS_FILE.exists():
        raise FileNotFoundError(f"{TARGETS_FILE} missing. Run scripts/fetch_targets.py first.")
    return pd.read_parquet(TARGETS_FILE)


def inchikeys(smiles, show_progress=False):
    from rdkit import Chem, RDLogger
    from rdkit.Chem.inchi import MolToInchiKey

    RDLogger.DisableLog("rdApp.*")
    unique = pd.Series(pd.unique(pd.Series(smiles).dropna()))
    mapping = {}
    for i, text in enumerate(unique, 1):
        mol = Chem.MolFromSmiles(text)
        if mol is not None:
            try:
                mapping[text] = MolToInchiKey(mol)
            except Exception:
                mapping[text] = None
        else:
            mapping[text] = None
        if show_progress and i % 20000 == 0:
            print(f"  inchikeys {i:,}/{len(unique):,}", flush=True)
    return pd.Series(smiles).map(mapping)


def mark_plants(lotus, taxonomy=None):
    taxonomy = load_taxonomy() if taxonomy is None else taxonomy
    gbif_plants = set(taxonomy.loc[taxonomy.kingdom.eq("Plantae"), "organism_name"])
    by_lotus = lotus.phylum.eq(LAND_PLANTS)
    by_gbif = lotus.organism_name.isin(gbif_plants)
    return lotus.assign(
        plant_lotus=by_lotus,
        plant_gbif=by_gbif,
        is_plant=by_lotus | by_gbif,
    )


def save_processed(frame, name):
    PROCESSED.mkdir(parents=True, exist_ok=True)
    path = PROCESSED / f"{name}.parquet"
    frame.to_parquet(path, index=False)
    return path
