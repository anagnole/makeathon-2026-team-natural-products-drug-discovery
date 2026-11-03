# EthnoHack 2026

Our entry to EthnoHack 2026 (https://ethnohack2026.devpost.com/), **Track 2: Natural Products for Drug Discovery**. Team of two: the user and one teammate. The Devpost project page exists (created 2 Nov). The task, models and splits were decided on the 2 Nov team call and are in "The project" below; what is still open is listed at the end of that section.

## The project (decided on the 2 Nov team call)

**Task.** Predict which plant compounds are active against specific bacterial targets. Precision over recall: the deliverable is a short, high-quality shortlist for lab synthesis, so a wasted synthesis is the cost that matters, not a missed hit.

**Targets.** Per-target models for specific bacterial proteins rather than one general model, with proteins grouped by similar mechanism of action so that targets with few samples borrow data from their group.

> **Challenged by the data, 3 Nov, and the user has not ruled on it.** Notebook 01 measured the ChEMBL MIC pull for nine bacteria: 460,711 of 462,603 rows (99.6%) are against the whole organism, and only 35 single-protein targets carry any MIC at all, median 8 compounds, 150 at best. Protein-level data exists in ChEMBL but under IC50, Ki and percent inhibition, a separate and much smaller download. So the readout the data supports is whole-organism growth inhibition, with the protein layer annotating a shortlist rather than ranking it. Until the user rules, treat per-target protein models as the call's decision and whole-organism as the measured alternative; do not quietly adopt either.

**Models.** XGBoost or random forest. Optuna for the hyperparameter search, chosen over grid search. Hybrid features: sequence features combined with biophysical and biochemical properties. Score every feature set with a simple model first and tune only the best one. Feature importance for the biological reading.

**Splits.** Cluster and split the clusters, not the rows, into train, validation and test, so the model cannot memorise near-identical entries. The call said sequence similarity at around 90% identity; under the whole-organism readout there is no protein sequence in the pipeline, so this becomes chemical similarity clustering on fingerprints. The principle (cluster-level splits, not row-level) is the part that matters and holds either way.

**Candidate selection.** After training, project candidates into a 3D space and take the most distant ones, for biological diversity in what goes to the lab.

**Compute.** Google Colab Pro for the GPU, with every intermediate saved so nothing is recomputed.

**Roles.** Leonidas: start the EDA in the repo notebooks, save intermediates. Teammate: accept the repo invite, email the lab coordinator about booking, review the tutorial videos on Discord.

**Data.** "The several datasets provided" in the minutes means the organisers' own dataset list (confirmed by the user on 2 Nov): `organiser/datasets-all-tracks.docx`, with its text copy alongside, plus the suggested sources on the Track 2 slide. There is no separate hand-over of data, and the Discord link for it was never posted. For this task the entries to start from are ChEMBL for measured target activity and UniProt for normalising target identifiers, with the organisers' hosted wrappers available for compound and taxonomy lookups.

**What the data says about the labels** (measured in notebook 01, 3 Nov, not assumed):

- No MIC row carries a pChEMBL value. The usual `pchembl_value__isnull=false` quality filter silently empties the whole dataset.
- 21.6% of rows are `>` or `>=`: tested and found inactive. That is most of the negative class, so it can neither be dropped nor read as an exact number.
- 37 distinct unit strings, and 68.6% of µg/mL values sit at or below 32, so a 32 threshold makes most of the data "active". That is publication bias, and it is the strongest argument for the call's precision-over-recall framing.
- It is a virtual screen: 95,529 compounds have a measurement, 153,745 plant structures do not, and only 2,157 are in both.

Still open: the per-target question above; the team name (deferred to the final presentation, so the repo keeps its placeholder).

## Repo

This folder is the repo: https://github.com/anagnole/makeathon-2026-team-natural-products-drug-discovery (created 2 Nov, **private for now**, MIT, Python `.gitignore`). `team` in the name is a placeholder until the team name is set (`gh repo rename`). It must be made public before submitting. `CLAUDE.md` and the Claude project memory (`.claude/memory/`) are in the repo; `organiser/` holds the organisers' files and stays local (`.git/info/exclude`). The repo goes public, so nothing committed may hold secrets, promo codes or third-party names. Never commit or push unless the user asks.

**Deadline: Sun 8 Nov 2026, 10:00 CET (11:00 Athens).** The slides and the FAQ say 10:00 CET. The Discord rules post shows "11:00 AM" only because Discord renders timestamps in the reader's time zone (the FAQ line reads "10:00 CET: Sunday, November 8, 2026 at 11:00 AM"), so it is the same moment. Late submissions are refused. Submit early: a submitted project can be edited until the deadline, and saving a Devpost draft is not submitting. Judges deliberate for a week, winners are announced Sun 15 Nov.

Sources: `organiser/opening-ceremony.pdf` (the 2 Nov opening slides, the most authoritative) the Discord rules and FAQ of 30 Oct, the #track-2 channel intro, and auto-generated kickoff call notes (garbled in places: they call it the "Fathom Hackathon", list the wrong partners and mix up Track 3, so trust the slides). All summarised below; the verbatim pastes are not on disk.

## The event

- Run by ETHCSTWIN, a Horizon Europe project (June 2024 to May 2027) twinning the Institute for Ethnopharmacological Studies & Phytotherapy (IESP, University of Athens) with computer science. Partners: IESP NKUA (Greece), Fraunhofer SCAI bioinformatics (Germany), Pangea Botanica / PangeAI (Germany, plant-use data for drug discovery), University of Gastronomic Sciences Pollenzo (Italy), University of Prishtina (Kosovo). Their mission line: "Turn traditional knowledge into evidence for drug discovery."
- Week-long, 100% online, 2 to 8 November 2026, CET, everything in English. Hack in your own hours.
- Four tracks, a €2,000 first prize each: 1 Traditional Knowledge Mining, 2 Natural Products for Drug Discovery, 3 Biodiversity and Sustainability, 4 Digital Health and Phytotherapy. The track is picked on Devpost and can change until the deadline. Combining tracks is allowed.
- Special awards, open to every track: Best AI Solution (most innovative use of ML), Best Student Team (all students), Best Scientific Rigor (most thorough design and data validation), Most Innovative Application, Best Community Impact, Best Collaboration (across disciplines or institutions). One prize per team.
- Teams of 2 to 5. The organisers push mixed teams: a coder, a scientist and a domain expert.

## Track 2

Lead: Antigoni Cheilari. Question: "Among hundreds of thousands of plant compounds, which deserve a closer look?" The #track-2 channel puts it as: identify promising plant-derived compounds for specific disease targets; build predictive models, knowledge graphs and screening pipelines.

ML and cheminformatics to find plant compounds for disease targets. Plant extracts act through compounds with synergistic effects that are hard to isolate, so mapping the chemical space of medicinal plants in silico to predict bioactivity or synergy is the core challenge.

Directions on the slide (inspiration only, own ideas welcome). The first one was circled:

- Bioactivity prediction for extracts, fractions and pure compounds
- Drug-likeness filtering
- Virtual screening
- Mapping chemical space
- Plants bridging old and new medicine
- Plant-compound-target graphs
- Synergy

Suggested open data: COCONUT, NPASS, ChEMBL, PubChem, KNApSAcK, UniProt, PDB, DrugBank, KEGG, Kaggle and Hugging Face datasets.

## Organiser dataset guide

`organiser/datasets-all-tracks.docx` (text copy `organiser/datasets-all-tracks.txt`). Points that matter for Track 2:

- The organisers host their own REST wrappers, HTTPS on port 65000, Swagger at `/docs`: `coconut`, `chebi`, `brenda`, `wfo`, `ipni`, `wcvp`, `taxtree` under `.ethcstwin.di.uoa.gr`. Plain HTTP returns 400. `curl` reached coconut, chebi and wfo with 200 on 2 Nov, but on 3 Nov Python could not verify their certificate (`CERTIFICATE_VERIFY_FAILED`, no local issuer) and they were dropped from the pipeline. Both results are real: `curl` uses the system trust store and Python uses certifi's. If these APIs are ever wanted, that difference is the thing to fix, not the servers.
- LOTUS (CC0, via Wikidata SPARQL) is called "the cleanest open plant to compound edge", with references.
- WFO ID is the recommended primary plant identifier.
- ChEMBL is CC BY-SA; keep assay type, organism, units and relation intact.
- IMPPAT 2.0 (open) has phytochemical to human target links. Dr. Duke's (USDA, downloadable) has plant, compound, activity and use. NAPRALERT is subscription only.
- EMA herbal monographs (HMPC) give "traditional use" and "well-established use" status per plant.
- DrugBank: free for academic non-commercial use with registration.
- Responsible use: user-facing output must say these are traditional or predicted claims, not efficacy or medical advice; no dosing; Nagoya Protocol and Local Contexts for community knowledge.

## Submission (all on Devpost)

- Project page: title, description, team (every member listed and accepted), track.
- Public GitHub repo: code, notebooks and a clear README. MIT licence recommended. Per `organiser/github-guide.txt`: name it `makeathon-2026-[team-name]-[challenge-name]`, add a `.gitignore`, add every member as a collaborator, never commit keys (`.env` ignored, README explains how to get and set each key). README must cover the challenge and problem, technologies, install and run steps, API key setup, and screenshots, demo or video link. It must run from those instructions. Frequent descriptive commits, `dev` and `feature-*` branches, no large files in git.
- Pitch video, max 10 minutes, on YouTube (public or unlisted) or Vimeo. Cover problem, approach, results, impact, demo.
- Slide deck, max 10 slides, as PDF.
- Video tips (FAQ): unlisted is fine, private is not; test the link in an incognito window. One or two presenters is enough. The organisers' video guide describes a 2 to 3 minute demo video shown during the presentation to the judging panel and recommends OBS Studio.
- Data that can't be shared stays out of the repo; the README says how to get it.
- If something isn't finished, submit anyway and say what works, what doesn't and what's next. FAQ: "Honest, well-reasoned work beats a shiny but shallow demo."

## Rules that shape the work

- Build it during 2 to 8 Nov. Prior ideas are fine, but the README must say what existed before and which parts the team built.
- Credit every external dataset, API, model and library in the repo and follow its licence. Prefer open data; paid or restricted data only if everyone can legitimately get it.
- AI tools are allowed. The README lists them and what each was used for.
- No health claims: the prototype is not clinically validated. State uncertainty and limitations.
- Take care with traditional or Indigenous knowledge.
- Disclose significant generative AI use, especially where AI contributed code, analysis or content. The team stays responsible for accuracy, originality and licensing.
- Grounds for disqualification include data or IP used without permission, misleading information and a missing submission item.
- One team per person. Every member must accept the Devpost invite to appear on the submission. Changing teams is allowed if both teams agree and Devpost is updated.

## Judging

From the official rules:

- Scientific relevance: a meaningful challenge in ethnopharmacology, natural products, biodiversity, sustainability or health.
- Innovation: a creative or novel approach.
- Technical implementation: code quality, system design, model implementation, prototype functionality, documentation, reproducibility.
- Data science quality: data quality, method selection, validation, statistical reasoning, handling of uncertainty, reproducibility.
- Feasibility: could it realistically be developed further after the hackathon.
- Impact: benefit for research, drug discovery, conservation, healthcare or communities.
- Presentation: how clearly the problem, methods, results, prototype, limitations and impact come across.

Judges are ethnopharmacology, natural products, data science and digital health experts from the organising institutions and partners. The rubric and any weighting will be published before judging; judges may also consider a final presentation or demo. Every member of a submitting team gets a participation certificate. The kickoff notes say the special awards are certificates (unconfirmed). Submissions appear in the public Devpost gallery, and projects may continue as research or publications afterwards.

## Help and resources

- Discord: #announcements (read-only: schedule, deadlines, live links), #track-2 (questions, datasets, the track lead), #faq-and-resources, #event-questions (tech, Devpost, rules), #mentor-room or #find-a-mentor, #track-*-find-a-team. Private team channel: in #request-team-channel post `/team [teamname]-track2 @members`.
- Discord etiquette: real name as server nickname; don't DM mentors unless they invite you.
- Mentors guide, they don't write code. To find a mentor by field, post in #find-a-mentor with team, track and field (e.g. Cheminformatics); specific questions go in #mentor-room. For a private question, @ the mentor in the team channel. #whois has mentor bios, and the FAQ links a mentor availability sheet (field, time zone, hours, office hours). Replies within about 12 hours, so ask early. Daily voice office hours, schedule pinned in #announcements. Closest to Track 2: Konstantia Graikou (natural products chemistry), Vasilis Kaintas (pharmacognosy), David Buchmann, Christian Ebeling and Anshulika Saxena (bioinformatics), Vijay Ingalalli (data science).
- Organiser guides: GitHub guide and dataset guide are in `organiser/`. The demo video guide is still only on Google Docs.
- Free compute: Google Colab, Kaggle Notebooks (about 30 GPU hours a week), GitHub Codespaces.
- Anakin (any website as a structured API): a free month of the $20 plan; the team with the best use of it gets the $100 plan free for a month, then 50% off for 3 months. Claim steps and code: #faq-and-resources, or `organiser/anakin-credit-claim.docx` locally.
- Aitho (pitch rehearsal, the script follows your voice): Presenter Pro free until 31 Dec. Sign-up link in #faq-and-resources.
- Organisers: ethnopharmacology@pharm.uoa.gr.
