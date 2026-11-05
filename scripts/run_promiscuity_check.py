import json
import pickle
import sys
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "notebooks"))

from pipeline import curation, data, featureset, ledger  # noqa: E402

OUT = data.PROCESSED / "05_promiscuity.json"
PROMISCUITY_LOGP = 5.0
TOP_FRACTION = 0.001


def surfactant_like(mol):
    from rdkit import Chem

    if mol is None:
        return False
    quaternary = any(a.GetSymbol() == "N" and a.GetFormalCharge() > 0 and a.GetDegree() == 4
                     for a in mol.GetAtoms())
    long_chain = mol.HasSubstructMatch(Chem.MolFromSmarts("[CH2]" + "[CH2]" * 7))
    return bool(quaternary or long_chain)


def profile(smiles_list, label):
    from rdkit import Chem, RDLogger
    from rdkit.Chem import Crippen

    RDLogger.DisableLog("rdApp.*")
    values, flags = [], []
    for smiles in smiles_list:
        mol = Chem.MolFromSmiles(smiles) if isinstance(smiles, str) else None
        if mol is None:
            continue
        values.append(Crippen.MolLogP(mol))
        flags.append(surfactant_like(mol))
    values = np.array(values)
    return {
        "set": label,
        "n": int(len(values)),
        "median logP": float(np.median(values)) if len(values) else float("nan"),
        f"above logP {PROMISCUITY_LOGP:g}": int((values > PROMISCUITY_LOGP).sum()),
        f"share above logP {PROMISCUITY_LOGP:g}":
            float((values > PROMISCUITY_LOGP).mean()) if len(values) else float("nan"),
        "surfactant-like": int(np.sum(flags)),
        "_values": values,
    }


def run(organism, seed=0):
    slug = curation.slug(organism)
    payload = pickle.loads((data.PROCESSED / f"04_models_{slug}.pkl").read_bytes())

    plant = pd.read_parquet(data.PROCESSED / "01_plant_structures.parquet",
                            columns=["structure_smiles"]).dropna()
    keys = data.canonical_skeleton_map(list(plant.structure_smiles.unique()),
                                       show_progress=False)
    plant["skeleton"] = plant.structure_smiles.map(keys)
    plant = plant.dropna(subset=["skeleton"]).drop_duplicates("skeleton")
    labelled = set(pd.read_parquet(
        data.PROCESSED / f"02_labelled_{slug}.parquet", columns=["skeleton"]).skeleton)
    plant = plant[~plant.skeleton.isin(labelled)].reset_index(drop=True)

    table = plant.rename(columns={"structure_smiles": "canonical_smiles"})[
        ["skeleton", "canonical_smiles"]].assign(label=-1, from_plant=True, family=np.nan)
    bundle = featureset.build(table, show_progress=False)
    X = featureset.matrix(bundle, payload["feature_set"])
    scores = payload["model_object"].predict_proba(X)[:, 1]
    smiles = pd.Series(table.set_index("skeleton").canonical_smiles).reindex(
        bundle["skeleton"]).to_numpy()
    del X

    rng = np.random.default_rng(seed)
    sample = rng.choice(len(smiles), min(6000, len(smiles)), replace=False)
    top_n = max(1, int(round(TOP_FRACTION * len(scores))))
    top_index = np.argsort(-scores)[:top_n]

    shortlist = pd.read_csv(ROOT / "results" / f"shortlist_{slug}.csv")

    profiles = [
        profile(smiles[sample], "screening set (sample)"),
        profile(smiles[top_index], f"top {TOP_FRACTION * 100:g}% of the raw ranking"),
        profile(shortlist.canonical_smiles.to_numpy(), "shipped shortlist (50, diversity-selected)"),
    ]
    screen_values = profiles[0].pop("_values")
    for entry in profiles[1:]:
        values = entry.pop("_values")
        entry["percentile in screening set"] = float(
            (screen_values < np.median(values)).mean()) if len(values) else float("nan")
    profiles[0]["percentile in screening set"] = 0.5

    ledger.record(
        f"promiscuity_{slug}",
        {"task": f"{organism} MIC, whole organism",
         "promiscuity_logp": PROMISCUITY_LOGP, "top_fraction": TOP_FRACTION,
         "surfactant_rule": "quaternary nitrogen or an unbranched C8 chain"},
        {f"{e['set'][:22]}_median_logp": e["median logP"] for e in profiles}
        | {f"{e['set'][:22]}_surfactants": e["surfactant-like"] for e in profiles},
        note="lipophilicity and surfactant profile of the ranking and the shortlist",
    )
    return {"organism": organism, "profiles": profiles}


def main():
    everything = json.loads(OUT.read_text()) if OUT.exists() else {}
    for organism in curation.PATHOGENS:
        print(f"{organism} ...", flush=True)
        result = run(organism)
        everything[organism] = result
        OUT.write_text(json.dumps(everything, indent=2))
        for entry in result["profiles"]:
            print(f"  {entry['set']:46s} n={entry['n']:>6,} median logP "
                  f"{entry['median logP']:.2f}  above 5: {entry['surfactant-like']:>3} surfactant, "
                  f"{entry[f'above logP {PROMISCUITY_LOGP:g}']:>3} greasy  "
                  f"pct {entry['percentile in screening set']:.0%}", flush=True)
    print(f"\nwrote {OUT}")


if __name__ == "__main__":
    main()
