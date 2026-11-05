# makeathon-2026-team-natural-products-drug-discovery
EthnoHack 2026, Track 2: Natural Products for Drug Discovery

## Web app

`web/` holds the public interface over the shortlists: pick a pathogen, read the
plate, open a compound. It reads `results/` at build time and ships as a static
site with no backend and no keys.

```bash
cd web && npm install && npm run dev
```

See [web/README.md](web/README.md) for the full notes.
