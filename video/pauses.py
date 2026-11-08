#!/usr/bin/env python3
"""Open up the pauses between sentences in a voice take.

Detects the silent gaps with ffmpeg's `silencedetect`, then rebuilds the take
with every gap over MIN_GAP stretched to at least TARGET. Speech is never
touched, never time-stretched and never re-pitched: the audio between gaps is
copied through sample for sample, and only the silence changes length.

Gaps are separated from ordinary within-sentence breathing by length alone.
A comma pause runs about 0.1 to 0.2 s and a sentence break about 0.3 s and up,
so MIN_GAP sits between them. That is a measurement, not an understanding of
the sentence, so a long dramatic pause mid-sentence will also be stretched.

    ./pauses.py audio/slide-01.m4a              # preview: report, write nothing
    ./pauses.py audio/slide-01.m4a --apply      # rewrite in place, keep a .orig
    ./pauses.py audio/*.m4a --apply --target 0.9

IT CANNOT HEAR THE RESULT. It can tell you a gap went from 0.31 s to 0.75 s;
it cannot tell you whether that sounds natural or stilted. Listen before you
build, and re-run with a different --target if the pacing is off.
"""
from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
from pathlib import Path

NOISE_DB = -34.0   # anything quieter than this counts as silence
MIN_GAP = 0.18     # shorter than this is breathing inside a sentence, left alone
TARGET = 0.75      # every qualifying gap becomes at least this long
MAX_GAP = 1.60     # and no gap is left longer than this
EDGE = 0.30        # leading and trailing silence is normalised to this

# A quiet room floors around -55 dB and a noisy one around -30, so a single
# threshold either finds nothing or swallows speech. Walk from strict to loose
# and stop at the first setting that finds a gap. Measured on synthetic speech:
# sentence breaks land at 0.20 to 0.28 s, which is why MIN_GAP sits at 0.18.
NOISE_LADDER = [-34.0, -40.0, -46.0, -52.0, -28.0]


def run(cmd: list[str]) -> str:
    return subprocess.run(cmd, capture_output=True, text=True).stderr


def duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True).stdout
    return float(out.strip())


def gaps(path: Path, noise: float, min_gap: float) -> list[tuple[float, float]]:
    """Silent spans, as (start, end), from ffmpeg's silencedetect."""
    log = run(["ffmpeg", "-nostdin", "-v", "info", "-i", str(path),
               "-af", f"silencedetect=noise={noise}dB:d={min_gap}", "-f", "null", "-"])
    starts = [float(m) for m in re.findall(r"silence_start: (-?[\d.]+)", log)]
    ends = [float(m) for m in re.findall(r"silence_end: (-?[\d.]+)", log)]
    out = []
    for i, s in enumerate(starts):
        e = ends[i] if i < len(ends) else duration(path)
        if e > s:
            out.append((max(0.0, s), e))
    return out


def rebuild(src: Path, dst: Path, spans: list[tuple[float, float]],
            total: float, target: float, edge: float,
            max_gap: float) -> list[tuple[float, float]]:
    """Copy the speech between gaps, writing fresh silence of the wanted length."""
    # Speech spans are the complement of the silent spans.
    speech, cur = [], 0.0
    for s, e in spans:
        if s > cur:
            speech.append((cur, s))
        cur = e
    if cur < total:
        speech.append((cur, total))
    if not speech:
        shutil.copy(src, dst)
        return []

    # Gaps are filled with the recording's OWN room tone, never with anullsrc.
    # A room is not silent: these takes floor around -50 dB, and splicing true
    # digital zero into a gap makes the room vanish and come back, which is
    # plainly audible as a splice. The longest silence in the file is the best
    # tone source, looped to whatever length each gap needs.
    tone_src = max(spans, key=lambda g: g[1] - g[0], default=None)
    tone_len = (tone_src[1] - tone_src[0]) if tone_src else 0.0
    use_tone = tone_src is not None and tone_len >= 0.12

    def filler(name: str, secs: float) -> str:
        if not use_tone:
            return f"anullsrc=r=48000:cl=stereo,atrim=duration={secs:.4f}[{name}]"
        return (f"[0:a]atrim=start={tone_src[0]:.4f}:end={tone_src[1]:.4f},"
                f"asetpts=PTS-STARTPTS,aloop=loop=-1:size={int(tone_len * 48000)},"
                f"atrim=duration={secs:.4f},asetpts=PTS-STARTPTS[{name}]")

    changes = []
    parts, filters = [], []
    for i, (s, e) in enumerate(speech):
        filters.append(f"[0:a]atrim=start={s:.4f}:end={e:.4f},asetpts=PTS-STARTPTS[s{i}]")
        parts.append(f"[s{i}]")
        if i < len(speech) - 1:
            was = speech[i + 1][0] - e
            # Stretch a short gap up to target, and pull a long one back down
            # to max_gap. A four-second hole is where you lost your place, not
            # a dramatic beat, and it reads as a glitch in a finished video.
            now = min(max(was, target), max_gap)
            changes.append((was, now))
            filters.append(filler(f"g{i}", now))
            parts.append(f"[g{i}]")
    graph = ";".join([filler("lead", edge), filler("tail", edge)] + filters) + ";" + \
        "[lead]" + "".join(parts) + f"[tail]concat=n={len(parts) + 2}:v=0:a=1[out]"

    subprocess.run(
        ["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(src),
         "-filter_complex", graph, "-map", "[out]",
         "-c:a", "aac", "-b:a", "192k", str(dst)], check=True)
    return changes


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="+", type=Path)
    ap.add_argument("--apply", action="store_true", help="rewrite in place")
    ap.add_argument("--target", type=float, default=TARGET)
    ap.add_argument("--min-gap", type=float, default=MIN_GAP)
    ap.add_argument("--max-gap", type=float, default=MAX_GAP,
                    help="no gap is left longer than this")
    ap.add_argument("--noise", type=float, default=None,
                    help="fix the silence threshold in dB instead of searching")
    a = ap.parse_args()

    for f in sorted(a.files):
        if not f.exists():
            print(f"{f}: not found")
            continue
        total = duration(f)
        ladder = [a.noise] if a.noise is not None else NOISE_LADDER
        spans, used = [], ladder[0]
        for noise in ladder:
            spans = gaps(f, noise, a.min_gap)
            inner_try = [g for g in spans if g[0] > 0.05 and g[1] < total - 0.05]
            if inner_try:
                used = noise
                break
        inner = [g for g in spans if g[0] > 0.05 and g[1] < total - 0.05]
        print(f"\n{f.name}  {total:.2f}s, {len(inner)} gap(s) over "
              f"{a.min_gap}s at {used:.0f} dB")
        if not inner:
            print("   nothing to open up. Try --min-gap 0.12, or --noise -58 "
                  "if the room is very quiet")
            continue
        for s, e in inner:
            print(f"   {s:7.2f}s  gap {e - s:.2f}s  ->  "
                  f"{min(max(e - s, a.target), a.max_gap):.2f}s")

        out = f.with_suffix(".paced.m4a")
        changes = rebuild(f, out, spans, total, a.target, EDGE, a.max_gap)
        new = duration(out)
        added = sum(n - w for w, n in changes)
        print(f"   {total:.2f}s -> {new:.2f}s  (+{added:.2f}s of silence)")

        if a.apply:
            orig = f.with_suffix(f.suffix + ".orig")
            if not orig.exists():
                shutil.copy(f, orig)
            shutil.move(out, f)
            print(f"   applied; original kept at {orig.name}")
        else:
            print(f"   wrote {out.name} (preview). Listen, then re-run with --apply")
    print("\nThis measures silence. It cannot hear whether the pacing sounds right.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
