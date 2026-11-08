#!/usr/bin/env python3
"""Check each voice take against the numbers printed on its slide.

The narration opens with one rule: "Say the numbers exactly as they are
printed on the slide; do not round them up." A misread AUROC is the kind of
error an ear slides straight past and a reader does not, so this reads.

Each take is transcribed with whisper.cpp, every number in the transcript is
pulled out, and those are compared against the numbers in the matching
<section> of deck.html.

A number SPOKEN BUT NOT ON THE SLIDE is the high-signal case: either a
misreading, or a figure quoted from memory that the slide does not support.
Those are listed first and are worth listening to.

A number on the slide but not spoken is normal and mostly noise, because the
tables carry far more figures than anyone reads aloud. It is reported only as
a count.

What this does NOT do: judge how anything sounds. It cannot hear tone, pacing,
a mumble or whether a take is good. It reads words.

    ./check.py          every take found
    ./check.py 05       just slide 5
"""
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
DECK = HERE.parent / "docs" / "deck" / "deck.html"
MODEL = Path.home() / ".local/share/whisper/ggml-base.en.bin"
EXTS = ("m4a", "mp3", "wav", "aac", "caf", "flac")

# Spoken forms whisper writes as words rather than digits, and that the deck
# prints as digits. Without these every one would read as a false alarm.
WORD_NUM = {
    "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4",
    "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9",
    "ten": "10", "eleven": "11", "twelve": "12", "fifty": "50",
}


UNITS = {"zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
         "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
         "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14,
         "fifteen": 15, "sixteen": 16, "seventeen": 17, "eighteen": 18,
         "nineteen": 19}
TENS = {"twenty": 20, "thirty": 30, "forty": 40, "fifty": 50, "sixty": 60,
        "seventy": 70, "eighty": 80, "ninety": 90}
SCALES = {"hundred": 100, "thousand": 1000, "million": 1_000_000}


def word_numbers(text: str) -> list[str]:
    """Numbers spoken as words. Whisper writes large figures as digits but
    often leaves small ones as words, so "three percent" and "four times"
    were invisible to a digits-only scan and a slide's key statistic could go
    unchecked. Handles plain compounds and "N point N"."""
    toks = re.findall(r"[a-z]+", text.lower())
    out, i = [], 0
    while i < len(toks):
        if toks[i] not in UNITS and toks[i] not in TENS:
            i += 1
            continue
        total = run = 0
        start = i
        while i < len(toks):
            t = toks[i]
            if t in UNITS:
                run += UNITS[t]
            elif t in TENS:
                run += TENS[t]
            elif t in SCALES:
                if SCALES[t] == 100:
                    run = (run or 1) * 100
                else:
                    total += (run or 1) * SCALES[t]
                    run = 0
            elif t == "and" and run:
                pass
            else:
                break
            i += 1
        value = total + run
        if i == start:
            i += 1
            continue
        # "zero point seven one nine" -> 0.719
        if i < len(toks) - 1 and toks[i] == "point":
            digits = ""
            j = i + 1
            while j < len(toks) and toks[j] in UNITS and UNITS[toks[j]] < 10:
                digits += str(UNITS[toks[j]])
                j += 1
            if digits:
                out.append(f"{value}.{digits}")
                i = j
                continue
        out.append(str(value))
    return out


def _num(v: str):
    try:
        return float(v)
    except ValueError:
        return None


def numbers(text: str) -> list[str]:
    """Every number in a string, digits or words, normalised."""
    out = []
    for raw in re.findall(r"\d[\d,]*(?:\.\d+)?", text):
        n = raw.replace(",", "").rstrip(".")
        if n:
            out.append(n)
    out.extend(word_numbers(text))
    return out


def slide_numbers(n: int) -> set[str]:
    """Numbers printed on slide n, read from deck.html."""
    html = DECK.read_text(encoding="utf-8")
    sections = re.findall(r"<section class=\"slide.*?</section>", html, re.S)
    if n > len(sections):
        return set()
    body = sections[n - 1]
    body = re.sub(r"<[^>]+>", " ", body)          # strip tags
    body = body.replace("&ndash;", " ").replace("&minus;", " ")
    return set(numbers(body))


def find_take(n: str) -> list[Path]:
    """Every file for this slide: one whole take, or lettered parts in order."""
    for ext in EXTS:
        p = HERE / "audio" / f"slide-{n}.{ext}"
        if p.exists():
            return [p]
    out = []
    for part in "abcdef":
        for ext in EXTS:
            p = HERE / "audio" / f"slide-{n}{part}.{ext}"
            if p.exists():
                out.append(p)
                break
    return out


def transcribe(path: Path) -> list[tuple[str, str]]:
    """[(timestamp, text)] per segment.

    Timestamps are kept, not stripped with -nt, for two reasons. They let a
    flagged number be reported at the second it was spoken, so a take can be
    checked without replaying it whole. And the timestamped mode measurably
    decodes better: on slide 4 the -nt pass produced "Instead of plant
    compounds" where this one produced the correct "Only 3% of plant
    compounds", from identical audio. That false alarm cost a round trip.
    """
    wav = HERE / "seg" / f"_tx-{path.stem}.wav"
    wav.parent.mkdir(exist_ok=True)
    subprocess.run(
        ["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(path),
         "-ar", "16000", "-ac", "1", str(wav)], check=True)
    r = subprocess.run(
        ["whisper-cli", "-m", str(MODEL), "-f", str(wav)],
        capture_output=True, text=True, check=True)
    wav.unlink(missing_ok=True)
    out = []
    for line in r.stdout.splitlines():
        m = re.match(r"\[(\d+):(\d+):([\d.]+) --> [^\]]+\]\s*(.*)", line.strip())
        if m and m.group(4).strip():
            secs = int(m.group(2)) * 60 + float(m.group(3))
            out.append((f"{int(secs)//60}:{int(secs) % 60:02d}", m.group(4).strip()))
    return out


def main() -> int:
    if not MODEL.exists():
        print(f"model not found at {MODEL}")
        return 1
    only = sys.argv[1] if len(sys.argv) > 1 else None
    wanted = [only] if only else [f"{i:02d}" for i in range(1, 11)]

    flagged = 0
    for n in wanted:
        takes = find_take(n)
        if not takes:
            continue
        print(f"\n{'='*70}\nslide {n}   {' + '.join(t.name for t in takes)}")
        segs = [s for t in takes for s in transcribe(t)]
        text = " ".join(s for _, s in segs)
        said = numbers(text)
        # Which second each number was spoken at, for checking by ear.
        when = {}
        for ts, seg in segs:
            for v in numbers(seg):
                when.setdefault(v, ts)
        on_slide = slide_numbers(int(n))

        # Three outcomes, not two. The narration deliberately speaks some
        # figures short ("zero point seven two" for a printed 0.719), so a
        # rounded match is worth knowing about but is not an error; only a
        # number that matches nothing on the slide is.
        def classify(s: str) -> tuple[str, str]:
            trim = lambda v: v.rstrip("0").rstrip(".") if "." in v else v
            for v in on_slide:
                if v == s or trim(v) == trim(s):
                    return "exact", v
            # Candidates for a rounded match. An AUROC is routinely spoken as
            # "eighty-five" for a printed 0.850, so a bare 1-99 integer is
            # also tried as 0.NN before it is called absent.
            # A whole number spoken for a printed decimal: "three percent" for
            # a slide's 3.4%, which is the script's own convention and not an
            # error. Checked before the 0.NN form so 3 matches 3.4, not 0.03.
            if s.isdigit():
                near = [(abs(float(v) - float(s)), v) for v in on_slide
                        if _num(v) is not None and round(float(v)) == int(s)]
                if near:
                    return "rounded", min(near)[1]
            forms = [s]
            if s.isdigit() and 1 <= len(s) <= 2:
                forms.append(f"0.{s}")
            hits = []
            for f in forms:
                if "." not in f:
                    continue
                dp = len(f.split(".")[1])
                for v in on_slide:
                    try:
                        if f"{float(v):.{dp}f}" == f:
                            hits.append((abs(float(v) - float(f)), v))
                    except ValueError:
                        pass
            if hits:
                return "rounded", min(hits)[1]   # nearest, not merely first

            # Large counts are spoken as round numbers: "sixty-four thousand"
            # for a printed 63,849, "fourteen hundred" for 1,457. Those are
            # neither exact nor a decimal rounding, so match within 5%, which
            # is loose enough for truncation and tight enough that a genuine
            # misreading (74,000 for 63,849, 16% out) still lands as absent.
            try:
                sv = float(s)
            except ValueError:
                return "absent", ""
            if sv >= 1000:
                near = []
                for v in on_slide:
                    try:
                        fv = float(v)
                    except ValueError:
                        continue
                    if fv and abs(fv - sv) / fv <= 0.05:
                        near.append((abs(fv - sv), v))
                if near:
                    return "approx", min(near)[1]
            return "absent", ""

        exact, rounded, approx, absent = [], [], [], []
        for s in said:
            kind, v = classify(s)
            {"exact": exact, "rounded": rounded,
             "approx": approx}.get(kind, absent).append((s, v))

        print(f"  spoken numbers : {', '.join(said) if said else '(none)'}")
        if rounded:
            print("  rounded        : " + ", ".join(
                f"said {s}, slide prints {v}" for s, v in rounded))
        if approx:
            print("  spoken round   : " + ", ".join(
                f"said {s}, slide prints {v}" for s, v in approx))
        if absent:
            flagged += len(absent)
            print("  NOT ON SLIDE   : " + ", ".join(
                f"{s} (at {when.get(s, '?')})" for s, _ in absent)
                + "   <-- listen to these")
        if not rounded and not approx and not absent and said:
            print("  every spoken number matches the slide exactly")
        print(f"  (slide prints {len(on_slide)} numbers in total)")
        print(f"\n  transcript:\n    {text}")

    print(f"\n{'='*70}")
    if flagged:
        print(f"{flagged} spoken number(s) not found on their slide. "
              "Some will be transcription noise; check each by ear.")
    else:
        print("No spoken number is missing from its slide.")
    print("This checks numbers only. It says nothing about how it sounds.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
