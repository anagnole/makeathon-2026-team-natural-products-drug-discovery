---
name: data_findings
description: "What the ChEMBL and LOTUS pull actually contains, measured on 3 Nov; the traps that silently destroy the dataset"
metadata:
  type: project
---

Measured by the data-notebook pane on 3 Nov from the real download, not estimated. I have not
re-verified the numbers independently; they come from notebook 01 and `docs/data-sources.md`.

**The finding that changes the plan.** Of 462,603 ChEMBL MIC rows across nine bacteria, 460,711
(99.6%) are measured against the whole organism. Only 35 single-protein targets carry any MIC at
all, median 8 compounds, 150 on the best one. The 2 Nov call chose per-target protein models; the
MIC data cannot support that. Protein-level data does exist in ChEMBL under IC50, Ki and percent
inhibition, as a separate and much smaller download. **The user ruled on 3 Nov: whole-organism.** The primary model predicts whole-organism growth
inhibition, and the protein layer annotates a shortlist rather than ranking it. Knock-on: there is no
protein sequence in the pipeline, so cluster-level splitting is on chemical fingerprints rather than
sequence identity. The principle, clusters not rows, is unchanged.

**Traps that silently destroy the dataset:**

- No MIC row carries a pChEMBL value. The standard `pchembl_value__isnull=false` quality filter
  therefore deletes everything, with no error. The pane hit this on its first probe.
- 21.6% of rows are `>` or `>=`, meaning tested and inactive. That is most of the negative class.
  Dropping them throws away the negatives; reading them as exact numbers is wrong.
- 37 distinct unit strings, so unit handling is real work, not a cast.
- 68.6% of µg/mL values are at or below 32, so a 32 threshold labels most of the data active. That
  is publication bias in what gets reported, and it is the strongest argument for the call's
  precision-over-recall framing.
- LOTUS: use the `_frozen_metadata` Zenodo export, not `_frozen`. The latter has only InChIKeys, and
  a hash cannot be turned back into a structure, so there is nothing to featurise.

**Shape of the problem:** 95,529 compounds have a measurement, 153,745 plant structures do not, and
2,157 are in both. It is a virtual screen, and the overlap is the only place a held-out check can
come from.

**Why:** each of these costs hours to rediscover, and the first two fail silently rather than
loudly, which is worse.
**How to apply:** read `docs/data-sources.md` in the repo before touching the data; it carries the
licences and the exact fetch commands. See [[ethnohack_context]], [[feedback_open_choices]].
