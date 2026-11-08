# Submission deck

Team Arxigoi, EthnoHack 2026, Track 2.

`deck.pdf`: ten slides, 16:9, the Devpost slide-deck deliverable.
`narration.md`: the voiceover script, one block per slide, about 8 minutes.

## Rebuilding

```bash
./build.sh
```

Chrome headless renders `deck.html` straight to `deck.pdf`. The `@page` size is
13.333in × 7.5in, which is 16:9 at 96dpi, so one `.slide` section is exactly one
page. Point `CHROME=...` at the binary if it is not in `/Applications`.

After editing `narration.md`, regenerate the counts and timecodes:

```bash
../../.venv/bin/python retime.py
```

## How it is put together

- **Figures are committed artefacts.** `deck.html` references
  `../../notebooks/figures/*.png` by relative path; nothing is re-plotted at
  build time and nothing is traced by hand. Rerunning a notebook changes the
  deck on the next build.
- **Fonts are vendored** in `fonts/` (Archivo, Martian Mono, SIL Open Font
  License). The build needs no network and renders identically later.
- **Palette** follows `DESIGN.md`, which governs the web app, and like the app
  the deck is dark-only: `#081a52` Egyptian blue as the committed ground,
  `#eef3fc` plate ink, `#a9c6e8` stone blue for a measured value, and scarlet
  reserved for a value that cannot be banked, meaning an out-of-domain
  candidate, a reversed result or a missing record. Scarlet is opened one step
  to `#f4573f` so it carries on the dark ground.
- **The figures are not inverted.** They are committed matplotlib artefacts
  drawn on their own off-white (`#fcfcfb`) and cannot be re-rendered without the
  raw downloads, so `figure img` gives them a light card with matching padding
  and a stone-blue hairline. Every axis label and legend stays at full
  legibility, and the panel reads as deliberate rather than as a pasted
  screenshot. If the figures are ever re-plotted on the dark ground, drop the
  card rule and they will meet the slide with no seam.
- **No em dashes.** Punctuation is commas, colons and full stops throughout, in
  `deck.html` and `narration.md` alike. En dashes stay for numeric ranges
  (`400–823`) and for a no-value cell in a table.

## Numbers on the slides

Every figure quoted comes from `results/runs.jsonl` (latest run per stage) or
from `PRODUCT.md`. Two things to keep straight if you edit the content:

- **There is no random-split tier in the main pipeline.** The ladder is
  validation → scaffold-held-out test → plant holdout. A "~0.91 random split"
  line circulated in earlier drafts; it is not in the ledger and is not on any
  slide.
- **The ladder is not monotonic.** *E. coli* scores higher on the scaffold test
  (0.903) than on validation (0.882). Slide 5 states this outright. The
  defensible claim is that the plant holdout is the hardest of the three for
  every pathogen, not that each rung is harder than the last.
- The random/scaffold AUROCs in the `split_comparison` runs come from a
  separate, much smaller experiment (400–823 compounds, a different model).
  They belong only to the plant-family negative result on slide 8.

## Responsible use

No health claims. The deck states on slide 1 that everything shown is a model
prediction over published laboratory measurements, and slide 10 carries the
Nagoya Protocol and Local Contexts obligation and the generative-AI disclosure
pointer. Keep both if you re-cut the deck.
