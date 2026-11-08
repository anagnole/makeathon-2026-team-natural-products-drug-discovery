# The film

`docs/video-script.md` is what is said. This is what is cut: the shape of the
submitted video, how the picture is made, and what has to be true for the two
voices to lay on top of it without re-timing anything.

Deliverable: **one 1920×1080 file, about 6:45**, well inside the 10-minute
limit. Picture, music and act cards are built here; the narration is recorded
against the finished cut.

## Why it is cut this way

The judges score how clearly the problem, methods, results, prototype,
limitations and impact come across. That is a talking deliverable, so the
picture serves the voice and never competes with it:

- **The product is the footage.** Not slides about the product. One unbroken
  take of record mode driving the real page at 1920×1080, every number on
  screen read at build time from `results/`. Nothing is re-created for the
  camera, so nothing in the film can drift from the repository.
- **No cursor, no browser chrome, no mis-timed keypress.** The take is driven
  headlessly by `brag-output/work/capture.mjs`, which holds each beat for
  exactly the seconds `video-script.md` gives it. A retake is one command, so
  a bad frame is never argued with.
- **The presenter strip is hidden** (`H`). The act cards carry the structure
  instead, and a frozen frame has nothing on it that is not the product.
- **Music under, not over.** A quiet bed that changes with each act. Six
  minutes of technical narration does not want a soundtrack competing for the
  same frequencies; it wants a floor so the silences do not sound like a
  dropout.

## The six acts

The script's own six parts, each opened by a card held 2.5 seconds. The cards
are the only thing in the film that is not the product, and they exist so a
viewer always knows which question is being answered.

| Card | Title | Covers |
|---|---|---|
| I | What we were asked | beats 01–02 |
| II | What we built | beats 03–07 |
| III | How it was built | beats 08–11 |
| IV | What it does | beats 12–16 |
| V | What is wrong with it | beats 17–18 |
| VI | What it is for | beats 19–20 |

No timecode is written down here on purpose. Cutting at 30fps rounds every
boundary to a whole frame, and across twelve clips that rounding moved the
later acts by about a second — enough to put a narrator out by a sentence.
`brag-output/cues.md` is generated from the rendered clips' own durations
after the cut, so it is the only account of when anything happens, and it is
rewritten every time the film is rebuilt.

Exact cue times for every beat are written to `brag-output/cues.md` by the
build, from the real rendered timeline. **Read the narration against that
file, not against the timecodes in `video-script.md`**, which do not count the
cards.

## The two long holds

Beat 14 (the chemical-space map, 34s) and beat 02 (30s) sit on a page that has
stopped moving. A still frame that long reads as a frozen video. Both get a
slow push in — about 4% over the hold — so the frame is alive without anything
on it changing. Nothing else in the film moves that is not the page moving
itself.

## Recording the voice

1. Open `brag-output/brag.mp4` and `brag-output/cues.md` side by side.
2. Record one act at a time, not one take of six minutes. An act is 40 seconds
   to two minutes; a fluffed line costs one act, not the film.
3. Leave the first 2.5 seconds of each act silent: that is the card.
4. One voice per act is enough, and the two voices alternating by act is the
   easiest way for a listener to tell who is who. Beat 20 is both names, so
   whoever did not speak last should read it.
5. Hand the files back and the build mixes them in at the cue times, ducks the
   bed under speech, and re-renders.

Say the numbers as they are on screen. Do not round, do not add a claim the
page does not make, and keep the rule the whole project runs on: nothing here
is a clinical claim.

## If it has to be shorter than six minutes

`video-script.md` carries its own trim: cut beat 10, shorten beat 16 to one
sentence, drop the second half of beat 19. That is about 45 seconds and lands
the film near 6:00. Do it by changing the holds in `capture.mjs` and
re-recording the take, not by cutting the rendered file, so the cue sheet stays
true.
