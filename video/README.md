# Pitch video

Ten slide stills, ten voice takes, one `build.sh`. The video is assembled, not
edited: each slide stays on screen for exactly as long as its own take runs.

## Record

One take per slide. Read the matching block from
[`../docs/deck/narration.md`](../docs/deck/narration.md). **If you fluff a line,
start that slide again and keep the better take.** Nothing is ever cut out of
the middle of a recording, so there is no splice to hear.

Voice Memos is enough. Record, then share each one to the folder below.

Save them as, exactly:

```
video/audio/slide-01.m4a
video/audio/slide-02.m4a
...
video/audio/slide-10.m4a
```

`m4a`, `mp3`, `wav`, `aac`, `caf` and `flac` all work. The number is what binds
a take to its slide, so `slide-07.m4a` always plays over slide 7.

Two things worth getting right while recording, because neither can be fixed
afterwards: stay the same distance from the microphone within a take, and leave
a beat of silence at the start and end rather than clipping your own first word.

## Check without building

```bash
./build.sh --check
```

Prints each take's length, what it will occupy on screen, the running total
against the 10:00 cap, and which slides are still missing. Costs a second.

## Build

```bash
./build.sh
```

Writes `pitch.mp4`, 1920×1080, H.264 and AAC. It builds a partial video from
whatever takes exist, so it is worth running early to see the shape of it.

Takes about a minute for the full ten.

## What it does to the audio

- **Levels every take to the same perceived loudness.** Each one is measured
  with `volumedetect` and given a single gain that brings its mean to −20 dBFS
  without letting a peak past −1.5 dBFS. Takes recorded at different distances
  on different days will not jump in level.
- **Pads each slide** with 350 ms before the voice and 450 ms after, so the
  slide changes do not feel clipped.

It deliberately does *not* use `loudnorm`: in single-pass mode that filter runs
a lookahead buffer which landed as roughly 2.4 s of dead air at every slide
change, turning an 8:12 script into 8:36 on screen. The measured gain has no
latency, so the built file is exactly the length `--check` predicts.

## Opening up the pauses

```bash
./pauses.py audio/slide-01.m4a              # report only, writes a .paced preview
./pauses.py audio/*.m4a --apply             # rewrite in place, keeps a .orig
./pauses.py audio/*.m4a --apply --target 0.9
```

Finds the silent gaps and stretches every one over `--min-gap` (0.18 s) to at
least `--target` (0.75 s). **Speech is never touched**: the audio between gaps
is copied sample for sample, nothing is time-stretched or re-pitched, and only
the silence changes length. The room's noise floor is found by trying a ladder
of thresholds and stopping at the first that detects a gap.

Measured on test audio: gaps of 0.24 / 0.25 / 0.28 s all came out at 0.750 s,
and an 11.36 s take became 13.45 s.

It separates a sentence break from within-sentence breathing by **length
alone**, so a long dramatic pause mid-sentence gets stretched too. Preview
first, listen, then `--apply`.

## Checking the numbers

```bash
./check.py        # every take found
./check.py 05     # just slide 5
```

Transcribes each take with whisper.cpp and compares every number spoken
against the numbers printed on that slide, which is the narration's own
opening rule. Three outcomes per number: an exact match, a **rounded** match
(you said 0.72, the slide prints 0.719) reported but not treated as an error,
and **not on slide**, which is the one worth listening to.

Measured behaviour on test audio: every figure transcribed correctly, and a
deliberately misread 0.930 against a printed 0.903 was caught. Domain words
are not reliable, "Tanimoto" came back as "10imodo", so ignore mangled jargon
in the transcript. It reads numbers; it does not hear them.

Needs `brew install whisper.cpp` and the model at
`~/.local/share/whisper/ggml-base.en.bin`.

**This cannot tell you how a take sounds** — not tone, not pacing, not whether
a mumble landed. Only you can judge that, which is why a bad take is
re-recorded rather than repaired.

## Re-exporting the slides

`slides/*.png` come from the committed deck. Regenerate after editing it:

```bash
pdftoppm -png -r 144 -scale-to-x 1920 -scale-to-y 1080 ../docs/deck/deck.pdf slides/slide
```

## Submitting

Upload `pitch.mp4` to YouTube as **unlisted** (not private, which fails for
judges) and put the link on the Devpost project page. Test it in a private
window before pasting it.
