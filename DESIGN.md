---
name: The Microdilution Read
description: A virtual screen read like the assay its labels came off, every predicted score shown with its distance.
colors:
  plate: "#081a52"
  void: "#040c26"
  plate-raised: "#0e2470"
  growth: "#e8341f"
  broth: "#a9c6e8"
  clear: "#1034a6"
  rim: "#dce6f5"
  ink: "#eef3fc"
  ink-dim: "#93a7c4"
  ink-faint: "#6e84a6"
typography:
  thesis:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.1rem, 3.7vw, 3.25rem)"
    fontWeight: 600
    lineHeight: 0.95
    letterSpacing: "-0.035em"
    fontVariation: "'wdth' 112"
  section:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.6rem, 2.6vw, 2.35rem)"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
    fontVariation: "'wdth' 112"
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
  small:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.375
    letterSpacing: "normal"
  legend:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.07em"
    fontVariation: "'wdth' 94"
  measure:
    fontFamily: "Martian Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.375
    letterSpacing: "-0.02em"
    fontFeature: "'tnum' 1"
rounded:
  none: "0px"
  focus: "2px"
  well: "50%"
spacing:
  well: "52px"
  well-gap: "10px"
  tight: "0.625rem"
  row: "1.5rem"
  column-gap: "3.5rem"
  section: "6rem"
components:
  well:
    backgroundColor: "{colors.void}"
    rounded: "{rounded.well}"
    size: "{spacing.well}"
  well-liquid:
    backgroundColor: "{colors.clear}"
    width: "100%"
  well-struck:
    backgroundColor: "{colors.growth}"
    rounded: "{rounded.well}"
  well-twin:
    backgroundColor: "{colors.void}"
    rounded: "{rounded.well}"
  well-read:
    backgroundColor: "{colors.void}"
    rounded: "{rounded.well}"
    size: "calc({spacing.well} * 1.14)"
  strain-plate:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0.75rem 0.875rem"
  strain-plate-active:
    backgroundColor: "{colors.plate-raised}"
    textColor: "{colors.ink}"
  read-bar:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    typography: "{typography.measure}"
    padding: "0.625rem 0"
  slip:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "1.25rem 0 0"
  plate-edge:
    backgroundColor: "{colors.void}"
    textColor: "{colors.ink-dim}"
    typography: "{typography.legend}"
    padding: "0.875rem 3rem"
---

# Design System: The Microdilution Read

## Overview

**Creative North Star: "The Plate Under Transmitted Light"**

The surface is a 96-well microdilution plate on a reader's bench, lit from
behind. Nothing here is a dashboard dressed in lab colours: the ground is the
colour of a resazurin well where nothing grew, the wells are circles of
polystyrene with liquid in them, and a measurement is drawn as a physical
quantity, a liquid level, a turbidity, a line across the glass, before it is
ever written as a number. The register is clinical and unhurried. Density is
high because a plate is dense, but every dense region is a grid, never a
collage.

The system is dark only and committed, not accented. One colour carries the
entire page; the three others are reserved, and their rarity is what makes them
readable in a compressed video frame at 1080p. There are no gradients used as
surface, no glow, no glass, no card stack, no rounded panels. Depth exists only
where a real well has it: a 1px rim and the specular line the reader's lamp puts
on the plastic.

The hardest commitment in the built system is that **state is geometry**. A
candidate outside the applicability domain is struck through with a diagonal; a
fingerprint twin wears an inked ring; an unmarked well is in-domain. Colour
moves with those marks but never carries them alone, so the whole read survives
greyscale and survives a bad projector.

**Key Characteristics:**
- One committed ground (`#081a42`) across every surface; no light mode exists.
- State drawn in form, strike, ring, absence, never in hue alone.
- Three type registers and no more, with the display scale set by Archivo's
  width axis rather than by weight.
- Every measurement in Martian Mono with tabular figures; prose in Archivo.
- Square everything except the well, which is a circle because a well is round.
- Motion is step-only, no easing curve anywhere: 72–90ms for a state change,
  and as many steps as the instrument would have taken for a quantity drawn.
- The plate is read rather than shown, and the head that reads it is visible.

## Colors

Three colours carry the brand and nothing else is allowed in: Egyptian blue,
stone blue, and scarlet in small touches. The token names are roles rather than
hues and outlived the palette they were named in — `broth` is the measurement
colour, `growth` is the colour of a result you cannot use, `clear` is
transmitted light. Changing what they point at re-skins the surface without
touching a component, which is how this palette replaced the previous one.

### Primary
- **Egyptian Blue Ground** (`#081a52`): the oldest manufactured pigment there
  is, pulled down to hold a page. Background, every panel, every button face. It
  is not a surface colour among several; it is the whole surface, and panels are
  told apart by hairlines, not by tinted boxes.
- **Plate Edge** (`#040c26`): the darker edge stock. The top strip, the footer,
  the record strip, and the inside of an empty well.
- **Lifted Plate** (`#0e2470`): one step up from ground, used only for the
  selected strain plate and its hover. The single tonal lift in the system.

### Secondary
- **Egyptian Blue** (`#1034a6`): the pigment at full strength, used only as the
  light coming through a clear well. Never a UI colour; it exists so that
  turbidity has something to cloud.
- **Stone Blue** (`#a9c6e8`): every measured quantity on the surface. Turbidity,
  the read line, a bar, a plotted point, the focus ring. A clear well stays deep
  Egyptian blue and a cloudy one goes milky stone, which is what the eye
  actually does at a plate reader.
- **Scarlet** (`#e8341f`): rare on purpose. It means exactly one thing, a value
  that cannot be banked, so it appears on an out-of-domain well, the rule above
  that tier, and a missing record. The one sanctioned exception is the numeral
  in each page's thesis, which is scarlet because it is the number the whole
  surface exists to defend.

### Neutral
- **Polystyrene Light** (`#dce6f5`): rim and hairline stock. Never shipped at
  full strength on a flat surface: the rim is it at 26%, the hairline at 14%,
  the meniscus at 72%. Full strength only on the inked twin ring.
- **Plate Ink** (`#eef3fc`): body copy, headings, numerals that are in range.
- **Dimmed Ink** (`#93a7c4`): ledes, captions, the second line under a number.
- **Faint Ink** (`#6e84a6`): plate coordinates, legend labels, the quietest
  provenance line.

### Named Rules

**The Committed Ground Rule.** `#081a52` carries the page. A new surface does
not get its own background colour; it gets a hairline and a heading. Only the
plate edge and the selected strain may differ, and both are already spoken for.

**The Scarlet Reservation Rule.** Scarlet is never decoration and never a hover.
As a *mark* it appears only where a value cannot be banked. As *type* it appears
once per page, on the thesis numeral, and nowhere else. If scarlet is on a screen
with no such value on it and no thesis, the screen is wrong.

**The Form-Not-Hue Rule.** Every tier distinction ships as a mark as well as a
colour: struck diagonal for outside the read, an inked ring for a fingerprint
twin, no mark at all for in-domain. Print the screen in greyscale; if a tier
disappears, it was never drawn. The copy obeys this too: no sentence on the
surface names a colour, because a sentence that does is a sentence that breaks
when the palette changes.

## Typography

**Display Font:** Archivo (variable, `wdth` axis), with `ui-sans-serif, system-ui`
**Body Font:** Archivo, same family, same fallback
**Label/Mono Font:** Martian Mono, with `ui-monospace, monospace`

**Character:** Archivo expanded reads like a plate-edge label written in marker:
broad, square-shouldered, legible at distance and through video compression.
Martian Mono is deliberately mechanical and sits beside it as evidence rather
than as voice, the moment a string is a measurement, an identifier, a SMILES or
a DOI, it stops being prose.

### Hierarchy
- **Thesis** (600, `clamp(2.1rem, 3.7vw, 3.25rem)`, 0.95, `-0.035em`, `wdth` 112):
  the one page-opening claim. One per page.
- **Section** (600/500, `clamp(1.6rem, 2.6vw, 2.35rem)`, 1.25, `-0.025em`,
  `wdth` 112): section headings and the active strain binomial. Headings are
  full sentences, not labels.
- **Body** (400, 1rem, 1.65): ledes and running argument, held to a 58ch
  measure.
- **Small** (400, 0.875rem, ~1.5): captions under a chart, the read bar, slip
  fields.
- **Legend** (500, 0.75rem, `0.07em`, uppercase, `wdth` 94, dim ink): field
  labels, column headers, plate coordinates. The floor of the system and the
  floor for 1080p video.
- **Measure** (Martian Mono, tabular figures, `-0.02em`): every number,
  identifier, hash, Tanimoto, SMILES, DOI.

### Named Rules

**The Three Registers Rule.** Body, small, legend. Three sizes carry all non-
display text, and a new component picks one of them rather than inventing a
fourth. Display is two clamps and is reserved for the thesis and section heads.

**The Width-Axis Rule.** Scale is expressed through Archivo's width axis, not
through a weight ramp: display sets `wdth` 112, legends set `wdth` 94. Weight
moves between 400, 500 and 600 and no further; `font-synthesis-weight` is off,
so a faked weight will simply not render.

**The Measurement-Is-Mono Rule.** If a string is a measured or recorded value, it
is set in Martian Mono with `tnum` on. If it is an argument about those values,
it is Archivo. There is no third case.

## Layout

A single centred column of at most 96rem, inset 1rem / 2rem / 3rem as the
viewport widens. Above `lg` the page runs on one asymmetric two-column grid, `minmax(0, 27rem)` of argument against `minmax(0, 1fr)` of evidence, with a
3.5rem column gap. Every section reuses that same grid, so the argument column
stays a fixed reading rail down the whole page and the evidence column takes
whatever width is left.

Sections are separated by a 6–8rem gap and a top hairline, never by a filled
band. Within a section, rows are divided by hairlines with 1.5rem of air above
and below, first row unruled. Prose is capped at 58ch; nothing in the system
centres a text block.

The plate itself carries its own geometry as variables so every part shares one
measure: 52px wells on a 10px gutter, 12 columns by 8 rows, column numerals and
row letters set in the legend register in faint ink. The two tiers are two
separate grids with a labelled hairline between them, so a grid never contains a
rule for one of its own children.

Below `md` the plate is replaced, not shrunk: it becomes a hairline-divided list
of rows carrying the same four facts (mark, structure, identifier, score over
distance). The plate is a desktop artifact and the system says so rather than
scaling it to illegibility.

A build-level note that belongs with the layout: `html` and `body` carry
`overflow-x: clip`. Styling the scrollbar makes Chrome reserve a classic gutter,
which showed up as a 13px phantom in the document's scroll width on narrow
viewports; nothing is laid out in it. `clip` removes the phantom without
creating a scroll container the way `hidden` would.

### Named Rules

**The One Rail Rule.** Every section uses the same 27rem argument rail against a
fluid evidence column. A new section does not get a new grid; it gets a heading,
a lede, and whatever evidence belongs in the right-hand column.

**The Comparison-On-The-Line Rule.** No value ships without its comparison on
the same axis or the same line: every score against its base rate, every metric
against its ceiling, every predicted probability against its distance. A lone
number is an incomplete component.

## Elevation & Depth

This system is flat everywhere except inside a well, and the exception is
physical rather than decorative. There is no card elevation, no hover lift, no
ambient shadow under a panel, no backdrop blur. Separation is done with 1px
hairlines of polystyrene light at 14% and with the ground's two tonal steps.

The well is the one place depth exists, because a real well has a rim that
catches the reader's lamp: an inset 1px highlight at the top of the bore, a
tight 1px contact shadow under the circle, and a 1px meniscus line at the top of
the liquid. Those three together read as plastic and liquid; separately they
read as nothing.

### Shadow Vocabulary
- **Well rest** (`inset 0 1px 2px rgb(215 227 244 / 20%), 0 1px 2px rgb(0 0 0 / 40%)`):
  the default bore. Specular inside, contact outside.
- **Well read** (`inset 0 1px 2px rgb(215 227 244 / 28%), 0 2px 6px rgb(0 0 0 / 55%), 0 0 0 1px #e8b93f`):
  the hovered or focused well, combined with a 1.14 scale step.
- **Twin ring** (`0 0 0 2px #081a42, 0 0 0 3px #d7e3f4`): the ring a reader inks
  by hand around a fingerprint twin. A ground-coloured gap, then the ring.

### Named Rules

**The Transmitted-Light Rule.** Light in this world comes through the plate from
behind. Shadows exist only on the well and only at 1–2px. No glow, no glass, no
soft drop shadow under a panel, and no shadow at all on anything rectangular.

## Shapes

Square by default, circular only where the object is round. Panels, buttons,
slips, tiers and the top strip all have zero radius; dividing is done by a 1px
line, not by a corner. The only radii in the built system are the well's `50%`
and the 2px softening on the focus ring.

The well is the system's silhouette: a circle with a 1px polystyrene rim, a
liquid filled from the bottom whose height is a measured quantity, a 1px
meniscus at its surface, and a straw cutoff line drawn at a fixed 32.8% of every
well including the empty ones. Empty wells stay on the plate as a real plate's
controls, with their rim and a dimmed cutoff line and no liquid.

The one diagonal in the system is the strike across an out-of-domain well, a
hairline drawn corner to corner through the centre. It is a mark, not a texture,
and it is the only place a gradient appears: as the means of drawing a 1px line
across a circle, never as a surface fill.

## Components

### The Well (signature)
The system's primitive. Every other component is a frame around a reading of it.
- **Shape:** circle (`50%`), 52px, 1px rim at 26% polystyrene light.
- **Two independent physical channels:** liquid height is the nearest-training
  Tanimoto (`--level`); liquid colour is the predicted probability mixed as
  turbidity (`--turbidity`) from broth straw into lit liquid. Neither channel
  is a colour ramp and neither is decorative.
- **Read line:** a straw hairline across every well at the domain cutoff
  (32.8%), at 78% on a filled well and 30% on an empty one.
- **States:** no mark = in-domain; a growth-pink diagonal strike plus a
  pink-shifted liquid = outside the read; a full-strength polystyrene ring with
  a ground-coloured gap = fingerprint twin of a training compound.
- **Hover / focus:** the rim goes to full polystyrene, the well scales 1.14 in a
  single two-frame step, and a 1px straw outline closes it. Hover and keyboard
  focus produce exactly the same read.
- **Empty:** rim and dimmed cutoff only. Empty wells are kept, not removed.

### Strain Plates (navigation)
Three stacked plate labels in the argument rail, hairline-separated by a 1px
grid gap over ground.
- **Style:** ground face, binomial in italic 1rem medium, envelope in the legend
  register, counts in mono. Zero radius.
- **Selected:** lifted plate ground (`#0b2252`) and a filled 8px straw dot;
  unselected shows a hollow dot ringed in faint ink.
- **Hover:** lifts to the same raised ground over 90ms linear. Switching strains
  re-reads the plate: the head crosses it again and the wells fill behind it.
  The plate never pans, and it never cross-fades between strains; the old read
  is gone before the new one starts. Changed 7 Nov from the original hard cut,
  because the numbers on this page are produced by a read, and a plate that
  changed without being read would be asserting them instead.

### Read Bar
One line between two hairlines directly under the strain heading, carrying the
currently read well: coordinate, rank, skeleton, predicted score, nearest
distance, source plant. It is the line that visibly changes while a well is
hovered, so the signature interaction survives a screen recording. Values in
mono; the distance turns growth pink when it falls below the cutoff.

### Determination Slip
The full read of one well, written across the page width under the plate rather
than floated over it.
- **Shape:** zero radius, no background, opened by a top hairline and 1.25rem of
  air. It is a sheet of paper, not a modal.
- **Structure call-out:** the 2D depiction drawn in-browser from the canonical
  SMILES at its own true size in the surface's palette (carbon in plate ink,
  oxygen in growth pink, sulfur and phosphorus in broth straw), never fitted to
  a card.
- **Fields:** legend-register label, a mono value at 1.5rem, and a dimmed second
  line carrying the comparison that value must be read against.
- **Flags:** a twin carries a straw left-border note in straw text; missing
  provenance and a missing DOI are stated in growth pink, in words.

### Measured Scale
A 1px hairline track with faint tick marks, one 2px mark per value coloured by
tone (ink / dim / growth / broth), and one label per tier below it so labels can
never collide. Each label is anchored in proportion to its own position, so the
leftmost starts at the track edge and the rightmost ends at it and neither can
push the page wider. This is the house chart: no axes, no gridlines, no legend
box.

### Figures (the pipeline story)
The `/pipeline` surface tells the build as twelve beats of one scroll, and its
figures are built from the same four things as the rest of the system: a
hairline, a filled block, a circle, and the diagonal strike.
- **Funnel:** a descending run of blocks, each as wide as its share of the
  first, with the count it cut written between the rows. A `log` track where a
  run spans orders of magnitude, said so in the figure's own label.
- **Strip:** one quantity split into its parts along a single track, each part
  named and counted below it.
- **Detail:** a quantity too small to see at full scale, drawn twice and tied
  by two hairlines, so a sliver can be magnified without being exaggerated.
- **Overlap:** two blocks and the band where they meet.
- **Cells:** one bordered square per thing counted, so 37 unit strings and 18
  refusals are seen rather than read. A refused cell carries the strike.
- **Slope:** the same model read at three stations; a 1.5px line and a square
  node per reading, value in mono above it. One line per chart, named by the
  heading rather than a legend.
- **Spread:** estimates of one effect on an axis with zero drawn full height.
- **Chain:** blocks joined by a straw hairline, for sources feeding a table and
  stages feeding a ledger. A struck title is a source we did not use.
- **Margin rule:** a hairline down the left gutter, carrying the stage numeral
  of each beat and filling in straw with the share of the page read. It is the
  one sticky element in the system and it holds no controls.

### Plate Edge (header) and Plate Foot (footer)
Full-bleed `#050f2b` strips against the ground, divided by a single hairline.
The header carries event and track in the legend register at left and the run
provenance in mono at right, progressively revealed as the viewport allows. The
footer carries the obligations, repository, generative-AI disclosure,
traditional-knowledge statement, in three columns of small dimmed text. Neither
strip is a navigation bar and neither is sticky.

### Record Strip
The operator's edge, present only in record mode (`R`), which walks the pitch's
twelve beats from the keyboard so a take never depends on finding a well with
the mouse. Same `#050f2b` stock and same hairline as the header and footer, at
the bottom of the viewport: beat number in mono, the beat's name, the next
beat's name in faint ink, and the key legend at the right. `H` hides it for a
clean frame.

It is fixed, which the No-Overlay Rule otherwise forbids, and it earns the
exception by being the third plate edge rather than a panel: zero radius, no
shadow, no tint, nothing of the page behind it showing through, and nothing in
it to click. The beats themselves are written out in `docs/video-script.md`, so
the running order on screen and the narration are one list.

### Links and Focus
Links are plate ink with a 1px underline in straw at 62%, offset 0.22em, going
to full straw on hover in a single 90ms two-frame step. Focus is a 2px straw
outline at 2px offset (3px on a well), and it is never removed.

### Named Rules

**The Step-Only Rule.** Every transition in this system is a step function or a
90ms linear colour change. There is no easing curve anywhere, and there is no
exception for a sequence that would "feel better" with one. A state change is
`steps(2, end)` at 72–90ms; a quantity being drawn takes as many steps as the
instrument would have taken to draw it, up to the twelve of a plate read.

**The Read Rule.** The plate is read, never simply shown. A read is one pass of
the head across the twelve columns at `--read-tick` (96ms), the liquid filling a
column behind the head as it clears it, the read bar reporting the first well in
each column as it is passed, the domain rule drawing itself once the head is off
the far edge, and the read settling on rank 1. It runs on load, on a strain
change, and on demand, and it is the only thing that puts liquid in a well.
Touching the plate ends the read: the reader has taken over. The head is a
one-column band of straw at 11% carrying a 1px straw edge; it exists only while
a read is running. `prefers-reduced-motion` renders the plate already read, with
no head.

**The Backwards-Fill Rule.** Any animation of `clip-path` fills `backwards`,
never `both`. A clip-path animation that keeps filling forwards holds its
composited layer open after it has finished, and the element can be missing
from a captured frame for as long as that layer lives — which on a surface whose
job is to be screen-recorded is a dropped headline, not a cosmetic bug.

**The Plot-On-Arrival Rule.** A figure in the story draws itself once as it
comes into view, in steps, the way the instrument would have plotted it: bars
grow from their own baseline, a slope line is laid down in eight steps, wells
fill column by column. Every range closes by the time the element is fully in
view, so a proportional bar is never left part-drawn where it would read as a
different number. It is scroll-driven CSS and nothing else; a browser without
`animation-timeline`, and anyone who asked for reduced motion, gets every
figure already finished.

**The No-Overlay Rule.** The detail of a well opens in place, under the plate,
across the full page width. Nothing in this system floats above the plate: no
modal, no popover, no tooltip.

## Do's and Don'ts

### Do:
- **Do** carry the ground `#081a42` on every surface and separate panels with a
  1px polystyrene hairline at 14%, not with a tinted box.
- **Do** draw a measured quantity as a physical channel first, liquid height,
  turbidity, a mark on a shared axis, and write the number beside it in mono.
- **Do** ship every value with its comparison on the same line or the same axis:
  score against base rate, metric against ceiling, probability against distance.
- **Do** give every tier a mark as well as a colour, and check the screen in
  greyscale before shipping it.
- **Do** keep type to the three registers (1 / 0.875 / 0.75rem) and express
  display scale through Archivo's width axis (`wdth` 112 display, 94 legend).
- **Do** set every identifier, hash, Tanimoto, SMILES and DOI in Martian Mono
  with tabular figures.
- **Do** state a defect in words, in growth pink, where the defect is, a
  missing plant, a missing DOI, a score that is not evidence.
- **Do** replace the plate with a list below `md` rather than shrinking it.

### Don't:
- **Don't** introduce a light mode or a second background colour. `color-scheme`
  is dark and the ground is the world.
- **Don't** spend growth pink on anything that is not growth, out-of-domain, or
  a missing record, not on hover, not on a brand accent, not on an error that
  is merely an error.
- **Don't** put a shadow, glow, blur or glass effect on anything rectangular.
  Depth belongs to the well's rim and meniscus and nowhere else.
- **Don't** use a gradient as a surface. The only gradient in the system draws
  the 1px strike across an out-of-domain well.
- **Don't** round a rectangle. Radius belongs to the well (`50%`) and to the 2px
  focus ring.
- **Don't** add an easing curve. If a change needs to feel smooth, it is the
  wrong change.
- **Don't** float detail over the plate in a modal, popover or tooltip.
- **Don't** encode a tier in colour alone, and don't let a number appear without
  the thing it must be read against.
- **Don't** add a fourth type size or a synthesised weight; `font-synthesis-weight`
  is off and a faked weight will not render.
