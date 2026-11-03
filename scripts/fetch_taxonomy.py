import os
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import pandas as pd
import requests

ROOT = Path(__file__).resolve().parents[1]
RAW = Path(os.environ.get("ETHNOHACK_DATA_DIR", ROOT / "data")) / "raw"
OUT = RAW / "gbif_organisms.parquet"


def lotus_export():
    """The frozen metadata export fetch_lotus.py downloads, whatever date it carries."""
    found = sorted((RAW / "lotus").glob("*_frozen_metadata.csv.gz"))
    if not found:
        raise SystemExit(f"no LOTUS export in {RAW / 'lotus'}. Run scripts/fetch_lotus.py first.")
    return found[-1]

WORKERS = 16
FIELDS = ["kingdom", "phylum", "class", "order", "family", "genus",
          "rank", "status", "confidence", "matchType", "usageKey"]


def resolve(session, name):
    try:
        response = session.get("https://api.gbif.org/v1/species/match",
                               params={"name": name}, timeout=60)
        payload = response.json() if response.status_code == 200 else {}
    except requests.RequestException:
        payload = {}
    row = {"organism_name": name}
    row.update({f: payload.get(f) for f in FIELDS})
    return row


def main():
    names = sorted(pd.read_csv(lotus_export(), usecols=["organism_name"],
                               low_memory=False).organism_name.dropna().unique())
    done = set()
    if OUT.exists():
        done = set(pd.read_parquet(OUT).organism_name)
    todo = [n for n in names if n not in done]
    print(f"{len(names):,} unique organism names, {len(done):,} already resolved, "
          f"{len(todo):,} to do", flush=True)
    if not todo:
        return

    rows = []
    with requests.Session() as session:
        with ThreadPoolExecutor(max_workers=WORKERS) as pool:
            for i, row in enumerate(pool.map(lambda n: resolve(session, n), todo), 1):
                rows.append(row)
                if i % 2000 == 0:
                    print(f"  {i:,}/{len(todo):,}", flush=True)

    frame = pd.DataFrame(rows)
    if OUT.exists():
        frame = pd.concat([pd.read_parquet(OUT), frame], ignore_index=True)
    frame.to_parquet(OUT, index=False)
    print(f"\nwrote {len(frame):,} rows to {OUT}")
    print(frame.kingdom.value_counts(dropna=False).to_string())


if __name__ == "__main__":
    main()
