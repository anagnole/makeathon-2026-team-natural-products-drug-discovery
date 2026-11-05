declare module "smiles-drawer" {
  type Theme = Record<string, string>;

  class SmiDrawer {
    constructor(moleculeOptions?: Record<string, unknown>, reactionOptions?: Record<string, unknown>);
    draw(
      smiles: string,
      target: SVGSVGElement | HTMLCanvasElement | string,
      theme?: string,
      successCallback?: (() => void) | null,
      errorCallback?: ((error: unknown) => void) | null,
      weights?: number[] | null,
    ): void;
  }

  const SmilesDrawer: {
    SmiDrawer: typeof SmiDrawer;
    themes?: Record<string, Theme>;
  };

  export default SmilesDrawer;
}
