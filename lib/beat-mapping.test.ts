import { describe, it, expect } from 'vitest';
import { bandForBeat, activeBeat } from './beat-mapping';

describe('bandForBeat', () => {
  // The real case: House Thorne has 4 generations, the page has 3 beats, and it
  // opens with bands 0 and 1 already shown.
  it('reaches the deepest generation on the last beat', () => {
    expect(bandForBeat(0, 3, 4, 1)).toBe(1);
    expect(bandForBeat(1, 3, 4, 1)).toBe(2);
    expect(bandForBeat(2, 3, 4, 1)).toBe(3);
  });

  it('never goes below the resting band', () => {
    for (let b = 0; b < 3; b++) expect(bandForBeat(b, 3, 4, 1)).toBeGreaterThanOrEqual(1);
  });

  it('is monotonic in the beat', () => {
    let prev = -1;
    for (let b = 0; b < 6; b++) {
      const band = bandForBeat(b, 6, 9, 2);
      expect(band).toBeGreaterThanOrEqual(prev);
      prev = band;
    }
  });

  it('handles a dynasty with fewer generations than beats', () => {
    expect(bandForBeat(0, 3, 2, 1)).toBe(1);
    expect(bandForBeat(2, 3, 2, 1)).toBe(1);
  });

  it('clamps out-of-range beats', () => {
    expect(bandForBeat(-5, 3, 4, 1)).toBe(1);
    expect(bandForBeat(99, 3, 4, 1)).toBe(3);
  });

  it('handles a single-generation dynasty', () => {
    expect(bandForBeat(1, 3, 1, 0)).toBe(0);
  });
});

describe('activeBeat', () => {
  it('picks the last beat past the viewport middle', () => {
    expect(activeBeat([-800, -100, 500], 720)).toBe(1);
    expect(activeBeat([-1600, -900, -200], 720)).toBe(2);
  });

  it('stays on the first beat before anything crosses', () => {
    expect(activeBeat([600, 1200, 1800], 720)).toBe(0);
  });
});
