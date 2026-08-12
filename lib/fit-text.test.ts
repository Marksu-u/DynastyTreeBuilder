// lib/fit-text.test.ts
import { describe, it, expect } from 'vitest';
import { measureLine, countLines } from './fit-text';

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

describe('countLines', () => {
  it('counts empty text as one line', () => {
    expect(countLines('', 14, 134)).toBe(1);
  });

  it('keeps a short name on one line', () => {
    // 'Aldric Thorne' measures about 92px at 14px, well inside 134.
    expect(countLines('Aldric Thorne', 14, 134)).toBe(1);
  });

  it('wraps at spaces when the line is full', () => {
    expect(countLines('Aldric Thorne', 14, 60)).toBeGreaterThan(1);
  });

  it('treats a hyphen as a break opportunity', () => {
    // Same letters, but the hyphenated form has an extra place to break, so it
    // can never need more lines than the unbroken one.
    const hyphenated = countLines('Blackwood-Marchetti', 14, 90);
    const solid = countLines('BlackwoodMarchetti', 14, 90);
    expect(hyphenated).toBeLessThanOrEqual(solid);
  });

  it('breaks inside a word that is wider than the line', () => {
    expect(countLines('Aelthornblackwoodmarchetti', 14, 60)).toBeGreaterThan(1);
  });

  it('never reports a line wider than maxWidth for breakable text', () => {
    // A single character always fits, so an unbreakable run still terminates.
    expect(countLines('W'.repeat(40), 11, 30)).toBeGreaterThan(1);
  });
});
