/**
 * Pure helpers for the landing page's scroll-driven generation reveal, split out
 * of the component so they can be unit-tested — the DOM half is only verifiable
 * in a real browser.
 */

/**
 * Maps a copy beat onto a generation band. There are more generations than
 * beats, so the ranges have to be mapped rather than assumed equal: otherwise
 * the deepest generation never reveals and the house looks truncated.
 *
 * `start` is the band already visible at rest — the page opens on two
 * generations, because a single row of founders reads as an empty page.
 */
export function bandForBeat(
  beat: number,
  beatCount: number,
  bandCount: number,
  start: number,
): number {
  const last = bandCount - 1;
  if (last <= start) return last;
  const lastBeat = Math.max(1, beatCount - 1);
  const clamped = Math.min(Math.max(beat, 0), lastBeat);
  return start + Math.round((clamped / lastBeat) * (last - start));
}

/** The index of the last beat whose top edge has crossed the viewport middle. */
export function activeBeat(tops: number[], viewportHeight: number): number {
  const mid = viewportHeight / 2;
  let active = 0;
  for (let i = 0; i < tops.length; i++) {
    if (tops[i] <= mid) active = i;
  }
  return active;
}
