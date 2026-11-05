---
name: The Microdilution Read
description: A virtual screen read like the assay its labels came off, every predicted score shown with its distance.
colors:
  plate: "#081a42"
  void: "#050f2b"
  plate-raised: "#0b2252"
  growth: "#f0457e"
  broth: "#e8b93f"
  clear: "#2566d6"
  rim: "#d7e3f4"
  ink: "#eaf1fc"
  ink-dim: "#9fb4d8"
  ink-faint: "#7c93bd"
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
- Motion is step-only: `steps(2, end)`, 72–90ms, no easing curve anywhere.

## Colors

A single deep assay blue holds the page, against three reserved signal colours
drawn straight from the chemistry of the read.

### Primary
- **Resazurin Ground** (`#081a42`): the colour of a well where nothing grew.
  Page background, every panel, every button face. It is not a "surface
  colour" among several; it is the whole surface, and panels are told apart by
  hairlines, not by tinted boxes.
- **Plate Edge Black-Blue** (`#050f2b`): the darker edge stock. Used only for
  the top strip, the footer, and the inside of an empty well, the three places
  the plate is not liquid.
- **Lifted Plate** (`#0b2252`): one step up from ground, used only for the
  selected strain plate and its hover. The single tonal lift in the system.

### Secondary
- **Growth Pink** (`#f0457e`): the dye's own colour when something grew. It
  means exactly three things and nothing else, growth, the out-of-domain tier,
  and a missing record (no source plant, no DOI). It is the colour of a result
  you cannot bank.
- **Broth Straw** (`#e8b93f`): the measurement colour. Turbidity mixed into the
  liquid, the applicability-domain read line drawn across every well, the
  pathway bars, the focus ring, the caret, and the one display accent in the
  thesis headline.
- **Lit Liquid** (`#2566d6`): transmitted light through a clear well. Never used
  as a UI colour; it exists so turbidity has something to cloud.

### Neutral
- **Polystyrene Light** (`#d7e3f4`): rim and hairline stock. Never shipped at
  full strength on a flat surface, the rim is it at 26%, the hairline at 14%,
  the meniscus at 72%. Full strength only on the inked twin ring.
- **Plate Ink** (`#eaf1fc`): body copy, headings, numerals that are in range.
- **Dimmed Ink** (`#9fb4d8`): ledes, captions, the second line under every
  number.
- **Faint Ink** (`#7c93bd`): plate coordinates (1–12, A–H), legend labels, the
  quietest provenance line.

### Named Rules

**The Committed Ground Rule.** `#081a42` carries the page. A new surface does
not get its own background colour; it gets a hairline and a heading. Only the
plate edge (`#050f2b`) and the selected strain (`#0b2252`) may differ, and both
are already spoken for.

**The Growth Reservation Rule.** Growth pink is never decoration, never a brand
accent, never a hover. It appears only where a value cannot be banked: the
out-of-domain tier, a value below the read line, and a missing record. If pink
appears on a screen with no such value on it, the screen is wrong.

**The Form-Not-Hue Rule.** Every tier distinction ships as a mark as well as a
colour: struck diagonal for outside the read, an inked ring for a fingerprint
twin, no mark at all for in-domain. Print the screen in greyscale; if a tier
disappears, it was never drawn.

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
  is a hard cut; the plate never pans or re-reads.

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

### Plate Edge (header) and Plate Foot (footer)
Full-bleed `#050f2b` strips against the ground, divided by a single hairline.
The header carries event and track in the legend register at left and the run
provenance in mono at right, progressively revealed as the viewport allows. The
footer carries the obligations, repository, generative-AI disclosure,
traditional-knowledge statement, in three columns of small dimmed text. Neither
strip is a navigation bar and neither is sticky.

### Links and Focus
Links are plate ink with a 1px underline in straw at 62%, offset 0.22em, going
to full straw on hover in a single 90ms two-frame step. Focus is a 2px straw
outline at 2px offset (3px on a well), and it is never removed.

### Named Rules

**The Step-Only Rule.** Every transition in this system is `steps(2, end)` at
72–90ms, or a 90ms linear colour change. There is no easing curve anywhere.
The plate reads itself once on load, column by column at 72ms per column, and
then stops; `prefers-reduced-motion` renders it already read.

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
