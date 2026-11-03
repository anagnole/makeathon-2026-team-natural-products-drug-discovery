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
OUT = RAW / "chembl_targets.parquet"

WORKERS = 6
PAGE = 200


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


def flatten(target):
    components = target.get("target_components") or []
    accessions = [c.get("accession") for c in components if c.get("accession")]
    return {
        "target_chembl_id": target.get("target_chembl_id"),
        "target_type": target.get("target_type"),
        "pref_name": target.get("pref_name"),
        "organism": target.get("organism"),
        "tax_id": target.get("tax_id"),
        "n_components": len(components),
        "uniprot_accessions": ";".join(accessions),
    }


def main():
    standard_type = sys.argv[1] if len(sys.argv) > 1 else "mic"
    files = sorted(RAW.glob(f"chembl_{standard_type}_*.parquet"))
    if not files:
        raise SystemExit(f"no {standard_type} activity files in {RAW}")
    ids = set()
    for path in files:
        ids |= set(pd.read_parquet(path, columns=["target_chembl_id"]).target_chembl_id.dropna())
    ids = sorted(ids)

    done = set()
    if OUT.exists():
        done = set(pd.read_parquet(OUT).target_chembl_id)
    todo = [i for i in ids if i not in done]
    print(f"{len(ids):,} distinct targets, {len(done):,} cached, {len(todo):,} to fetch")
    if not todo:
        return

    batches = [todo[i:i + PAGE] for i in range(0, len(todo), PAGE)]

    def fetch(batch):
        payload = get("target.json", {"target_chembl_id__in": ",".join(batch), "limit": PAGE})
        return [flatten(t) for t in payload["targets"]]

    rows = []
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        for i, chunk in enumerate(pool.map(fetch, batches), 1):
            rows.extend(chunk)
            print(f"  batch {i}/{len(batches)}, {len(rows):,} targets", flush=True)

    frame = pd.DataFrame(rows)
    if OUT.exists():
        frame = pd.concat([pd.read_parquet(OUT), frame], ignore_index=True)
    frame.to_parquet(OUT, index=False)
    print(f"\nwrote {len(frame):,} targets to {OUT}")
    print(frame.target_type.value_counts().to_string())


if __name__ == "__main__":
    main()
