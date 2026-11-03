import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import pandas as pd
import requests

BASE = "https://www.ebi.ac.uk/chembl/api/data"
ROOT = Path(__file__).resolve().parents[1]
RAW = Path(os.environ.get("ETHNOHACK_DATA_DIR", ROOT / "data")) / "raw"

ORGANISMS = [
    "Staphylococcus aureus",
    "Escherichia coli",
    "Pseudomonas aeruginosa",
    "Klebsiella pneumoniae",
    "Acinetobacter baumannii",
    "Enterococcus faecium",
    "Enterococcus faecalis",
    "Mycobacterium tuberculosis",
    "Bacillus subtilis",
]

FIELDS = [
    "activity_id",
    "molecule_chembl_id",
    "canonical_smiles",
    "target_chembl_id",
    "target_organism",
    "target_pref_name",
    "assay_chembl_id",
    "assay_type",
    "assay_description",
    "assay_organism",
    "document_chembl_id",
    "standard_type",
    "standard_relation",
    "standard_value",
    "standard_units",
    "pchembl_value",
    "activity_comment",
    "data_validity_comment",
    "potential_duplicate",
]

PAGE = 1000
WORKERS = 6


def slug(name):
    return name.lower().replace(" ", "_")


def get(path, params, attempts=5):
    for attempt in range(attempts):
        try:
            response = requests.get(f"{BASE}/{path}", params=params, timeout=180)
            if response.status_code == 200:
                return response.json()
            last = f"HTTP {response.status_code}"
        except requests.RequestException as exc:
            last = str(exc)
        time.sleep(3 * (attempt + 1))
    raise RuntimeError(f"{path} failed after {attempts} attempts: {last}")


def fetch_organism(organism, standard_type):
    base = {
        "target_organism__iexact": organism,
        "standard_type": standard_type,
        "limit": PAGE,
        "only": ",".join(FIELDS),
    }
    first = get("activity.json", dict(base, offset=0))
    total = first["page_meta"]["total_count"]
    rows = list(first["activities"])
    offsets = list(range(PAGE, total, PAGE))
    if offsets:
        done = [0]

        def page(offset):
            payload = get("activity.json", dict(base, offset=offset))
            done[0] += 1
            if done[0] % 10 == 0:
                print(f"  {organism}: page {done[0]}/{len(offsets)}", flush=True)
            return payload["activities"]

        with ThreadPoolExecutor(max_workers=WORKERS) as pool:
            for chunk in pool.map(page, offsets):
                rows.extend(chunk)
    print(f"  {organism}: {len(rows)}/{total} rows", flush=True)
    return pd.DataFrame(rows)


def main():
    standard_type = sys.argv[1] if len(sys.argv) > 1 else "MIC"
    RAW.mkdir(parents=True, exist_ok=True)
    written = []
    for organism in ORGANISMS:
        out = RAW / f"chembl_{standard_type.lower()}_{slug(organism)}.parquet"
        if out.exists():
            print(f"{organism}: already downloaded, skipping", flush=True)
            written.append(out)
            continue
        print(f"{organism}: fetching {standard_type}", flush=True)
        frame = fetch_organism(organism, standard_type)
        frame.to_parquet(out, index=False)
        print(f"{organism}: wrote {len(frame):,} rows to {out.name}", flush=True)
        written.append(out)
    sizes = {p.name: len(pd.read_parquet(p, columns=["activity_id"])) for p in written}
    print("\nDone.")
    for name, n in sizes.items():
        print(f"  {name:52s} {n:>8,}")
    print(f"  {'total':52s} {sum(sizes.values()):>8,}")


if __name__ == "__main__":
    main()
