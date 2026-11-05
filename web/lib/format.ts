export const pct = (value: number, digits = 1) =>
  `${(value * 100).toFixed(digits)}%`;

export const dec = (value: number, digits = 3) => value.toFixed(digits);

export const count = (value: number) => value.toLocaleString("en-GB");

/** "0.986" reads better than "98.6%" for a similarity coefficient. */
export const tanimoto = (value: number) => value.toFixed(3);

export const doiUrl = (doi: string) =>
  `https://doi.org/${doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")}`;
