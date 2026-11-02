import hashlib
import json
import math
import os
import subprocess
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LEDGER_DIR = Path(os.environ.get("ETHNOHACK_RESULTS_DIR", ROOT / "results"))
LEDGER_FILE = LEDGER_DIR / "runs.jsonl"
LEDGER_MD = LEDGER_DIR / "LEDGER.md"

HEADER = """# Run ledger

One line per run, appended by `pipeline.ledger.record`. Every entry names the commit it came from and
a hash of its config; the full config and all metrics are in `runs.jsonl`.
"""


def clean(value):
    if isinstance(value, dict):
        return {str(k): clean(v) for k, v in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [clean(v) for v in value]
    if isinstance(value, bool):
        return value
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return None if not math.isfinite(value) else round(value, 6)
    if value is None or isinstance(value, str):
        return value
    if hasattr(value, "item"):
        try:
            return clean(value.item())
        except (ValueError, AttributeError):
            pass
    if isinstance(value, Path):
        return str(value)
    return str(value)


def git_state():
    def run(*args):
        try:
            out = subprocess.run(
                ["git", "-C", str(ROOT), *args], capture_output=True, text=True, timeout=5
            )
            return out.stdout.strip()
        except Exception:
            return ""

    return {
        "commit": run("rev-parse", "--short", "HEAD"),
        "branch": run("rev-parse", "--abbrev-ref", "HEAD"),
        "uncommitted_changes": bool(run("status", "--porcelain", "--untracked-files=no")),
    }


def config_hash(config):
    return hashlib.sha1(json.dumps(clean(config), sort_keys=True).encode()).hexdigest()[:10]


def record(run, config, metrics, note=None):
    stamp = datetime.now().isoformat(timespec="seconds")
    entry = {
        "id": f"{stamp}_{run}",
        "timestamp": stamp,
        "run": run,
        "note": note if note is not None else os.environ.get("ETHNOHACK_NOTE", ""),
        "git": git_state(),
        "config_hash": config_hash(config),
        "config": clean(config),
        "metrics": clean(metrics),
    }
    LEDGER_DIR.mkdir(parents=True, exist_ok=True)
    with LEDGER_FILE.open("a") as f:
        f.write(json.dumps(entry, sort_keys=True) + "\n")
    write_markdown()
    return entry


def entries():
    if not LEDGER_FILE.exists():
        return []
    return [json.loads(line) for line in LEDGER_FILE.read_text().splitlines() if line.strip()]


def write_markdown():
    rows = entries()
    if not rows:
        LEDGER_MD.write_text(HEADER + "\nNo runs recorded yet.\n")
        return LEDGER_MD

    metric_names = []
    for e in rows:
        for k in e["metrics"]:
            if k not in metric_names:
                metric_names.append(k)

    columns = ["time", "run", "commit", "config", "note", *metric_names]
    lines = [HEADER, "| " + " | ".join(columns) + " |", "|" + "---|" * len(columns)]
    for e in rows:
        commit = e["git"].get("commit", "")
        if e["git"].get("uncommitted_changes"):
            commit += "+"
        cells = [
            e["timestamp"][:16].replace("T", " "),
            e["run"],
            commit,
            e.get("config_hash", ""),
            e.get("note", ""),
        ]
        for name in metric_names:
            value = e["metrics"].get(name, "")
            cells.append(f"{value:.3f}" if isinstance(value, float) else str(value))
        lines.append("| " + " | ".join(cells) + " |")
    LEDGER_MD.write_text("\n".join(lines) + "\n")
    return LEDGER_MD
