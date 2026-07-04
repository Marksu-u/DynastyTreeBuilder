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

export interface LayoutNodeIn { id: string; type?: string }
export interface LayoutEdgeIn { source: string; target: string; data?: { type?: string } }
export interface GenerationRow { index: number; y: number; height: number }
export interface GenealogyLayout {
  positions: Record<string, { x: number; y: number }>;
  rows: GenerationRow[];
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

export function layoutGenealogy(nodes: LayoutNodeIn[], edges: LayoutEdgeIn[]): GenealogyLayout {
  void nodes; void edges;
  return { positions: {}, rows: [] };
}
