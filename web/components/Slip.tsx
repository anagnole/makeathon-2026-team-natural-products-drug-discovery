import type { Compound, Pathogen } from "@/lib/data";
import { dec, doiUrl, tanimoto } from "@/lib/format";
import Structure from "./Structure";

/**
 * The determination slip: what a reader writes down about one well. It carries
 * the score and the distance together, because on this model one without the
 * other is a misrepresentation.
 */
export default function Slip({
  compound,
  pathogen,
}: {
  compound: Compound;
  pathogen: Pathogen;
}) {
  const reaches = compound.tanimoto >= pathogen.domainCutoff;
  const near = compound.tanimoto >= 0.85;

  return (
    <article className="border-t border-[var(--hairline)] pt-5">
      <div className="grid gap-x-10 gap-y-7 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div>
          <p className="legend mb-2">
            Well {compound.well} · rank {compound.rank} of {pathogen.shortlist.length}
          </p>
          {/* Keyed on the compound so the depiction is plotted again for each
              well read, rather than being swapped in already finished. */}
          <Structure
            key={compound.smiles}
            smiles={compound.smiles}
            label={compound.skeleton}
          />
        </div>

        <div className="min-w-0">
          <dl className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
            <div>
              <dt className="legend mb-1.5">Predicted</dt>
              <dd className="measure text-2xl leading-none text-ink">
                {dec(compound.probability)}
              </dd>
              <dd className="mt-1.5 text-[var(--text-legend)] leading-snug text-ink-dim">
                against a {Math.round(pathogen.plantBaseRate * 100)}% base rate
                in held-out plant compounds
              </dd>
            </div>
            <div>
              <dt className="legend mb-1.5">Nearest training</dt>
              <dd
                className={`measure text-2xl leading-none ${
                  reaches ? "text-ink" : "text-growth"
                }`}
              >
                {tanimoto(compound.tanimoto)}
              </dd>
              <dd className="mt-1.5 text-[var(--text-legend)] leading-snug text-ink-dim">
                {near
                  ? "a close analogue of something the model was trained on"
                  : reaches
                    ? `inside the read, which stops at ${tanimoto(pathogen.domainCutoff)}`
                    : `past the read line at ${tanimoto(pathogen.domainCutoff)}`}
              </dd>
            </div>
            <div>
              <dt className="legend mb-1.5">Read as</dt>
              <dd className="text-lg leading-tight font-medium">
                {compound.tier === "in-domain"
                  ? "Inside the read"
                  : "Beyond the read"}
              </dd>
              <dd className="mt-1.5 text-[var(--text-legend)] leading-snug text-ink-dim">
                {compound.tier === "in-domain"
                  ? "The model was tested on compounds this far out."
                  : "This score is not evidence of activity."}
              </dd>
            </div>
            <div>
              <dt className="legend mb-1.5">Chemistry</dt>
              <dd className="text-[var(--text-small)] leading-snug">
                {compound.pathways.length
                  ? compound.pathways.join(" + ")
                  : "Unclassified pathway"}
              </dd>
              <dd className="mt-1.5 text-[var(--text-legend)] leading-snug text-ink-dim">
                {compound.superclasses.length
                  ? compound.superclasses.join(" + ")
                  : "no superclass on record"}
              </dd>
            </div>
          </dl>

          <div className="mt-7 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <h3 className="legend mb-1.5">Reported in</h3>
              {compound.plants.length ? (
                <p className="text-[var(--text-small)] leading-snug">
                  {compound.plants.slice(0, 3).map((plant, i) => (
                    <span key={plant}>
                      {i > 0 ? ", " : ""}
                      <em>{plant}</em>
                    </span>
                  ))}
                  {compound.plants.length > 3 ? (
                    <span className="text-ink-dim">
                      {" "}
                      and {compound.plants.length - 3} more
                    </span>
                  ) : null}
                  {compound.families.length ? (
                    <span className="mt-1 block text-ink-dim">
                      {compound.families.join(", ")}
                    </span>
                  ) : null}
                </p>
              ) : (
                <p className="text-[var(--text-small)] leading-snug text-growth">
                  No source plant in LOTUS. It reached the shortlist on its
                  chemistry alone.
                </p>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="legend mb-1.5">Skeleton</h3>
              <p className="measure text-[var(--text-small)] leading-snug break-all">
                {compound.skeleton}
              </p>
              <h3 className="legend mt-4 mb-1.5">Reference</h3>
              {compound.doi ? (
                <a
                  className="measure text-[var(--text-small)] leading-snug break-all"
                  href={doiUrl(compound.doi)}
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  {compound.doi}
                </a>
              ) : (
                <p className="text-[var(--text-small)] text-growth">
                  No DOI on this record.
                </p>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="legend mb-1.5">SMILES</h3>
              <p className="measure max-h-20 overflow-y-auto text-[var(--text-legend)] leading-relaxed break-all text-ink-dim">
                {compound.smiles}
              </p>
            </div>
          </div>
        </div>
      </div>

      {compound.twin ? (
        <p className="mt-5 border-l border-broth pl-4 text-[var(--text-body)] leading-snug text-broth">
          This compound has the same Morgan fingerprint as a compound in the
          training set. The model is recognising something it has already seen,
          not generalising to it. It ships flagged rather than deleted.
        </p>
      ) : null}
    </article>
  );
}
