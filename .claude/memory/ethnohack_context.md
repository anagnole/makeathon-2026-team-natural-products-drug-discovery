---
name: ethnohack_context
description: "EthnoHack 2026 state the repo can't hold: team of two, private repo with placeholder name, local-only CLAUDE.md and organiser/, open points"
metadata:
  type: project
---

State as of Mon 2026-11-02, day 1 of the hackathon. The full brief is `~/Projects/ethnohack/CLAUDE.md`; read it first.

- Team of two: the user plus one teammate (see [[teammate]]; GitHub handle still unknown). The user created the Devpost project page.
- Repo https://github.com/anagnole/makeathon-2026-team-natural-products-drug-discovery, created 2026-11-02 by Claude with `gh` at the user's request (GitHub made the initial commit: README, MIT LICENSE, Python .gitignore). It is **private** because the auto-mode classifier blocked creating a public repo; the user makes it public. `team` is a placeholder for the team name.
- `~/Projects/ethnohack` is the repo root, so sessions here load this memory folder, not the shared `~/Projects` one. The feedback files here are copies from the shared folder, with other projects' and people's names removed because the repo goes public.
- At the user's request (2 Nov) `CLAUDE.md` and this memory are in the repo. The memory lives at `.claude/memory/` in the repo, and `~/.claude/projects/-Users-anagnole-Projects-ethnohack/memory` is a symlink to it, so memory edits land in the repo for the user to commit. Keep them free of secrets, promo codes and third-party names.
- `organiser/` (opening slides, dataset guide, GitHub guide, Anakin claim doc) stays out of git via `.git/info/exclude`.
- The user runs several Claude sessions at once; a supervisor session may relay their requests by cross-session message.
- On 2 Nov the supervisor session sent everything the user gave it: the slides PDF, the Devpost URL, kickoff call notes, the Discord rules and FAQ, and the #track-2 intro. All of it is folded into CLAUDE.md. It knew nothing about the team beyond "we have a team", so team facts must come from the user.

Open points: team name (then `gh repo rename`), making the repo public before submitting, and "auto 5-mer" in the minutes. The task, models, splits and roles were settled on the 2 Nov call and are in `CLAUDE.md`; the datasets question is closed.

Dropped: adding the teammate as a collaborator. The attempt was blocked here (granting repo permissions is a permission grant in this session) and on 3 Nov the user told me to drop it. The handle is in `organiser/teammate-background.md` if it is ever wanted. Don't raise it again unasked.

**Why:** a one-week hackathon with a hard deadline (Sun 8 Nov 10:00 CET); losing track of these costs the submission.
**How to apply:** close open points here as they resolve; don't restate what CLAUDE.md already says. See [[feedback_open_choices]], [[feedback_keep_memory_current]].
