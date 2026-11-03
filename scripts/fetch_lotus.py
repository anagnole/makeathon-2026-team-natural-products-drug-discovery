import os
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
RAW = Path(os.environ.get("ETHNOHACK_DATA_DIR", ROOT / "data")) / "raw" / "lotus"

RECORD = "https://zenodo.org/api/records/5794106"


def main():
    RAW.mkdir(parents=True, exist_ok=True)
    record = requests.get(RECORD, timeout=120).json()
    wanted = [f for f in record["files"] if f["key"].endswith("_frozen_metadata.csv.gz")]
    if not wanted:
        raise SystemExit("no frozen metadata export in the Zenodo record")
    for entry in wanted:
        out = RAW / entry["key"]
        if out.exists() and out.stat().st_size == entry["size"]:
            print(f"{entry['key']}: already downloaded")
            continue
        print(f"{entry['key']}: downloading {entry['size'] / 1e6:.1f} MB")
        with requests.get(entry["links"]["self"], stream=True, timeout=600) as response:
            response.raise_for_status()
            with out.open("wb") as handle:
                for chunk in response.iter_content(chunk_size=1 << 20):
                    handle.write(chunk)
        print(f"{entry['key']}: wrote {out.stat().st_size / 1e6:.1f} MB")
    (RAW / "SOURCE.txt").write_text(
        "LOTUS frozen metadata export: referenced taxon to natural-product pairs, with the\n"
        "structure (SMILES, InChI, formula, exact mass, XLogP), its NPClassifier and ClassyFire\n"
        "chemical classes, and the full organism taxonomy.\n"
        f"Zenodo concept record {RECORD}\n"
        f"Version DOI: {record.get('doi')}\n"
        f"Published: {record['metadata'].get('publication_date')}\n"
        "Licence: CC0.\n"
    )


if __name__ == "__main__":
    main()
