# Data sources

Every external dataset this project uses, what it is for, its licence, and how to get it. No data
is committed: `scripts/` downloads all of it into `data/`, which is gitignored.

| Source | Used for | Licence | How we get it |
|---|---|---|---|
| [ChEMBL](https://www.ebi.ac.uk/chembl/) | measured antibacterial activity (MIC and related readouts) against bacterial organisms and protein targets | CC BY-SA 3.0 | REST API, `scripts/fetch_chembl.py` |
| [LOTUS](https://lotus.naturalproducts.net/) | the plant-to-compound edge: which natural product occurs in which organism, with a literature reference, the structure itself (SMILES, InChI, formula, exact mass, XLogP), its NPClassifier and ClassyFire chemical classes, and the organism's taxonomy | CC0 | Zenodo frozen metadata export, `scripts/fetch_lotus.py` |
| [GBIF backbone taxonomy](https://www.gbif.org/) | a second, independent read on which LOTUS organisms are plants, used to cross-check the filter and to cover the organisms LOTUS leaves unassigned | CC BY-NC 4.0 (name matching API) | `species/match` API, `scripts/fetch_taxonomy.py` |

## Why these three

The project needs two things joined: a label (is this compound active against this bacterium) and a
provenance (does this compound come from a plant). ChEMBL carries the first and LOTUS the second,
and they join on the InChIKey of the structure.

LOTUS covers every kingdom, so something has to say which organisms are plants. The frozen metadata
export carries its own taxonomy, and land plants are the phylum `Streptophyta`. GBIF is matched
against the same names as an independent check: the two agree on 550,653 of the occurrence records,
GBIF recovers 19,227 that LOTUS leaves unassigned, and LOTUS keeps 1,541 that GBIF cannot match. A
record counts as a plant if either says so.

We use the `_frozen_metadata` export rather than the smaller `_frozen` one because the latter has
only InChIKeys. An InChIKey is a hash: it cannot be turned back into a structure, so without the
metadata file there is nothing to compute descriptors from and nothing to screen.

The organisers' dataset guide names LOTUS as the cleanest open plant-to-compound edge and ChEMBL as
the resource that carries measured target activity, with the instruction to keep assay type,
organism, units and relation intact. Both are followed.

## Reproducing the data

```bash
uv sync
uv run python scripts/fetch_lotus.py
uv run python scripts/fetch_taxonomy.py
uv run python scripts/fetch_chembl.py MIC
```

All three are resumable: each skips what it has already written, so an interrupted download is
restarted by running the same command again. `ETHNOHACK_DATA_DIR` moves the download location.

No API key is needed for any of them, so there is nothing to put in a `.env`.

## Sources considered and not used

- **COCONUT, ChEBI, BRENDA, WFO, IPNI, WCVP, taxtree via the organisers' hosted wrappers**
  (`*.ethcstwin.di.uoa.gr:65000`). Their TLS certificate does not verify from this machine
  (`CERTIFICATE_VERIFY_FAILED`, no local issuer), so we did not call them. GBIF covers the
  taxonomy need with a certificate that verifies normally.
- **Wikidata SPARQL** for LOTUS. The query that restricts to plants by walking the taxonomic
  parent chain (`wdt:P171*` to Viridiplantae) times out on the public endpoint, which is why the
  frozen Zenodo export plus GBIF matching is used instead.
- **DrugBank** (academic registration required) and **KEGG** (restricted bulk download). Avoided:
  the repo is public and everything in it has to be obtainable by anyone under a licence that
  allows it.
- **NAPRALERT**. Subscription only.
