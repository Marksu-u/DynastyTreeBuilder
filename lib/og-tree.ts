/**
 * Draws a dynasty's real structure as a standalone SVG string, for embedding in
 * Open Graph images as a data URI. Pure — it reuses the same layout engine the
 * canvas uses, so the social preview matches what the user actually built.
 *
 * Names are deliberately not rendered: at 1200×630 a 24-person house would put
 * them at ~10px (illegible), and it keeps campaign content out of link previews
 * that get reposted beyond the audience the DM chose to share with.
 */
import {
  layoutGenealogy, buildFamilyGraph, CARD_W, CARD_H,
  type LayoutNodeIn, type LayoutEdgeIn,
} from './genealogy-layout';
import { migrateCanvas } from './migrate-canvas';

// Mirror the app's tokens (see globals.css): surface-2, border, border-strong.
const GOLD = '#EF9F27';
const LINE = '#333E58';
const CARD_FILL = '#1C2438';
const BAR = '#4C5876';

/**
 * The gold-traced path in the image. Deterministic by construction: the longest
 * chain of descent from a founder, with ties broken by `characterIds` insertion
 * order — which `buildFamilyGraph` documents as its determinism anchor.
 *
 * No memoisation: an OG image draws at most 60 characters, so a plain DFS is
 * cheap, and caching subtree results while a cycle guard is active is subtly
 * wrong on malformed data.
 */
export function principalBloodline(
  nodes: LayoutNodeIn[], edges: LayoutEdgeIn[], founderIds: string[],
): string[] {
  const graph = buildFamilyGraph(nodes, edges);
  if (graph.characterIds.length === 0) return [];

  function longestFrom(id: string, seen: Set<string>): string[] {
    if (seen.has(id)) return [id];
    seen.add(id);

    let best: string[] = [];
    for (const union of graph.partnerUnions.get(id) ?? []) {
      for (const child of union.children) {
        const chain = longestFrom(child, seen);
        if (chain.length > best.length) best = chain;
      }
    }
    seen.delete(id);
    return [id, ...best];
  }

  // Insertion order, filtered — never `founderIds` order — so the tie-break is
  // anchored to the graph rather than to however the caller sorted its input.
  const starts = founderIds.length > 0
    ? graph.characterIds.filter((id) => founderIds.includes(id))
    : graph.characterIds;
  if (starts.length === 0) return [];

  let best: string[] = [];
  for (const start of starts) {
    const chain = longestFrom(start, new Set());
    if (chain.length > best.length) best = chain;
  }
  return best;
}

export interface RenderOpts {
  width: number;
  height: number;
  max?: number;
}

function emptySvg(width: number, height: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"></svg>`;
}

export interface PlacedCard { id: string; p: { x: number; y: number } }

export interface TreeGeometry {
  placed: PlacedCard[];
  edges: LayoutEdgeIn[];
  positions: Record<string, { x: number; y: number }>;
  rows: { index: number; y: number; height: number }[];
  lit: Set<string>;
  viewBox: { x: number; y: number; w: number; h: number };
}

/**
 * Everything both renderers need: laid-out positions, the lit bloodline, and a
 * framed viewBox. Shared so the social image and the landing page can never
 * disagree about where a house's cards sit.
 */
export function treeGeometry(
  nodes: LayoutNodeIn[],
  edges: LayoutEdgeIn[],
  founderIds: string[],
  opts: { max?: number; minW?: number; minH?: number } = {},
): TreeGeometry | null {
  const { max = 60, minW = 1200, minH = 940 } = opts;

  // A 300-person house would be an unreadable hairball and would blow the render
  // budget on a route Discord fetches synchronously.
  const characters = nodes.filter((n) => n.type !== 'union').slice(0, max);
  if (characters.length === 0) return null;

  const kept = [...characters, ...nodes.filter((n) => n.type === 'union')];
  const keptIds = new Set(kept.map((n) => n.id));
  const keptEdges = edges.filter((e) => keptIds.has(e.source) && keptIds.has(e.target));

  const { positions, rows } = layoutGenealogy(kept, keptEdges);

  // Connectors route character → union → character, so lighting only the
  // characters leaves the gold path visually broken. A union is lit when it
  // joins a lit parent to a lit child.
  const lit = new Set(principalBloodline(kept, keptEdges, founderIds));
  for (const union of buildFamilyGraph(kept, keptEdges).unions) {
    if (union.partners.some((p) => lit.has(p)) && union.children.some((c) => lit.has(c))) {
      lit.add(union.id);
    }
  }

  const placed = characters
    .map((n) => ({ id: n.id, p: positions[n.id] }))
    .filter((n): n is PlacedCard => Boolean(n.p));
  if (placed.length === 0) return null;

  const pad = 40;
  const rawMinX = Math.min(...placed.map((n) => n.p.x)) - pad;
  const rawMaxX = Math.max(...placed.map((n) => n.p.x + CARD_W)) + pad;
  const rawMinY = Math.min(...placed.map((n) => n.p.y)) - pad;
  const rawMaxY = Math.max(...placed.map((n) => n.p.y + CARD_H)) + pad;

  // Floor the viewBox so a tiny dynasty — the first thing a new user shares —
  // does not scale its single card up to fill the whole panel.
  const cx = (rawMinX + rawMaxX) / 2;
  const cy = (rawMinY + rawMaxY) / 2;
  const w = Math.max(rawMaxX - rawMinX, minW);
  const h = Math.max(rawMaxY - rawMinY, minH);

  return {
    placed,
    edges: keptEdges,
    positions,
    rows,
    lit,
    viewBox: { x: cx - w / 2, y: cy - h / 2, w, h },
  };
}

export function renderTreeSvg(
  nodes: LayoutNodeIn[], edges: LayoutEdgeIn[], founderIds: string[], opts: RenderOpts,
): string {
  const { width, height, max = 60 } = opts;
  const geo = treeGeometry(nodes, edges, founderIds, { max });
  if (!geo) return emptySvg(width, height);

  const { positions, lit, placed } = geo;
  const { x: viewMinX, y: viewMinY, w: vw, h: vh } = geo.viewBox;

  const connectors = geo.edges
    .map((e) => {
      const a = positions[e.source];
      const b = positions[e.target];
      if (!a || !b) return '';
      const isLit = lit.has(e.source) && lit.has(e.target);
      const x1 = a.x + CARD_W / 2, y1 = a.y + CARD_H / 2;
      const x2 = b.x + CARD_W / 2, y2 = b.y + CARD_H / 2;
      const mid = (y1 + y2) / 2;
      return `<path d="M${x1},${y1} V${mid} H${x2} V${y2}" fill="none" stroke="${isLit ? GOLD : LINE}" stroke-width="${isLit ? 5 : 3}"/>`;
    })
    .join('');

  const cards = placed
    .map(({ id, p }) => {
      const isLit = lit.has(id);
      return (
        `<rect x="${p.x}" y="${p.y}" width="${CARD_W}" height="${CARD_H}" rx="10" fill="${CARD_FILL}" stroke="${isLit ? GOLD : LINE}" stroke-width="3"/>` +
        `<rect x="${p.x + 20}" y="${p.y + 18}" width="90" height="9" rx="4" fill="${isLit ? GOLD : BAR}"/>` +
        `<rect x="${p.x + 20}" y="${p.y + 38}" width="56" height="7" rx="3" fill="${LINE}"/>`
      );
    })
    .join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="${viewMinX} ${viewMinY} ${vw} ${vh}" ` +
    `preserveAspectRatio="xMidYMid meet">` +
    connectors + cards +
    `</svg>`
  );
}

export interface OgCharacter { id: string; flags: string[] }
export interface OgRelationship { fromId: string; toId: string; type: string }

/**
 * Legacy pair edges → the union-node model `layoutGenealogy` expects, matching
 * what ShareCanvas does at render time. Without this the DB's SPOUSE/PARENT rows
 * never become union nodes and the tree renders as disconnected cards.
 *
 * Also pulls out the founders, which pick the gold-traced principal bloodline.
 */
export function buildOgGraph(characters: OgCharacter[], relationships: OgRelationship[]): {
  nodes: LayoutNodeIn[];
  edges: LayoutEdgeIn[];
  founderIds: string[];
} {
  const rfNodes = characters.map((c) => ({
    id: c.id,
    type: 'character' as const,
    position: { x: 0, y: 0 },
    data: {},
  }));
  const rfEdges = relationships.map((r, i) => ({
    id: `e${i}`,
    type: 'relationship' as const,
    source: r.fromId,
    target: r.toId,
    data: { type: r.type },
  }));

  const migrated = migrateCanvas(rfNodes as never, rfEdges as never);

  return {
    nodes: migrated.nodes.map((n) => ({ id: n.id, type: n.type })),
    // `data.type` must survive: buildFamilyGraph and layoutGenealogy both key off
    // it to resolve a union's partners and children. Dropping it renders the
    // whole tree as disconnected cards.
    edges: migrated.edges.map((e) => ({
      source: e.source,
      target: e.target,
      data: { type: e.data?.type as string | undefined },
    })),
    founderIds: characters.filter((c) => c.flags.includes('FOUNDER')).map((c) => c.id),
  };
}
