// lib/fit-text.ts
// Pure text fitting for the character card. No DOM, no canvas: the server
// render, the client render and the html-to-image export must all reach the
// same answer, and anything measured at runtime would only agree after an
// effect has run.
//
// To regenerate lib/geist-metrics.ts, run this in the browser console on a page
// where the font is loaded, and paste the result:
//
//   const ctx = document.createElement('canvas').getContext('2d');
//   ctx.font = 'normal 600 100px Geist';
//   Object.fromEntries([...'…every character you want…'].map(c =>
//     [c, +(ctx.measureText(c).width / 100).toFixed(4)]));

import { GEIST_600, GEIST_600_FALLBACK } from './geist-metrics';

/** Width of one character at the given font size, in px. */
export function charWidth(ch: string, fontSize: number): number {
  return (GEIST_600[ch] ?? GEIST_600_FALLBACK) * fontSize;
}

/** Width of a string laid out on a single unbroken line, in px. */
export function measureLine(text: string, fontSize: number): number {
  let total = 0;
  for (const ch of text) total += charWidth(ch, fontSize);
  return total;
}

/** Characters a browser will break *after*. */
const BREAK_AFTER = new Set([' ', '-', '/', '–', '—']);

/** Splits text into chunks that each end at a break opportunity. */
function tokenize(text: string): string[] {
  const out: string[] = [];
  let cur = '';
  for (const ch of text) {
    cur += ch;
    if (BREAK_AFTER.has(ch)) {
      out.push(cur);
      cur = '';
    }
  }
  if (cur) out.push(cur);
  return out;
}

/**
 * Lines this text needs at this size, wrapping greedily the way a browser
 * does. Trailing whitespace does not push a line over, because a break eats it.
 */
export function countLines(text: string, fontSize: number, maxWidth: number): number {
  const tokens = tokenize(text);
  if (tokens.length === 0) return 1;

  let lines = 1;
  let x = 0;

  for (const token of tokens) {
    const trimmed = token.replace(/\s+$/, '');
    const trimmedWidth = measureLine(trimmed, fontSize);

    if (x > 0 && x + trimmedWidth > maxWidth) {
      lines += 1;
      x = 0;
    }

    if (trimmedWidth > maxWidth) {
      // Wider than a whole line even on its own: break between characters.
      for (const ch of trimmed) {
        const w = charWidth(ch, fontSize);
        if (x > 0 && x + w > maxWidth) {
          lines += 1;
          x = 0;
        }
        x += w;
      }
    } else {
      x += measureLine(token, fontSize);
    }
  }

  return lines;
}

/**
 * The name's shrink ladder, largest first. It stops at 11px because
 * docs/design.md bottoms the type scale out at 11px for caption text and
 * reserves 10px for badges — a name is body text, not a badge.
 */
export const NAME_SIZES = [14, 13, 12, 11] as const;

/**
 * Largest size from the ladder at which the text fits inside maxLines. Falls
 * back to the smallest size when nothing fits — the card clamps from there, so
 * a very long name is clipped rather than overflowing its neighbours.
 */
export function fitFontSize(
  text: string,
  { maxWidth, maxLines }: { maxWidth: number; maxLines: number },
): number {
  for (const size of NAME_SIZES) {
    if (countLines(text, size, maxWidth) <= maxLines) return size;
  }
  return NAME_SIZES[NAME_SIZES.length - 1];
}
