#!/usr/bin/env python3
"""Fill in the per-slide word counts and timecodes in narration.md.

Counts only the spoken lines (the "> " blockquotes), so the editorial notes
around them never inflate the running time. Rewrites every *TIMING* marker, or
the line it previously generated, so the script is safe to rerun after an edit.
"""
import re, sys, pathlib

WPM = 145.0  # measured, unhurried delivery

p = pathlib.Path(__file__).with_name("narration.md")
text = p.read_text()

# Split on slide headings, keeping the preamble intact.
parts = re.split(r'(?m)^(## Slide .*)$', text)
preamble, blocks = parts[0], parts[1:]

out, t, total = [preamble], 0.0, 0
def clock(s): return f"{int(s)//60}:{int(s)%60:02d}"

for head, body in zip(blocks[0::2], blocks[1::2]):
    spoken = " ".join(l[2:] for l in body.splitlines() if l.startswith("> "))
    n = len(spoken.split())
    total += n
    start, t = t, t + n / WPM * 60
    line = f"*{n} words · {clock(start)} – {clock(t)}*"
    body, hits = re.subn(r'(?m)^\*(?:TIMING|\d+ words · .*)\*$', line, body)
    if hits != 1:
        sys.exit(f"expected one timing marker in {head!r}, found {hits}")
    out += [head, body]

text = "".join(out)
summary = (f"**Total: {total:,} words, {clock(total/WPM*60)} "
           f"at a measured {int(WPM)} words per minute.** The cap is ten minutes.")
text, hits = re.subn(r'(?m)^\*\*(?:TOTALLINE|Total: .*?)\*\*.*$', summary, text, count=1)
if hits != 1:
    sys.exit("expected one total marker in the preamble, found none")
p.write_text(text)
print(summary)
