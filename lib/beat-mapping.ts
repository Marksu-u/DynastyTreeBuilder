/**
 * Pure helpers for the landing page's scroll-driven generation reveal, split out
 * of the component so they can be unit-tested — the DOM half is only verifiable
 * in a real browser.
 *
 * Continuous progress rather than discrete copy blocks: it decouples the number
 * of generations from the number of paragraphs, and it runs in both directions,
 * so scrolling back up un-grows the house instead of leaving it finished.
 */

/**
 * How far the reader has moved through the growing section, 0 → 1.
 *
 * `firstTop` and `lastBottom` are viewport-relative (straight off
 * `getBoundingClientRect`). The read head is the middle of the viewport, so a
 * generation lands while its paragraph is being read rather than as it enters.
 */
export function scrollProgress(
  firstTop: number,
  lastBottom: number,
  viewportHeight: number,
): number {
  const span = lastBottom - firstTop;
  if (span <= 0) return 1;
  const travelled = viewportHeight / 2 - firstTop;
  return Math.min(1, Math.max(0, travelled / span));
}

/** The deepest generation band visible at a given progress. */
export function bandForProgress(progress: number, bandCount: number): number {
  const last = bandCount - 1;
  if (last <= 0) return 0;
  const clamped = Math.min(1, Math.max(0, progress));
  return Math.round(clamped * last);
}
