# The Microdilution Read

The public surface of our EthnoHack 2026 Track 2 entry: a per-pathogen virtual
screen over plant chemistry, presented as the 96-well MIC plate its labels came
from.

Pick a pathogen, read a well. Each well is one shortlisted compound. The liquid
rises to that compound's Tanimoto similarity to its nearest training compound,
it clouds with the model's predicted score, and the line drawn across all 96
wells is the applicability-domain cutoff. A well whose liquid stops below that
line was read as out of range, and it is struck through rather than ranked.

## Two pages

`/` is the deliverable: pick a pathogen, read a well, open a compound.

`/pipeline` is the argument behind it, and the page the presentation is built
on: twelve beats of one scroll, from the Track 2 question to the run ledger.
Each beat is a claim, the steps it ran, the calls we made with what we turned
down, and a figure that draws itself as you arrive: the curation funnel with
every cut it made, the compound beside its own Murcko scaffold, the three
readings of one model as a slope, the fifty candidates as the plate they came
from. The prose lives in `lib/story.ts` and the figures in
`components/Diagram.tsx`; every number is read from `results/` at build time,
so the story cannot drift away from the run.

## What it reads

Nothing on the page is typed in by hand. Every number is read at build time
from the committed result files one directory up:

| File | What the app takes from it |
| --- | --- |
| `results/shortlist_<organism>.csv` | the 50 in-domain candidates per pathogen |
| `results/exploratory_<organism>.csv` | the 15 out-of-domain candidates per pathogen |
| `results/runs.jsonl` | every metric, plus the commit and config hash behind it |
| `results/chemical_space_<organism>.csv` | the projected map: 1,500 measured compounds and this run's 65 candidates |
| `results/chemical_space.json` | what that map's caption has to admit to, including its variance explained |

If those files change, rebuild and the page changes with them. There is no
database, no API and no key to set: `npm run build` produces a static site.

## Run it

```bash
cd web
npm install
npm run dev
```

Then open <http://localhost:3100>.

## Record mode

**Not shipped.** `components/Record.tsx` drove the page from the keyboard for a
screen-recorded take: twenty beats covering the whole pitch, every state change
on a key so nothing in a take depended on finding a well with the mouse.

It is deliberately not mounted on either page. The submitted pitch is slides with
a voiceover rather than a filmed walkthrough, and on a public site a stray `R`
keypress would have hijacked a visitor's scroll and put a presenter strip over the
argument. The component is kept because it is the only record of the running order
the two surfaces were built around; mount it in `app/page.tsx` and
`app/pipeline/page.tsx` to use it again. What was said over each beat is in
[`docs/video-script.md`](../docs/video-script.md).

To produce the static site, which is what gets deployed:

```bash
npm run build
```

The output lands in `web/out/` and can be served by any static host.

## Screenshots for review

`scripts/shot.mjs` captures the page at exact viewports. It needs a Chromium
build; it takes the path to one as its first argument, so point it at whichever
one is already on the machine rather than downloading another.

```bash
node scripts/shot.mjs "$HOME/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell" http://localhost:3100/ ../.impeccable/review
```

Headless Chrome's own `--screenshot` flag will not go below a 500px viewport on
macOS; it crops a 500px layout down to the width you asked for, which looks
exactly like a broken responsive layout and is not one. Use this script for
anything narrower than 500px.

## Built with

- **Next.js 15** with the App Router, exported as a static site.
- **Tailwind CSS 4** for the token layer; the plate itself is hand-written CSS.
- **smiles-drawer** to draw every 2D structure in the browser from the canonical
  SMILES, themed to this page's palette rather than the library default.
- **Archivo** and **Martian Mono**, self-hosted through `next/font`. Identifiers
  and measurements are set in mono because they are data.

## Accessibility and honesty notes

- Every tier is drawn as a mark, never as a colour alone, so the in-domain and
  out-of-domain distinction survives greyscale and colour-blind vision.
- The plate is a grid: arrow keys walk it, and each well carries an accessible
  description with its rank, score, distance, tier and source plant.
- Below 768px the plate becomes a ranked list. The plate is a desktop and video
  artifact and does not survive a phone at a usable tap size.
- The page states its own defects. That section is required content, not an
  oversight, and it should not be edited out to make the demo look cleaner.
- Nothing on the page is a clinical or therapeutic claim.
