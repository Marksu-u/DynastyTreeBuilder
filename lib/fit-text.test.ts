// lib/fit-text.test.ts
import { describe, it, expect } from 'vitest';
import { measureLine } from './fit-text';

describe('measureLine', () => {
  it('measures nothing as zero', () => {
    expect(measureLine('', 14)).toBe(0);
  });

  it('scales linearly with font size', () => {
    expect(measureLine('Aldric', 28)).toBeCloseTo(measureLine('Aldric', 14) * 2, 5);
  });

  it('lands within the kerning bias of the real rendered width', () => {
    // canvas.measureText on the live app reports 126px for this string at 14px.
    // Summing advances ignores kerning, so we expect 126 to 1.06 * 126.
    const w = measureLine('Rhaenyra Velaryon', 14);
    expect(w).toBeGreaterThanOrEqual(126);
    expect(w).toBeLessThanOrEqual(126 * 1.06);
  });

  it('falls back to a mid-width letter for unknown characters', () => {
    // U+4E2D is not in the table; it must not measure as zero.
    expect(measureLine('中', 14)).toBeGreaterThan(0);
  });
});
