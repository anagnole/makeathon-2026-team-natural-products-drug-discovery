---
name: teammate
description: "The teammate has a strong computational drug discovery ML background; her own work must not be published, details are in a local-only file"
metadata:
  type: project
---

The user's teammate has a strong machine learning background in computational drug discovery and has run a full modelling pipeline of her own end to end, so the team can attempt a genuinely rigorous model rather than a notebook demo. She should own the validation design.

Her own work stays unpublished. On 2 Nov the user said to keep it out of the repo, so nothing derived from it goes in any file that is committed, in the README, the slides or the pitch. What she has done is a strong reason for our choices, not something to describe publicly.

The detail (the methods she has already run, and why each one is cheap for us) is in `organiser/teammate-background.md`, which is local only and excluded from git. Read it from there when scoping the modelling.

**Why:** the repo becomes public before submission, and her work is hers to publish or not.

**Where the line is, because this one can go wrong.** Not publishing her unpublished work is right. Concealing a reused method would not be: the rules require the README to "clearly show which parts your team built and which were pre-existing", and a submission with misleading information can be disqualified. The two only coexist because the methods the team chose (similarity-clustered splits, gradient boosting, Optuna, feature importance, diversity selection) are standard published practice that we can justify on their own merits without reference to her. That holds as long as it stays true. If any of her code, or a design distinctive to her own prior work rather than common practice, ends up in our pipeline, it has to be disclosed in the README, and the way to do that without publishing anything of hers is to ask her how she wants it credited. Do not quietly drop the disclosure instead.

Her name being out of the repo is also not concealment of a team member: the rules require every member on the Devpost page, so she is named there.

**The practical test**, sharpened by the other pane on 2 Nov: the risk is not the list of methods, which is common practice, but the specifics. A particular activity threshold, a particular identity threshold, a particular feature-set composition, or anything copied once her repo arrives: those are the cases to bring to the user instead of quietly adopting. A specific value that came from the team call (the ~90% identity threshold, for instance) is the team's own decision and can be stated as such.

**How to apply:** when the plan or the README justifies a method, argue it on its own merits. Before the README is finalised, check with the user whether anything of hers was actually reused, and credit it if so. See [[ethnohack_context]], [[feedback_open_choices]].
