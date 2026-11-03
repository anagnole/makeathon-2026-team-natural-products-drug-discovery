"""Download the NPASS 3.0 bulk files. Resumable, no API key.

NPASS adds the compound-to-organism provenance that ChEMBL does not carry: which plant a
compound was reported from, and that organism's taxonomy. Its activity table is a copy of
ChEMBL, so it is a provenance source here, not a second opinion on bioactivity.

NPASS publishes no data licence. Nothing downloaded here is committed; see
docs/proposal-plant-antibacterials.md for what that means for the repo.
"""

import argparse
import os
import sys
import urllib.request
from pathlib import Path

BASE_URL = "https://bidd.group/NPASS/downloadFiles"
ROOT = Path(__file__).resolve().parents[1]
DATA = Path(os.environ.get("ETHNOHACK_DATA_DIR", ROOT / "data"))
TARGET = DATA / "npass"

FILES = [
    "NPASS3.0_activities.txt",
    "NPASS3.0_naturalproducts_structure.txt",
    "NPASS3.0_naturalproducts_species_pair.txt",
    "NPASS3.0_species_info.txt",
    "NPASS3.0_target.txt",
]


def fetch(name, target_dir, force=False):
    destination = target_dir / name
    if destination.exists() and not force:
        print(f"have   {name} ({destination.stat().st_size / 1e6:.0f} MB)")
        return destination
    url = f"{BASE_URL}/{name}"
    print(f"get    {name} from {url}", flush=True)
    partial = destination.with_suffix(destination.suffix + ".part")
    with urllib.request.urlopen(url, timeout=120) as response, open(partial, "wb") as handle:
        while chunk := response.read(1 << 20):
            handle.write(chunk)
    partial.rename(destination)
    print(f"done   {name} ({destination.stat().st_size / 1e6:.0f} MB)")
    return destination


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--target-dir", type=Path, default=TARGET)
    parser.add_argument("--force", action="store_true", help="re-download files already present")
    args = parser.parse_args()
    args.target_dir.mkdir(parents=True, exist_ok=True)
    failed = []
    for name in FILES:
        try:
            fetch(name, args.target_dir, force=args.force)
        except Exception as error:
            print(f"failed {name}: {error}", file=sys.stderr)
            failed.append(name)
    if failed:
        print(f"\n{len(failed)} file(s) failed, re-run to retry: {', '.join(failed)}")
        return 1
    print(f"\nall files in {args.target_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
