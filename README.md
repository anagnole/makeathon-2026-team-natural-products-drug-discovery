# makeathon-2026-team-natural-products-drug-discovery
EthnoHack 2026, Track 2: Natural Products for Drug Discovery

## Web app

`web/` holds the public interface. `/` is the shortlists: pick a pathogen, read
the plate, open a compound. `/pipeline` walks the whole pipeline stage by stage,
from the question to the run ledger, and is the page the presentation follows.
Both read `results/` at build time and ship as one static site with no backend
and no keys.

```bash
cd web && npm install && npm run dev
```

See [web/README.md](web/README.md) for the full notes.
