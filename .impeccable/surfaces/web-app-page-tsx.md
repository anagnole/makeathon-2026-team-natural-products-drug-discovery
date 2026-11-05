---
version: 1
slug: "web-app-page-tsx"
primary_target: "web/app/page.tsx"
related_targets: []
---

## Scope

The single public surface of the EthnoHack 2026 Track 2 submission: `web/`, a
static-exported Next.js app over the committed `results/` files. Visitor mode:
**Persuade**. Primary audience is the judging panel, met cold, mostly through a
screen-recorded pitch video. A working chemist is served only where it costs the
first audience nothing.

## Direction contract

**THESIS.** The surface IS the 96-well microdilution plate every label in this
dataset came off, and a plate is read at its boundary, not at its average. It
refuses the arrangement this category always ships, sidebar, KPI cards, a
rotating molecule, an AUROC with no distance beside it, because that layout can
state a score but has nowhere to put the thing that matters here: how far the
compound sits from anything the model has seen.

**OWN-WORLD.** Ground is deep resazurin blue (`#081A42`), the colour of a well
where nothing grew, carrying the whole surface; the dye's pink (`#F0457E`) is held
strictly for growth, the negative read, and the out-of-domain tier; broth straw
(`#E8B93F`) for turbidity and the grey zone; polystyrene light (`#D7E3F4`) for ink
and hairlines. No gradient, no glow, no glass. Components are plate parts: wells
with a 1px polystyrene rim and a single specular meniscus arc, column numerals
1-12 and row letters A-H as the only coordinates, a marker-written plate-edge
label as the top strip, and a determination slip as the only overlay. Archivo
carries legends and display (its width axis is the scale system); Martian Mono
carries every identifier and measurement, skeleton, SMILES, Tanimoto, DOI, because those are data, not a costume. One type size does the work per register.

**STORY.** The visitor understands within seconds that they are looking at a
virtual screen read like an assay; comes to believe the project knows exactly
where its own prediction stops being measured, because the domain boundary is
drawn across the plate with its cutoff on it and the compounds beyond it are
drawn as not read; and acts by picking a well, which opens that compound with its
structure, its distance, its plant, and its DOI.

**FIRST VIEWPORT.** 1440x900, full-bleed `#081A42`. A 56px plate-edge strip
across the top: event and track left, run hash plus "57/57 metrics reproduced"
right in mono, 1px hairline under. Left column x64-560: the thesis at Archivo
Expanded ~64px/0.95, "97,709 plant structures screened. 150 we will defend.", then one 18px method sentence at a 62ch measure, then the read legend as three
well swatches with their marks (clear / turbid / outside the read), then the three
strains as plate labels, each with its cell envelope and its labelled-compound
count; the active strain is the plate on view. Right x620-1376: the plate itself,
12x8 at ~52px wells, 50 in-domain wells in rank order, a hairline across the plate
carrying "applicability domain, Tanimoto 0.328", then the 15 exploratory wells
below it, struck through; the remaining wells stay empty as a real plate's
controls. Fill is turbidity interpolated from predicted probability, never a
colour ramp. State is drawn in form so it survives greyscale: no mark in-domain,
a struck diagonal outside the read, a hand-inked ring on a fingerprint twin.

**FORM.** The microdilution read; candidate 3 of my grounded list ordered by
resonance, assigned by the roll; seed key `520c984e`. Signature interaction:
reading the plate, hover or focus a well lifts its determination slip, and the
arrow keys walk the grid A1 to H12 the way a reader sweeps it. Motion grammar:
the plate reads itself once on load, column by column, twelve `steps(2)` ticks at
90ms with no easing anywhere; switching strains is a hard cut, never a pan; honoured
`prefers-reduced-motion` renders the plate already read.

Raises, each named for the hand it beat:
- RAISE (from the normalled jackfield): state is drawn in form, never in hue.
- RAISE (from the acetate tab board): one size does the work, and every change is
  a two-frame step with no easing.
- RAISE (from the night six-pack): no value ships without its comparison on the
  same line, every score against its base rate, every metric against its ceiling.
- RAISE (from the brick instructions): a true-scale call-out; the opened compound
  shows its structure at its own size, not fitted to a card.
- RAISE (from the wuxia hoarding): each strain is a held frame; moving is a cut.

**FINISH.** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Audience, job, action

Judges deciding scientific relevance, data-science quality, technical
implementation, feasibility, impact and presentation, in a few minutes, usually
narrated. Their action is to read one well and believe the boundary. Secondary:
a chemist choosing what to synthesise.

## Proof and content

Only committed files: `results/shortlist_*.csv` (50 rows each),
`results/exploratory_*.csv` (15 each) with their `.README.txt` warning,
`results/runs.jsonl` for every metric, traced to commit and config hash.
Structures are drawn in-browser from the canonical SMILES. Nothing is invented:
no experimental validation, no citations, no team name, no compound imagery
beyond what SMILES yields.

## Constraints

No health claims, no dosing; output reads as predicted or traditional-use claims.
Licences credited: ChEMBL CC BY-SA, LOTUS CC0, GBIF; NPASS cited as a check only.
Body text must stay legible at 1080p after video compression. Full keyboard reach,
visible focus, and the in-domain / exploratory distinction must survive greyscale.
Static export, no backend, no keys. The app never imports from `notebooks/`.

## Unresolved

Which split leads the headline (scaffold ~0.86 vs plant holdout 0.63-0.72) is an
open team decision; the surface presents the ladder and does not pick. Known
defects to state rather than hide: the top-ranked candidate in all three strains
is a near-copy of a training compound; 12/8/3 rows of 50 lack plant provenance;
`results/evidence_*.csv`'s SHAP column is corrupt and is not surfaced. Team name
unset, so none is displayed.
