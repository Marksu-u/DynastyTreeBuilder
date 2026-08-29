/**
 * The product mark: a founder node descending to two heirs.
 *
 * Not a crest — `lib/crest` generates a *house's* arms from a seed, one per
 * dynasty, and that output is user content. This is the app's own icon, one
 * fixed drawing, so it is a constant rather than a generator.
 *
 * `app/icon.svg` is the same drawing as a real file on disk, because Next only
 * picks up a static `icon.svg` that way. `lib/mark.test.ts` pins the two
 * together so the tab icon and the raster fallbacks can never drift apart.
 */

/**
 * The rounded tile. A favicon sits on whatever colour the browser paints its
 * tab strip, so the mark cannot inherit our ground and has to carry one.
 *
 * Inset by half a unit because the 1-unit stroke is centred on the edge, and
 * the outer half would otherwise be clipped by the viewBox.
 */
const TILE = `  <rect x=".5" y=".5" width="31" height="31" rx="7.5" fill="#0F172A" stroke="#1E293B"/>

`;

interface MarkOptions {
  /**
   * Draw the rounded tile behind the glyph. Turn it off where the surface
   * supplies its own rounding — iOS masks `apple-icon` to its own squircle, so
   * that tile has to be full-bleed or the corners cut into ours.
   */
  tile?: boolean;
}

/** The mark at `size` CSS pixels. The artwork is authored on a 32-unit grid. */
export function markSvg(size = 32, { tile = true }: MarkOptions = {}): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}" fill="none">
${tile ? TILE : ''}  <!-- Descent: founder down to the two heirs, joined by the sibling bar. -->
  <path d="M16 9L8 19M16 9L24 19M8 19H24" stroke="#64748B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- The founder. -->
  <path d="M16 5L20 9L16 13L12 9L16 5Z" fill="#F59E0B" stroke="#FDE68A" stroke-linejoin="round"/>

  <!-- The two heirs, each a branch of the house. -->
  <path d="M8 16L11 19L8 22L5 19L8 16Z" fill="#8B5CF6" stroke="#C4B5FD" stroke-width=".8" stroke-linejoin="round"/>
  <path d="M24 16L27 19L24 22L21 19L24 16Z" fill="#10B981" stroke="#6EE7B7" stroke-width=".8" stroke-linejoin="round"/>

  <!-- Direct line: the junction where the bar meets the founder's descent. -->
  <circle cx="16" cy="19" r="1.5" fill="#F59E0B"/>
</svg>`;
}

/** The tile's ground, for surfaces that have to paint it themselves. */
export const MARK_TILE = '#0F172A';
