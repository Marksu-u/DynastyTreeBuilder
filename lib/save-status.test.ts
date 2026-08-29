import { describe, it, expect } from 'vitest';
import { advanceSave, type SavePhase } from './save-status';

/** Replays a run of phases and collects everything that would be reported. */
function run(phases: SavePhase[]) {
  let pending = 0;
  const reported: (string | null)[] = [];
  for (const phase of phases) {
    const next = advanceSave(pending, phase);
    pending = next.pending;
    if (next.report) reported.push(next.report);
  }
  return { pending, reported };
}

describe('advanceSave', () => {
  it('reports saving as soon as a save starts', () => {
    expect(advanceSave(0, 'begin')).toEqual({ pending: 1, report: 'saving' });
  });

  it('reports saved once the last save settles', () => {
    expect(run(['begin', 'settle'])).toEqual({
      pending: 0,
      reported: ['saving', 'saved'],
    });
  });

  it('stays silent while other saves are still in flight', () => {
    // Two overlapping saves: the first to settle must not claim the tree is
    // saved while the second is still writing.
    expect(run(['begin', 'begin', 'settle'])).toEqual({
      pending: 1,
      reported: ['saving', 'saving'],
    });
  });

  it('reports saved only after every in-flight save settles', () => {
    expect(run(['begin', 'begin', 'settle', 'settle'])).toEqual({
      pending: 0,
      reported: ['saving', 'saving', 'saved'],
    });
  });

  it('reports a failure immediately, even with saves still in flight', () => {
    // A failed write is the one thing worth interrupting for — the chip has to
    // show it rather than wait for unrelated saves to finish.
    expect(run(['begin', 'begin', 'fail'])).toEqual({
      pending: 1,
      reported: ['saving', 'saving', 'error'],
    });
  });

  it('never counts below zero', () => {
    // A stray settle would otherwise leave the count negative, and the count
    // would never reach zero again — the chip would spin on "Saving…" forever.
    expect(advanceSave(0, 'settle')).toEqual({ pending: 0, report: 'saved' });
    expect(advanceSave(0, 'fail')).toEqual({ pending: 0, report: 'error' });
  });

  it('recovers to saved after a failure once the tree settles', () => {
    expect(run(['begin', 'fail', 'begin', 'settle'])).toEqual({
      pending: 0,
      reported: ['saving', 'error', 'saving', 'saved'],
    });
  });
});
