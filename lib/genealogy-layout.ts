// lib/genealogy-layout.ts
// Pure genealogy layout: computes positions for EVERY node (characters and
// unions) plus generation-row metadata, from the union-node graph.
// No React / React Flow imports — unit-testable.

export const CARD_W = 180;
export const CARD_H = 64;
export const PARTNER_GAP = 48;   // gap between partner cards (marriage line lives here)
export const SIBLING_GAP = 40;   // gap between sibling blocks
export const GROUP_GAP = 64;     // gap between child groups of different unions
export const CLUSTER_GAP = 160;  // gap between disconnected family clusters
export const ROW_HEIGHT = 200;   // vertical pitch per generation
export const RAIL_OFFSET = 24;   // sibling rail sits this far above the child row (edge renderer)
export const MARRIAGE_OFFSET = 20; // first below-row marriage rail sits this far under the card bottom
export const MARRIAGE_STEP = 16;   // vertical gap between a 3+-spouse anchor's stacked marriage rails
export const RAIL_STEP = 16;   // vertical gap between a parent's stacked sibling rails

export interface LayoutNodeIn { id: string; type?: string }
export interface LayoutEdgeIn { source: string; target: string; data?: { type?: string } }
export interface GenerationRow { index: number; y: number; height: number }
export interface GenealogyLayout {
  positions: Record<string, { x: number; y: number }>;
  rows: GenerationRow[];
  railLevels: Record<string, number>;
}

export interface Union { id: string; partners: string[]; children: string[] }

export interface FamilyGraph {
  characterIds: string[];               // insertion order — the determinism anchor
  unions: Union[];
  unionById: Map<string, Union>;
  partnerUnions: Map<string, Union[]>;  // charId → unions where char is a partner
  parentUnions: Map<string, Union[]>;   // charId → unions where char is a child
}

function push<K, V>(m: Map<K, V[]>, k: K, v: V): void {
  const arr = m.get(k);
  if (arr) arr.push(v);
  else m.set(k, [v]);
}

export function buildFamilyGraph(nodes: LayoutNodeIn[], edges: LayoutEdgeIn[]): FamilyGraph {
  const characterIds = nodes.filter(n => n.type !== 'union').map(n => n.id);
  const charSet = new Set(characterIds);
  const unionById = new Map<string, Union>();
  for (const n of nodes) {
    if (n.type === 'union') unionById.set(n.id, { id: n.id, partners: [], children: [] });
  }

  for (const e of edges) {
    const t = e.data?.type;
    if (t === 'PARTNER' && unionById.has(e.target) && charSet.has(e.source)) {
      const u = unionById.get(e.target)!;
      if (!u.partners.includes(e.source)) u.partners.push(e.source);
    } else if ((t === 'CHILD' || t === 'ADOPTED_CHILD') && unionById.has(e.source) && charSet.has(e.target)) {
      const u = unionById.get(e.source)!;
      if (!u.children.includes(e.target)) u.children.push(e.target);
    }
  }

  const unions = [...unionById.values()];
  const partnerUnions = new Map<string, Union[]>();
  const parentUnions = new Map<string, Union[]>();
  for (const u of unions) {
    for (const p of u.partners) push(partnerUnions, p, u);
    for (const c of u.children) push(parentUnions, c, u);
  }
  return { characterIds, unions, unionById, partnerUnions, parentUnions };
}

/**
 * Iterative constraint solving: partners share a rank; a child sits one rank
 * below its union. Ranks only ever increase, so cyclic (corrupt) data simply
 * hits the iteration cap and stays clamped — finite and deterministic.
 */
export function assignGenerations(graph: FamilyGraph): Map<string, number> {
  const rank = new Map<string, number>();
  for (const id of graph.characterIds) rank.set(id, 0);
  const cap = Math.max(16, (graph.characterIds.length + graph.unions.length) * 4);
  for (let i = 0; i < cap; i++) {
    let changed = false;
    for (const u of graph.unions) {
      if (u.partners.length === 0) continue;
      const r = Math.max(...u.partners.map(p => rank.get(p) ?? 0));
      for (const p of u.partners) {
        if ((rank.get(p) ?? 0) < r) { rank.set(p, r); changed = true; }
      }
      for (const c of u.children) {
        if ((rank.get(c) ?? 0) < r + 1) { rank.set(c, r + 1); changed = true; }
      }
    }
    if (!changed) break;
  }
  return rank;
}

// ── clusters ──────────────────────────────────────────────────────────────────

function findClusters(graph: FamilyGraph): string[][] {
  // connectivity through unions: all members of a union are connected
  const adj = new Map<string, string[]>();
  for (const u of graph.unions) {
    const members = [...u.partners, ...u.children];
    for (let i = 1; i < members.length; i++) {
      push(adj, members[0], members[i]);
      push(adj, members[i], members[0]);
    }
  }
  const component = new Map<string, number>();
  let comp = 0;
  for (const id of graph.characterIds) {
    if (component.has(id)) continue;
    const queue = [id];
    component.set(id, comp);
    while (queue.length) {
      const cur = queue.pop()!;
      for (const nb of adj.get(cur) ?? []) {
        if (!component.has(nb)) { component.set(nb, comp); queue.push(nb); }
      }
    }
    comp++;
  }
  const clusters: string[][] = Array.from({ length: comp }, () => []);
  for (const id of graph.characterIds) clusters[component.get(id)!].push(id);
  return clusters;
}

// ── per-cluster block layout ─────────────────────────────────────────────────

function layoutCluster(
  clusterChars: string[],
  graph: FamilyGraph,
  rank: Map<string, number>,
): { positions: Map<string, { x: number; y: number }>; railLevels: Map<string, number> } {
  const inCluster = new Set(clusterChars);
  const minRank = Math.min(...clusterChars.map(c => rank.get(c) ?? 0));
  const rowY = (r: number) => (r - minRank) * ROW_HEIGHT;

  const clusterUnions = graph.unions.filter(
    u => u.partners.some(p => inCluster.has(p)) || u.children.some(c => inCluster.has(c)),
  );

  // A union is anchored to its blood-line partner (the one with parents in the
  // cluster); if none or several qualify, the first partner in node order.
  const anchorOf = new Map<string, string>();
  const anchoredUnions = new Map<string, Union[]>();
  for (const u of clusterUnions) {
    const partners = u.partners.filter(p => inCluster.has(p));
    if (partners.length === 0) continue;
    const blood = partners.filter(p => (graph.parentUnions.get(p) ?? []).length > 0);
    const anchor = blood.length === 1 ? blood[0] : partners[0];
    anchorOf.set(u.id, anchor);
    push(anchoredUnions, anchor, u);
  }

  // spouse-ins: non-anchor partners with no parents in the cluster — drawn
  // beside the anchor. Partners WITH parents are placed by their own lineage.
  const spouseIns = new Set<string>();
  for (const u of clusterUnions) {
    const anchor = anchorOf.get(u.id);
    for (const p of u.partners) {
      if (p !== anchor && inCluster.has(p) && (graph.parentUnions.get(p) ?? []).length === 0) {
        spouseIns.add(p);
      }
    }
  }

  // The partner strip around an anchor: unions alternate sides (1st right,
  // 2nd left, 3rd right …) so remarriages flank the anchor.
  function stripOf(person: string): { order: string[]; groups: Union[] } {
    const unions = anchoredUnions.get(person) ?? [];
    const right: string[] = []; const left: string[] = [];
    const groupsRight: Union[] = []; const groupsLeft: Union[] = [];
    unions.forEach((u, i) => {
      const spouses = u.partners.filter(p => p !== person && spouseIns.has(p));
      if (i % 2 === 0) { right.push(...spouses); groupsRight.push(u); }
      else { left.unshift(...spouses); groupsLeft.unshift(u); }
    });
    return { order: [...left, person, ...right], groups: [...groupsLeft, ...groupsRight] };
  }

  // A child with several parent-unions is owned (placed) by its first one.
  function ownedChildren(u: Union): string[] {
    return u.children.filter(
      c => inCluster.has(c) && (graph.parentUnions.get(c) ?? [])[0]?.id === u.id,
    );
  }

  const measured = new Map<string, number>();
  const measuring = new Set<string>();

  function measureChildGroup(u: Union): number {
    const kids = ownedChildren(u);
    if (kids.length === 0) return 0;
    let w = 0;
    kids.forEach((k, i) => { w += (i > 0 ? SIBLING_GAP : 0) + measurePerson(k); });
    return w;
  }

  function measurePerson(id: string): number {
    if (measured.has(id)) return measured.get(id)!;
    if (measuring.has(id)) return CARD_W; // defensive: cyclic corrupt data
    measuring.add(id);
    const { order, groups } = stripOf(id);
    const stripW = order.length * CARD_W + (order.length - 1) * PARTNER_GAP;
    let childW = 0; let nonEmpty = 0;
    for (const u of groups) {
      const gw = measureChildGroup(u);
      if (gw > 0) { childW += (nonEmpty > 0 ? GROUP_GAP : 0) + gw; nonEmpty++; }
    }
    const w = Math.max(stripW, childW);
    measuring.delete(id);
    measured.set(id, w);
    return w;
  }

  const positions = new Map<string, { x: number; y: number }>();

  function placeChildGroup(u: Union, xLeft: number): void {
    let x = xLeft;
    for (const k of ownedChildren(u)) {
      const w = measurePerson(k);
      placePerson(k, x);
      x += w + SIBLING_GAP;
    }
  }

  function placePerson(id: string, xLeft: number): number {
    if (positions.has(id)) return measured.get(id) ?? CARD_W;
    const w = measurePerson(id);
    const { order, groups } = stripOf(id);
    const stripW = order.length * CARD_W + (order.length - 1) * PARTNER_GAP;

    // child groups first — center the combined child row within the block
    let childW = 0; let nonEmpty = 0;
    for (const u of groups) {
      const gw = measureChildGroup(u);
      if (gw > 0) { childW += (nonEmpty > 0 ? GROUP_GAP : 0) + gw; nonEmpty++; }
    }
    let cx = xLeft + Math.max(0, (w - childW) / 2);
    for (const u of groups) {
      const gw = measureChildGroup(u);
      if (gw === 0) continue;
      placeChildGroup(u, cx);
      cx += gw + GROUP_GAP;
    }

    // partner strip centered within the block
    let sx = xLeft + (w - stripW) / 2;
    const y = rowY(rank.get(id) ?? 0);
    for (const member of order) {
      if (!positions.has(member)) positions.set(member, { x: sx, y });
      sx += CARD_W + PARTNER_GAP;
    }
    return w;
  }

  // roots: no parents in the cluster and not drawn as someone's spouse
  const roots = clusterChars.filter(
    c => (graph.parentUnions.get(c) ?? []).length === 0 && !spouseIns.has(c),
  );
  let x = 0;
  for (const r of roots) {
    if (positions.has(r)) continue;
    x += placePerson(r, x) + GROUP_GAP;
  }
  // completeness guarantee: exotic structures (e.g. polygamy chains among
  // parentless spouses) fall back to a plain right-appended slot on their row
  for (const c of clusterChars) {
    if (!positions.has(c)) {
      positions.set(c, { x, y: rowY(rank.get(c) ?? 0) });
      x += CARD_W + SIBLING_GAP;
    }
  }

  // Below-row marriage rails: an anchor with 3+ marriages (2-partner unions)
  // can't keep every spouse adjacent on the row, so a straight at-card-height
  // marriage line would have to run behind an intervening card (and all the
  // lines pile up at one height). Drop each such union's point into the gap
  // below the row at its own staggered height instead. Anchors with <=2
  // marriages keep the classic card-mid union point — spouse/anchor/spouse
  // stays adjacent, so those lines are already clean.
  const MAX_MARRIAGE_LEVEL = Math.max(
    0,
    Math.floor(((ROW_HEIGHT - CARD_H) * 0.45 - MARRIAGE_OFFSET) / MARRIAGE_STEP),
  );
  const marriageLevels = new Map<string, number>();
  for (const [, us] of anchoredUnions) {
    const marriages = us.filter(u => u.partners.filter(p => inCluster.has(p)).length >= 2);
    if (marriages.length < 3) continue;
    marriages.forEach((u, i) => marriageLevels.set(u.id, Math.min(i, MAX_MARRIAGE_LEVEL)));
  }

  // unions: midpoint of the two partner card centers. A normal couple sits at
  // marriage-line height (card-mid); a staggered marriage drops below the row;
  // a solo-parent union sits directly under the card (vertical descent).
  // NOTE: RelationshipEdge.tsx keys its PARTNER branch off these exact
  // CARD_H-based anchors — keep them in lockstep.
  for (const u of clusterUnions) {
    const pts = u.partners.filter(p => positions.has(p)).map(p => positions.get(p)!);
    if (pts.length >= 2) {
      const ml = marriageLevels.get(u.id);
      positions.set(u.id, {
        x: (pts[0].x + pts[1].x) / 2 + CARD_W / 2,
        y: ml === undefined
          ? pts[0].y + CARD_H / 2
          : pts[0].y + CARD_H + MARRIAGE_OFFSET + ml * MARRIAGE_STEP,
      });
    } else if (pts.length === 1) {
      positions.set(u.id, { x: pts[0].x + CARD_W / 2, y: pts[0].y + CARD_H });
    } else {
      positions.set(u.id, { x: 0, y: 0 });
    }
  }

  // Staggered rails: only a parent (anchor) with 2+ child-bearing unions needs
  // them; every ordinary couple stays at level 0 (unchanged geometry).
  const MAX_RAIL_LEVEL = Math.floor((ROW_HEIGHT * 0.6 - RAIL_OFFSET) / RAIL_STEP);
  const railLevels = new Map<string, number>();
  for (const [, us] of anchoredUnions) {
    const bearing = us.filter(u => ownedChildren(u).length > 0);
    if (bearing.length < 2) continue;
    bearing.forEach((u, i) => railLevels.set(u.id, Math.min(i, MAX_RAIL_LEVEL)));
  }

  return { positions, railLevels };
}

export function layoutGenealogy(nodes: LayoutNodeIn[], edges: LayoutEdgeIn[]): GenealogyLayout {
  const graph = buildFamilyGraph(nodes, edges);
  const rank = assignGenerations(graph);
  const clusters = findClusters(graph);
  const positions: Record<string, { x: number; y: number }> = {};
  const railLevels: Record<string, number> = {};

  let offsetX = 0;
  for (const cluster of clusters) {
    const { positions: p, railLevels: rl } = layoutCluster(cluster, graph, rank);
    const xs = [...p.values()].map(v => v.x);
    const minX = xs.length ? Math.min(...xs) : 0;
    const maxX = xs.length ? Math.max(...xs) : 0;
    for (const [id, pos] of p) positions[id] = { x: pos.x - minX + offsetX, y: pos.y };
    for (const [id, lvl] of rl) railLevels[id] = lvl;
    offsetX += (maxX - minX) + CARD_W + CLUSTER_GAP;
  }

  // completeness guarantee for anything the cluster pass missed (corrupt data)
  for (const n of nodes) {
    if (!positions[n.id]) {
      positions[n.id] = { x: offsetX, y: 0 };
      offsetX += CARD_W + SIBLING_GAP;
    }
  }

  let maxRow = 0;
  for (const id of graph.characterIds) {
    const r = Math.round(positions[id].y / ROW_HEIGHT);
    if (r > maxRow) maxRow = r;
  }
  const rows: GenerationRow[] = graph.characterIds.length === 0
    ? []
    : Array.from({ length: maxRow + 1 }, (_, i) => ({
        index: i, y: i * ROW_HEIGHT, height: CARD_H,
      }));

  return { positions, rows, railLevels };
}
