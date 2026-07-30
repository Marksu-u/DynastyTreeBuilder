import { describe, it, expect } from 'vitest';
import { scrollProgress, bandForProgress } from './beat-mapping';

describe('scrollProgress', () => {
  const VH = 720;

  it('is 0 before the section reaches the read head', () => {
    expect(scrollProgress(700, 2700, VH)).toBe(0);
    expect(scrollProgress(5000, 7000, VH)).toBe(0);
  });

  it('is 1 once the section has passed', () => {
    expect(scrollProgress(-3000, -1000, VH)).toBe(1);
  });

  it('is 0.5 at the midpoint', () => {
    // Read head sits at 360. Span runs from 360-1000 to 360+1000.
    expect(scrollProgress(-640, 1360, VH)).toBeCloseTo(0.5, 5);
  });

  it('increases monotonically as the page scrolls', () => {
    let prev = -1;
    for (let scrolled = 0; scrolled <= 2400; scrolled += 200) {
      const p = scrollProgress(600 - scrolled, 2600 - scrolled, VH);
      expect(p).toBeGreaterThanOrEqual(prev);
      prev = p;
    }
    expect(prev).toBe(1);
  });

  it('survives a zero-height section', () => {
    expect(scrollProgress(100, 100, VH)).toBe(1);
  });
});

describe('bandForProgress', () => {
  it('opens on the founders and ends on the deepest generation', () => {
    expect(bandForProgress(0, 5)).toBe(0);
    expect(bandForProgress(1, 5)).toBe(4);
  });

  it('walks every band in between', () => {
    const seen = new Set<number>();
    for (let p = 0; p <= 1.0001; p += 0.02) seen.add(bandForProgress(p, 5));
    expect([...seen].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4]);
  });

  it('is reversible — the same progress always gives the same band', () => {
    expect(bandForProgress(0.5, 5)).toBe(bandForProgress(0.5, 5));
    expect(bandForProgress(0.25, 5)).toBeLessThan(bandForProgress(0.75, 5));
  });

  it('clamps out-of-range progress', () => {
    expect(bandForProgress(-2, 5)).toBe(0);
    expect(bandForProgress(9, 5)).toBe(4);
  });

  it('handles a single-generation dynasty', () => {
    expect(bandForProgress(0.7, 1)).toBe(0);
  });
});
