# EthnoHack 2026

Our entry to EthnoHack 2026 (https://ethnohack2026.devpost.com/), **Track 2: Natural Products for Drug Discovery**. Team of two: the user and one teammate. The Devpost project page exists (created 2 Nov). The idea and the stack are not chosen yet.

## Repo

This folder is the repo: https://github.com/anagnole/makeathon-2026-team-natural-products-drug-discovery (created 2 Nov, **private for now**, MIT, Python `.gitignore`). `team` in the name is a placeholder until the team name is set (`gh repo rename`). It must be made public before submitting. `CLAUDE.md` and the Claude project memory (`.claude/memory/`) are in the repo; `organiser/` holds the organisers' files and stays local (`.git/info/exclude`). The repo goes public, so nothing committed may hold secrets, promo codes or third-party names. Never commit or push unless the user asks.

**Deadline: Sun 8 Nov 2026, 10:00 CET (11:00 Athens).** The opening slides say 10:00 twice; one Discord rules post said 11:00, ignore it. Saving a Devpost draft is not submitting. Judges deliberate for a week, winners are announced Sun 15 Nov.

Sources: `organiser/opening-ceremony.pdf` (the 2 Nov opening slides, the most authoritative) and the Discord rules and FAQ of 30 Oct, summarised below.

## The event

- Run by ETHCSTWIN, a Horizon Europe project (June 2024 to May 2027) twinning the Institute for Ethnopharmacological Studies & Phytotherapy (IESP, University of Athens) with computer science. Partners: IESP NKUA (Greece), Fraunhofer SCAI bioinformatics (Germany), Pangea Botanica / PangeAI (Germany, plant-use data for drug discovery), University of Gastronomic Sciences Pollenzo (Italy), University of Prishtina (Kosovo). Their mission line: "Turn traditional knowledge into evidence for drug discovery."
- Week-long, 100% online, 2 to 8 November 2026, CET, everything in English. Hack in your own hours.
- Four tracks, a €2,000 first prize each: 1 Traditional Knowledge Mining, 2 Natural Products for Drug Discovery, 3 Biodiversity and Sustainability, 4 Digital Health and Phytotherapy. The track is picked on Devpost and can change until the deadline. Combining tracks is allowed.
- Special awards, open to every track: Best AI Solution (most innovative use of ML), Best Student Team (all students), Best Scientific Rigor (most thorough design and data validation), Most Innovative Application, Best Community Impact, Best Collaboration (across disciplines or institutions). One prize per team.
- Teams of 2 to 5. The organisers push mixed teams: a coder, a scientist and a domain expert.

## Track 2

Lead: Antigoni Cheilari. Question: "Among hundreds of thousands of plant compounds, which deserve a closer look?"

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

- The organisers host their own REST wrappers, HTTPS on port 65000, Swagger at `/docs`: `coconut`, `chebi`, `brenda`, `wfo`, `ipni`, `wcvp`, `taxtree` under `.ethcstwin.di.uoa.gr`. Plain HTTP returns 400. All three tested answered 200 on 2 Nov.
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

## Rules that shape the work

- Build it during 2 to 8 Nov. Prior ideas are fine, but the README must say what existed before and which parts the team built.
- Credit every external dataset, API, model and library in the repo and follow its licence. Prefer open data; paid or restricted data only if everyone can legitimately get it.
- AI tools are allowed. The README lists them and what each was used for.
- No health claims: the prototype is not clinically validated. State uncertainty and limitations.
- Take care with traditional or Indigenous knowledge.

## Judging

Scientific relevance, innovation, technical implementation, data science quality, feasibility, impact, presentation (the pitch video).

## Help and resources

- Discord: #announcements (read-only: schedule, deadlines, live links), #track-2 (questions, datasets, the track lead), #faq-and-resources, #event-questions (tech, Devpost, rules), #mentor-room or #find-a-mentor, #track-*-find-a-team. Private team channel: in #request-team-channel post `/team [teamname]-track2 @members`.
- Mentors guide, they don't write code. Post in #mentor-room with team, track and question, and tag the field. Replies within about 12 hours, so ask early. Daily voice office hours, schedule pinned in #announcements. Closest to Track 2: Konstantia Graikou (natural products chemistry), Vasilis Kaintas (pharmacognosy), David Buchmann, Christian Ebeling and Anshulika Saxena (bioinformatics), Vijay Ingalalli (data science).
- Organiser guides: GitHub guide and dataset guide are in `organiser/`. The demo video guide is still only on Google Docs.
- Free compute: Google Colab, Kaggle Notebooks, GitHub Codespaces.
- Anakin (any website as a structured API): a free month of the $20 plan; the team with the best use of it gets the $100 plan free for a month, then 50% off for 3 months. Claim steps and code: #faq-and-resources, or `organiser/anakin-credit-claim.docx` locally.
- Aitho (pitch rehearsal, the script follows your voice): Presenter Pro free until 31 Dec. Sign-up link in #faq-and-resources.
- Organisers: ethnopharmacology@pharm.uoa.gr.
