/**
 * Save-status bookkeeping for the canvas, kept as a pure transition so it can
 * never run as a side effect inside a React state updater — React replays
 * updaters during render, and reporting from in there sets state on the parent
 * mid-render.
 */

export type SaveStatus = 'saved' | 'saving' | 'error';

/** `begin` a write, then either `settle` it or let it `fail`. */
export type SavePhase = 'begin' | 'settle' | 'fail';

export type SaveTransition = {
  /** Writes still in flight after this phase. */
  pending: number;
  /** What the chip should show, or null when this phase changes nothing. */
  report: SaveStatus | null;
};

/**
 * Several writes can overlap — deleting a character while an edit is still
 * saving — so "saved" only means something once the last one lands. A failure
 * reports straight away regardless: a write that didn't land is worth saying
 * out loud before the rest of the queue drains.
 */
export function advanceSave(pending: number, phase: SavePhase): SaveTransition {
  if (phase === 'begin') {
    return { pending: pending + 1, report: 'saving' };
  }

  // Floored, because a count that slipped negative would never reach zero
  // again and the chip would spin on "Saving…" for the rest of the session.
  const next = Math.max(0, pending - 1);

  if (phase === 'fail') {
    return { pending: next, report: 'error' };
  }

  return { pending: next, report: next === 0 ? 'saved' : null };
}
