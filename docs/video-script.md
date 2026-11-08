# The pitch, beat by beat

Twenty beats of record mode, with what to say over each one. This is the whole
pitch, not just the demo: question, team, problem, the screen, how it was built,
the results, the honest part, what it is for, and who made it.

Open the app, press **R**. Then **→** for the next beat, **←** to go back, **H**
to hide the strip for a clean frame, **Esc** to leave. Every state change on
screen is on a key, so nothing in a take depends on finding a well with the
mouse. Beats 08–11 cross to `/pipeline` and back on their own; the run survives
the navigation.

**Record at 1920×1080.** At that size the whole plate fits in frame, boundary and
struck wells included, and the chemical-space figure lands with its key and its
caption in one shot.

Budget: **6:30**, well inside the 10-minute limit, which leaves room to breathe
and room to overrun. The timecode under each beat is where it should start and
end. Let the motion finish before speaking over it — the plate read takes about
1.4 seconds and the numbers move while it runs.

If you need to lose a minute: cut beat 10, shorten 16 to one sentence, and drop
the second half of 19. If you have time spare, 14 is the beat worth giving it to.

Numbers below are the ones on screen. Say them as they are; do not round them up,
and do not add a claim the page does not make. Nothing here is a clinical claim.

---

## I. What we were asked

### 01 · The question, and who is asking it

`0:00 – 0:22`

> Among hundreds of thousands of plant compounds, which deserve a closer look?
> That is the Track 2 question, and we took it literally. We're Leonidas Anagnou
> and Eleni Nasopoulou, from Electrical and Computer Engineering at NTUA.

### 02 · Almost none of it came from a plant

`0:22 – 0:52`

> Here is the problem in one picture. Medicine has measured a great deal of
> chemistry against these three organisms — fifty-eight thousand compounds for
> *Staph aureus* alone. The bright sliver is the part that came from a plant.
> Two point four percent. Meanwhile there are ninety-seven thousand plant
> structures with a known source organism and no measurement against any of
> these three at all. You cannot look up an experiment nobody has run.

## II. What we built

### 03 · The plate reads itself

`0:52 – 1:12`

*The head crosses the plate; the wells fill behind it.*

> This is a ninety-six-well microdilution plate, which is where every label in
> this dataset came from in the first place. We did not invent a visualisation.
> We read the results the way the assay is read.

### 04 · What one well says

`1:12 – 1:34`

*The slip opens; the structure is plotted.*

> Every well is one compound. How full it is, is how close that compound sits to
> chemistry the model has already seen. How cloudy, is the score. You never get
> one without the other, because on this model one without the other means
> nothing.

### 05 · Where the read stops

`1:34 – 2:00`

> This line is the applicability domain, at Tanimoto 0.328. Not a number we chose
> for looks: the twenty-fifth percentile of the plant holdout, the most distant
> set on which we actually measured the model. Below it, compounds are struck
> through. We publish them, we do not rank them, and the page says their scores
> are not evidence of activity.

### 06 · A second envelope

`2:00 – 2:10`

*E. coli; the plate is read again.*

> One model per pathogen, and three deliberately different cell envelopes.
> Gram-positive, Gram-negative, acid-fast. Forty-three thousand measured
> compounds here.

### 07 · A third envelope

`2:10 – 2:20`

> And the acid-fast one, the hardest wall to cross, with the least data behind
> it: twenty-two thousand nine hundred.

## III. How it was built

### 08 · How it was built

`2:20 – 2:30`

*Crosses to /pipeline.*

> Twelve stages, written out in the order they were built. Each one carries the
> claim, the steps it ran, what we chose and what we turned down.

### 09 · What the data actually said

`2:30 – 2:52`

> This stage changed the project. We had planned per-protein models. Then we
> measured the download: ninety-nine point six percent of the MIC rows for these
> organisms are against the whole organism, and only thirty-five single-protein
> targets carry any MIC at all, median eight compounds. So the model predicts
> whether a compound stops a bacterium growing, and says nothing about
> mechanism. We changed the project to fit the data rather than the other way
> round.

### 10 · Splitting it honestly

`2:52 – 3:02`

> No compound and no chemical scaffold appears on both sides of a split. We
> cluster first and split the clusters, so the model cannot pass by having
> nearly seen the answer.

### 11 · Every number has a run behind it

`3:02 – 3:14`

> Every figure on these pages is read at build time from a committed result
> file, and every file was written by a run with a commit and a configuration
> hash. The curation and split stages were re-run from the raw downloads on a
> second machine: all fifty-seven ledger metrics matched to the last decimal.

## IV. What it does

### 12 · The evaluation ladder

`3:14 – 3:42`

*Back on the shortlist page.*

> The same model, read three ways. On validation it sits between 0.85 and 0.88.
> Hold out whole chemical scaffolds and it reads between 0.82 and 0.90. Hold out
> every plant-derived compound — which is what a plant screen actually asks of
> it — and it drops to between 0.63 and 0.72. The third number is the honest one.
> It is the only one measured on the task in the title of this project.

### 13 · How far it had to reach

`3:42 – 4:00`

> Here is why the easier split is easier. Removing shared ring skeletons removes
> none of the resemblance that matters: the median held-out test compound still
> has a close neighbour in the training set, and the median plant compound sits
> much further out. That distance is the whole problem, and it is why it is
> printed next to every single score.

### 14 · The measured world, and the plant corner

`4:00 – 4:34`

> Every faint point is a compound somebody has already measured against this
> organism. The brighter ones a plant made — thirty-five out of fifteen hundred
> in this sample. The rings are our picks.
>
> And this figure argues against itself. The crossed-out rings are the compounds
> we refused to rank, and they are not out at the edges. They are sitting in the
> middle of the ones we kept. Two components carry seven percent of the variance,
> so the boundary this whole page is built on is invisible here. That is why
> every well carries a Tanimoto and not a position on a map, and why we did not
> reach for a prettier embedding that would have implied a separation the numbers
> do not support.

### 15 · What it buys a lab

`4:34 – 4:54`

> Precision at the top of the list is the number a chemist spends money against.
> On *S. aureus*, fifty-seven percent of the top tenth are active, against a
> twenty-five percent base rate. On *E. coli*, five times the hit rate of picking
> at random. That is the claim: not a cure, a shorter queue for the bench.

### 16 · Chemistry tracks the envelope

`4:54 – 5:14`

> This one we did not expect. The biosynthetic pathways of the shortlists track
> each pathogen's cell envelope. Alkaloids and terpenoids dominate the acid-fast
> list, seventeen and thirteen, thirty of the fifty. Peptides, sugars and fatty
> acids come up for the Gram-negative one, twenty-one of fifty. The model saw
> fingerprints and descriptors. Nobody told it about cell walls. We report it as
> a hypothesis worth testing, not a finding, because it partly reflects which
> compounds LOTUS has annotated.

## V. What is wrong with it

### 17 · The result that did not replicate

`5:14 – 5:32`

> We set out to show that holding out whole plant families is harder than holding
> out scaffolds. Measured four separate times, the direction is usually right and
> the magnitude never settles. Even on this one, the organism where the gap came
> out widest, the family split was the worse of the two in only seven of the ten
> repeats. On *E. coli* it came out the other way. So it goes in as a negative
> result, not as our contribution.

### 18 · What is wrong with it

`5:32 – 5:56`

> And this is the part we would rather a judge heard from us than found alone.
> The top-ranked candidate on all three plates is a near-copy of something in the
> training set. Twelve, eight and three of the fifty rows carry no source plant.
> The per-compound attributions are numerically impossible, so we do not show
> them. A screen that only reports its wins is not a result.

## VI. What it is for

### 19 · What it is for, and what is next

`5:56 – 6:16`

> Fifty compounds with a source plant, a reference and a distance is a bench
> queue rather than a literature search. The protein layer is the obvious next
> build, and it is a different download that exists. But the honest next step is
> not a fourth pathogen — it is putting ten of these on a real plate and
> publishing the hit rate next to the predicted one, including if it is worse.
> And the plant records carry traditional knowledge, so anything built on this
> carries the Nagoya Protocol with it as a condition, not a footnote.

### 20 · Who built it

`6:16 – 6:30`

> Leonidas Anagnou and Eleni Nasopoulou, Electrical and Computer Engineering,
> NTUA. Labels from ChEMBL, the plant edge from LOTUS, cross-checked against
> GBIF, all credited with their licences. AI assistance is disclosed on the
> page. Every number is traceable to a committed file. Thank you.

---

## Notes for the take

- Beats 06 and 07 re-read the plate from scratch. That is the point — the numbers
  are produced by a read, not swapped in — so give each one a beat of silence.
- Beats 08–11 navigate to `/pipeline` and 12 comes back. The run carries across;
  do not press anything during the page change.
- `prefers-reduced-motion` renders every figure already finished. If that setting
  is on, you will record a still page.
- The strip at the bottom is the same stock as the header and footer, so it reads
  as instrument chrome if it stays in frame. Press **H** if you would rather it
  did not.
- Beat 17 is the one place the voiceover goes past the screen. The panel shows
  the *M. tuberculosis* run only; the four measurements and the *E. coli*
  reversal (+0.004, the family split worse in 2 of 10 repeats) are in
  `results/runs.jsonl`. The three standard deviations printed there are
  per-split, not the paired spread, so do not read them out as the repeat-to-
  repeat scatter: on screen they are smaller than the gap beside them.
- No clinical claims in the voiceover. These are model predictions over published
  measurements, and no dose, preparation or use is implied.
