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
