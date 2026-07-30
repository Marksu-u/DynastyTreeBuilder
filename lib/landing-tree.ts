/**
 * The landing page's hero tree.
 *
 * Server-rendered SVG rather than a mounted React Flow canvas: `@xyflow/react`
 * is >100KB gzipped and is not otherwise in the landing bundle, and this is the
 * one page that has to win Core Web Vitals. This gives the real geometry from
 * the real layout engine with zero client JavaScript.
 *
 * Cards and connectors are grouped into `<g data-gen="N">` bands so the page can
 * reveal one generation at a time as the reader scrolls. Every connector carries
 * `pathLength="1"`, which normalises the draw-on animation: a short marriage line
 * and a long sibling rail take the same time to draw regardless of actual length.
 */
import { CARD_W, CARD_H, type LayoutNodeIn, type LayoutEdgeIn } from './genealogy-layout';
import { treeGeometry } from './og-tree';

const GOLD = '#EF9F27';
const LINE = '#333E58';
const CARD_FILL = '#1C2438';
const BAR = '#4C5876';

export interface LandingTree {
  svg: string;
  generations: number;
}

/** How far a single generation may be blown up. Without a cap the founding
 *  couple fills the panel at cartoon size. */
const MAX_ZOOM = 1.9;

/** Which generation band a y coordinate falls in. */
function bandOf(y: number, rows: { y: number; height: number }[]): number {
  for (let i = 0; i < rows.length; i++) {
    if (y < rows[i].y + rows[i].height) return i;
  }
  return Math.max(0, rows.length - 1);
}

export function renderLandingTree(
  nodes: LayoutNodeIn[],
  edges: LayoutEdgeIn[],
  founderIds: string[],
): LandingTree {
  // Shallower floor than the social card uses: the landing column is wide and
  // short, and the OG image's 1200×940 minimum letterboxes a broad house into a
  // thin band with dead space above and below it.
  const geo = treeGeometry(nodes, edges, founderIds, { max: 60, minW: 1400, minH: 560 });
  if (!geo) return { svg: '', generations: 0 };

  const { positions, lit, placed, rows, viewBox } = geo;
  const generations = Math.max(1, rows.length);

  const byBand: string[][] = Array.from({ length: generations }, () => []);

  // A connector belongs to the deeper of its two endpoints, so it draws in the
  // same beat as the card it arrives at rather than ahead of it.
  for (const e of geo.edges) {
    const a = positions[e.source];
    const b = positions[e.target];
    if (!a || !b) continue;
    const isLit = lit.has(e.source) && lit.has(e.target);
    const x1 = a.x + CARD_W / 2, y1 = a.y + CARD_H / 2;
    const x2 = b.x + CARD_W / 2, y2 = b.y + CARD_H / 2;
    const mid = (y1 + y2) / 2;
    const band = Math.max(bandOf(a.y, rows), bandOf(b.y, rows));
    byBand[Math.min(band, generations - 1)].push(
      `<path class="dt-conn${isLit ? ' dt-lit' : ''}" pathLength="1" d="M${x1},${y1} V${mid} H${x2} V${y2}" ` +
      `fill="none" stroke="${isLit ? GOLD : LINE}" stroke-width="${isLit ? 5 : 3}"/>`,
    );
  }

  for (const { id, p } of placed) {
    const isLit = lit.has(id);
    const band = bandOf(p.y, rows);
    byBand[Math.min(band, generations - 1)].push(
      `<g class="dt-card">` +
      `<rect x="${p.x}" y="${p.y}" width="${CARD_W}" height="${CARD_H}" rx="10" fill="${CARD_FILL}" stroke="${isLit ? GOLD : LINE}" stroke-width="3"/>` +
      `<rect x="${p.x + 20}" y="${p.y + 18}" width="90" height="9" rx="4" fill="${isLit ? GOLD : BAR}"/>` +
      `<rect x="${p.x + 20}" y="${p.y + 38}" width="56" height="7" rx="3" fill="${LINE}"/>` +
      `</g>`,
    );
  }

  const bands = byBand
    .map((content, i) => `<g class="dt-gen" data-gen="${i}">${content.join('')}</g>`)
    .join('');

  // One transform per reveal stage, framing just the generations visible at that
  // stage. The stager applies these as the house grows, so the view pulls back
  // to make room instead of leaving early generations marooned in a panel sized
  // for the finished tree.
  const fits: string[] = [];
  for (let stage = 0; stage < generations; stage++) {
    const shown = placed.filter((n) => bandOf(n.p.y, rows) <= stage);
    if (shown.length === 0) {
      fits.push('translate(0px, 0px) scale(1)');
      continue;
    }
    const pad = 60;
    const bx = Math.min(...shown.map((n) => n.p.x)) - pad;
    const bX = Math.max(...shown.map((n) => n.p.x + CARD_W)) + pad;
    const by = Math.min(...shown.map((n) => n.p.y)) - pad;
    const bY = Math.max(...shown.map((n) => n.p.y + CARD_H)) + pad;

    const s = Math.min(viewBox.w / (bX - bx), viewBox.h / (bY - by), MAX_ZOOM);
    const tx = viewBox.x + viewBox.w / 2 - s * ((bx + bX) / 2);
    const ty = viewBox.y + viewBox.h / 2 - s * ((by + bY) / 2);
    // CSS syntax, not SVG attribute syntax — these are assigned to
    // `style.transform`, and CSS rejects unitless translate values outright.
    // With `transform-box: view-box`, px here means SVG user units.
    fits.push(`translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${s.toFixed(4)})`);
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}" ` +
    `preserveAspectRatio="xMidYMid meet" role="img" ` +
    `aria-label="An example family tree spanning ${generations} generations, with the main bloodline traced in gold">` +
    `<g class="dt-fit" data-fit="${fits.join('|')}">${bands}</g>` +
    `</svg>`;

  return { svg, generations };
}
