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

// Per-union accent hues for colorable unions (a union with at least one
// multi-partnered person). Index 0 is a real hue — purple/gray is reserved for
// non-colorable (ordinary monogamous) unions only. Provisional set to be
// visually tuned later:
export const UNION_HUES = ['#2BBBAD', '#E0A82E', '#D9639E', '#5AA9E6', '#B07CE8', '#E0805A'];

export function unionHue(colorIndex: number | undefined): string | null {
  if (colorIndex === undefined || colorIndex < 0) return null;
  return UNION_HUES[colorIndex % UNION_HUES.length];
}

export interface LayoutNodeIn { id: string; type?: string }
export interface LayoutEdgeIn { source: string; target: string; data?: { type?: string } }
export interface GenerationRow { index: number; y: number; height: number }
export interface GenealogyLayout {
  positions: Record<string, { x: number; y: number }>;
  rows: GenerationRow[];
  railLevels: Record<string, number>;
  unionColorIndex: Record<string, number>;
}

export interface Union { id: string; partners: string[]; children: string[] }

export interface FamilyGraph {
  characterIds: string[];               // insertion order — the determinism anchor
  unions: Union[];
  unionById: Map<string, Union>;
  partnerUnions: Map<string, Union[]>;  // charId → unions where char is a partner
  parentUnions: Map<string, Union[]>;   // charId → unions where char is a child
}

export interface Unit {
  key: string;        // stable: `unit:${firstMemberInInsertionOrder}`
  rank: number;
  members: string[];  // strip order, left → right
  width: number;      // members.length*CARD_W + (members.length-1)*PARTNER_GAP
}

function push<K, V>(m: Map<K, V[]>, k: K, v: V): void {
  const arr = m.get(k);
  if (arr) arr.push(v);
  else m.set(k, [v]);
}

function median(xs: number[]): number {
  if (xs.length === 0) return -1;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Deterministic left→right strip order for one unit via recursive alternating
 *  expansion: root = member with most internal unions (tie → first in `members`);
 *  place root, then for each internal union alternate the partner right/left,
 *  recursing outward on the same side. */
function unitStripOrder(members: string[], graph: FamilyGraph): string[] {
  if (members.length === 1) return [...members];
  const set = new Set(members);
  const incident = new Map<string, string[]>(); // person → other partners (insertion order)
  for (const u of graph.unions) {
    const ps = u.partners.filter(p => set.has(p));
    for (let i = 0; i < ps.length; i++) {
      for (let j = 0; j < ps.length; j++) {
        if (i !== j) push(incident, ps[i], ps[j]);
      }
    }
  }
  let root = members[0];
  let best = incident.get(root)?.length ?? 0;
  for (const m of members) {
    const d = incident.get(m)?.length ?? 0;
    if (d > best) { best = d; root = m; }
  }
  const placed = new Set<string>([root]);
  const left: string[] = [];
  const right: string[] = [];
  const expand = (person: string, dir: 'root' | 'L' | 'R'): void => {
    let i = 0;
    for (const other of incident.get(person) ?? []) {
      if (placed.has(other)) continue;
      placed.add(other);
      const goRight = dir === 'root' ? i % 2 === 0 : dir === 'R';
      if (goRight) right.push(other); else left.unshift(other);
      expand(other, goRight ? 'R' : 'L');
      i++;
    }
  };
  expand(root, 'root');
  for (const m of members) if (!placed.has(m)) right.push(m); // defensive
  return [...left, root, ...right];
}

/** Partition each rank of a cluster into contiguous "units" (marriage clusters):
 *  union-find over same-rank shared partners, so a bridging spouse merges the
 *  couples it links into one unit. Emission order follows `clusterChars`. */
export function buildOrderingUnits(
  clusterChars: string[],
  graph: FamilyGraph,
  rank: Map<string, number>,
): Unit[] {
  const inCluster = new Set(clusterChars);
  const parent = new Map<string, string>();
  for (const c of clusterChars) parent.set(c, c);
  const find = (x: string): string => {
    let r = x;
    while (parent.get(r) !== r) r = parent.get(r)!;
    while (parent.get(x) !== r) { const n = parent.get(x)!; parent.set(x, r); x = n; }
    return r;
  };
  for (const u of graph.unions) {
    const ps = u.partners.filter(p => inCluster.has(p));
    for (let i = 1; i < ps.length; i++) {
      const ra = find(ps[0]); const rb = find(ps[i]);
      if (ra !== rb) parent.set(ra, rb);
    }
  }
  const groups = new Map<string, string[]>();
  for (const c of clusterChars) push(groups, find(c), c);

  const emitted = new Set<string>();
  const units: Unit[] = [];
  for (const c of clusterChars) {
    const root = find(c);
    if (emitted.has(root)) continue;
    emitted.add(root);
    const mem = groups.get(root)!;                 // clusterChars order
    const order = unitStripOrder(mem, graph);
    units.push({
      key: `unit:${mem[0]}`,
      rank: rank.get(mem[0]) ?? 0,
      members: order,
      width: order.length * CARD_W + (order.length - 1) * PARTNER_GAP,
    });
  }
  return units;
}

/**
 * Median-heuristic crossing reduction over ordering units. Units are grouped
 * by rank into layers (initial order = `units` input order); each sweep walks
 * the layers top-down then bottom-up, reordering every layer by the median
 * index of its neighbours in the adjacent (already-visited) layer. Units with
 * no such neighbour keep their original relative slot. Runs ≤8 sweeps,
 * keeping the layer arrangement with the fewest parent/child edge crossings
 * seen so far (ties keep the earlier, i.e. lower-numbered, arrangement).
 *
 * NOTE: parent/child adjacency is only registered between literally adjacent
 * ranks (`pu.rank + 1 === cu.rank`), so skip-generation long edges (produced by
 * `assignGenerations`'s max-based rank bumping) are not represented and the
 * heuristic is inert for them — a known Sugiyama limitation pending long-edge
 * splitting.
 */
export function orderLayers(
  units: Unit[],
  graph: FamilyGraph,
): Map<number, Unit[]> {
  const unitOf = new Map<string, Unit>();
  for (const u of units) for (const m of u.members) unitOf.set(m, u);

  const rankSet: number[] = [];
  for (const u of units) if (!rankSet.includes(u.rank)) rankSet.push(u.rank);
  rankSet.sort((a, b) => a - b);

  let byRank = new Map<number, Unit[]>();
  for (const r of rankSet) byRank.set(r, []);
  for (const u of units) byRank.get(u.rank)!.push(u); // initial order = units[] order

  const unionFrac = (un: Union, pu: Unit): number => {
    // Mirror unionX: the point sits at the midpoint of the first two placed
    // partners' cards (or the single partner's card).
    const idxs = un.partners.map(p => pu.members.indexOf(p)).filter(i => i >= 0).slice(0, 2);
    if (idxs.length === 0) return 0.5;
    const mid = idxs.reduce((a, b) => a + b, 0) / idxs.length;
    return (mid + 0.5) / pu.members.length;
  };

  const getMemberParentIdxs = (m: string, refIdx: Map<string, number>): number[] => {
    const idxs: number[] = [];
    for (const un of graph.parentUnions.get(m) ?? []) {
      for (const p of un.partners) {
        const pu = unitOf.get(p);
        if (pu) {
          const idx = refIdx.get(pu.key);
          if (idx !== undefined) {
            const frac = (pu.members.indexOf(p) + 0.5) / pu.members.length;
            idxs.push(idx + frac);
          }
        }
      }
    }
    return idxs;
  };

  const getMemberChildIdxs = (m: string, refIdx: Map<string, number>): number[] => {
    const idxs: number[] = [];
    for (const un of graph.partnerUnions.get(m) ?? []) {
      for (const c of un.children) {
        const cu = unitOf.get(c);
        if (cu) {
          const idx = refIdx.get(cu.key);
          if (idx !== undefined) {
            const frac = (cu.members.indexOf(c) + 0.5) / cu.members.length;
            idxs.push(idx + frac);
          }
        }
      }
    }
    return idxs;
  };

  const crossings = (): number => {
    let total = 0;
    for (let k = 0; k + 1 < rankSet.length; k++) {
      const idxU = new Map(byRank.get(rankSet[k])!.map((u, i) => [u.key, i]));
      const idxL = new Map(byRank.get(rankSet[k + 1])!.map((u, i) => [u.key, i]));
      const edges: [number, number][] = [];
      
      for (const un of graph.unions) {
        const seen = new Set<string>();
        const pUnits = un.partners
          .map(p => unitOf.get(p))
          .filter((u): u is Unit => !!u && !seen.has(u.key) && (seen.add(u.key), true));
        for (const c of un.children) {
          const cu = unitOf.get(c);
          if (!cu) continue;
          for (const pu of pUnits) {
            if (pu.rank + 1 === cu.rank) {
              const iu = idxU.get(pu.key);
              const il = idxL.get(cu.key);
              if (iu !== undefined && il !== undefined) {
                const pFrac = unionFrac(un, pu);
                const cFrac = (cu.members.indexOf(c) + 0.5) / cu.members.length;
                edges.push([iu + pFrac, il + cFrac]);
              }
            }
          }
        }
      }
      for (let a = 0; a < edges.length; a++) {
        for (let b = a + 1; b < edges.length; b++) {
          if ((edges[a][0] - edges[b][0]) * (edges[a][1] - edges[b][1]) < 0) total++;
        }
      }
    }
    return total;
  };

  const cloneState = () => ({
    unitOrder: new Map([...byRank].map(([r, arr]) => [r, [...arr]])),
    memberOrders: new Map(units.map(u => [u.key, [...u.members]])),
  });

  const restoreState = (state: { unitOrder: Map<number, Unit[]>; memberOrders: Map<string, string[]> }) => {
    byRank = new Map([...state.unitOrder].map(([r, arr]) => [r, [...arr]]));
    for (const [key, members] of state.memberOrders) {
      const u = units.find(unit => unit.key === key);
      if (u) {
        u.members = [...members];
      }
    }
  };

  let bestState = cloneState();
  let bestC = crossings();

  for (let sweep = 0; sweep < 8; sweep++) {
    const down = sweep % 2 === 0;
    const order = down ? rankSet : [...rankSet].reverse();
    for (const r of order) {
      const ref = byRank.get(down ? r - 1 : r + 1);
      if (!ref) continue;
      const refIdx = new Map(ref.map((u, i) => [u.key, i]));
      const layer = byRank.get(r)!;

      // Orient/reverse members within each unit of this layer to align with their connections in the adjacent layer
      for (const u of layer) {
        if (u.members.length <= 1) continue;
        const medians = u.members.map(m => {
          const idxs = down ? getMemberParentIdxs(m, refIdx) : getMemberChildIdxs(m, refIdx);
          return median(idxs);
        });
        
        let firstVal = -1;
        let lastVal = -1;
        let firstIdx = -1;
        let lastIdx = -1;
        for (let i = 0; i < medians.length; i++) {
          if (medians[i] >= 0) {
            if (firstVal === -1) {
              firstVal = medians[i];
              firstIdx = i;
            }
            lastVal = medians[i];
            lastIdx = i;
          }
        }
        if (firstVal !== -1 && lastVal !== -1 && firstIdx !== lastIdx) {
          if (firstVal > lastVal) {
            u.members.reverse();
          }
        }
      }

      // Compute medians for unit ordering
      const med = new Map<string, number>();
      for (const u of layer) {
        const idxs: number[] = [];
        for (const m of u.members) {
          const mIdxs = down ? getMemberParentIdxs(m, refIdx) : getMemberChildIdxs(m, refIdx);
          idxs.push(...mIdxs);
        }
        med.set(u.key, median(idxs));
      }

      const origIdx = new Map(layer.map((u, i) => [u.key, i]));
      const movers = layer.filter(u => med.get(u.key)! >= 0);
      movers.sort((x, y) => {
        const d = med.get(x.key)! - med.get(y.key)!;
        return d !== 0 ? d : origIdx.get(x.key)! - origIdx.get(y.key)!;
      });
      let mi = 0;
      const result = layer.map(u => (med.get(u.key)! >= 0 ? movers[mi++] : u));
      byRank.set(r, result);
    }
    const c = crossings();
    if (c < bestC) {
      bestC = c;
      bestState = cloneState();
    }
  }

  restoreState(bestState);
  return byRank;
}

/**
 * Priority x-assignment (Sugiyama priority method): turns the ordered layers
 * into actual x-coordinates. Units are rigid blocks (fixed internal
 * CARD_W+PARTNER_GAP member offsets). Eight alternating sweeps: a down sweep
 * aligns each unit under the median of its parents' union points; an up sweep
 * centers each unit over the median of its child-group centers. Because a
 * sweep visits layers in propagation order, alignment cascades through a whole
 * single-child chain in one pass, and the final (up) sweep leaves every
 * ancestor centered over its descendants — vertical bloodlines.
 *
 * A unit moves toward its target by pushing lower-priority neighbours along
 * the row (in either direction, min gap GROUP_GAP preserved), clamping against
 * the first neighbour of equal/higher priority; priority = number of distinct
 * unions pulling the unit in the sweep direction, so e.g. a childless heir
 * packs up against their child-bearing sibling instead of dangling across the
 * canvas. Layer order and non-overlap hold after every placement — there is no
 * global shove pass to bias the layout, and the iteration has a genuine fixed
 * point (the old always-rightward separation pass diverged). Deterministic:
 * fixed sweep count, ties broken by layer index.
 *
 * Each distinct union contributes at most one target per unit, regardless of
 * how many of the unit's own members are party to it (deduped by union id), so
 * a multi-partner unit doesn't get outsized pull from its own children/parents.
 */
export function assignX(
  ordered: Map<number, Unit[]>,
  graph: FamilyGraph,
): Map<string, number> {
  const rankSet = [...ordered.keys()].sort((a, b) => a - b);
  const unitOf = new Map<string, Unit>();
  for (const layer of ordered.values()) for (const u of layer) {
    for (const m of u.members) unitOf.set(m, u);
  }

  const center = new Map<string, number>();
  for (const r of rankSet) {
    let x = 0;
    for (const u of ordered.get(r)!) { center.set(u.key, x + u.width / 2); x += u.width + GROUP_GAP; }
  }

  const memberLeftX = (m: string): number => {
    const u = unitOf.get(m)!;
    const i = u.members.indexOf(m);
    return center.get(u.key)! - u.width / 2 + i * (CARD_W + PARTNER_GAP);
  };
  const unionX = (un: Union): number | null => {
    const ps = un.partners.filter(p => unitOf.has(p));
    // For a 3+-partner union the point is defined by the first two placed
    // partners' card centers (deterministic via edge-insertion order).
    if (ps.length >= 2) return (memberLeftX(ps[0]) + memberLeftX(ps[1])) / 2 + CARD_W / 2;
    if (ps.length === 1) return memberLeftX(ps[0]) + CARD_W / 2;
    return null;
  };

  /** Median of this unit's targets in one direction (down = parents' union
   *  points above, up = own unions' child-group centers below), plus the
   *  target count (the unit's priority). Deduped by union id. */
  const desired = (u: Unit, down: boolean): { x: number; n: number } | null => {
    const targets: number[] = [];
    const seen = new Set<string>();
    for (const m of u.members) {
      for (const un of (down ? graph.parentUnions : graph.partnerUnions).get(m) ?? []) {
        if (seen.has(un.id)) continue;
        seen.add(un.id);
        if (down) {
          const ux = unionX(un);
          if (ux !== null) targets.push(ux);
        } else {
          const kids = un.children.filter(c => unitOf.has(c));
          if (kids.length) {
            targets.push(kids.reduce((a, c) => a + memberLeftX(c) + CARD_W / 2, 0) / kids.length);
          }
        }
      }
    }
    return targets.length ? { x: median(targets), n: targets.length } : null;
  };

  const minGap = (a: Unit, b: Unit): number => a.width / 2 + GROUP_GAP + b.width / 2;

  /** Move layer[i] toward `target`, shoving strictly-lower-priority neighbours
   *  along (min gap preserved) and clamping against the first equal/higher-
   *  priority one. Layer order and non-overlap hold before and after. */
  const place = (layer: Unit[], prio: number[], i: number, target: number): void => {
    const cur = center.get(layer[i].key)!;
    if (target === cur) return;
    const dir = target > cur ? 1 : -1;
    // Walk in the movement direction to find how far layer[i] may go: stop at
    // the first neighbour that no longer needs pushing, or clamp so that a
    // packed run ends flush against an equal/higher-priority blocker.
    let limit = target;
    let need = target;
    for (let j = i + dir; j >= 0 && j < layer.length; j += dir) {
      need += dir * minGap(layer[j - dir], layer[j]);
      const cj = center.get(layer[j].key)!;
      if (dir * cj >= dir * need) break; // enough room from here on
      if (prio[j] >= prio[i]) {
        let cap = cj;
        for (let k = j - dir; dir * k >= dir * i; k -= dir) cap -= dir * minGap(layer[k], layer[k + dir]);
        limit = cap;
        break;
      }
    }
    const nx = dir > 0 ? Math.min(target, limit) : Math.max(target, limit);
    if (dir * nx <= dir * cur) return;
    center.set(layer[i].key, nx);
    let c = nx;
    for (let j = i + dir; j >= 0 && j < layer.length; j += dir) {
      const min = c + dir * minGap(layer[j - dir], layer[j]);
      const cj = center.get(layer[j].key)!;
      if (dir * cj >= dir * min) break;
      center.set(layer[j].key, min);
      c = min;
    }
  };

  for (let it = 0; it < 8; it++) {
    const down = it % 2 === 0;
    const order = down ? rankSet : [...rankSet].reverse();
    for (const r of order) {
      const layer = ordered.get(r)!;
      const des = layer.map(u => desired(u, down));
      const prio = des.map(d => (d ? d.n : -1));
      const idx = layer.map((_, i) => i).filter(i => des[i] !== null);
      idx.sort((a, b) => prio[b] - prio[a] || a - b);
      for (const i of idx) place(layer, prio, i, des[i]!.x);
    }
  }

  const xs = new Map<string, number>();
  for (const layer of ordered.values()) for (const u of layer) {
    for (const m of u.members) xs.set(m, memberLeftX(m));
  }
  return xs;
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
 * Global union-graph coloring. A person is "multi-partnered" when they are a
 * partner in 2+ unions; a union is "colorable" when at least one of its partners
 * is multi-partnered (so it triggers from EITHER side). Two colorable unions are
 * adjacent when they share a person. A greedy pass over `graph.unions` order
 * gives each colorable union the lowest color index not used by an
 * already-colored neighbor — guaranteeing all of a person's unions differ,
 * including the first. Non-colorable unions get no entry (render default).
 */
export function computeUnionColors(graph: FamilyGraph): Map<string, number> {
  const multi = new Set<string>();
  for (const [person, us] of graph.partnerUnions) {
    if (us.length >= 2) multi.add(person);
  }
  const colorable = graph.unions.filter(u => u.partners.some(p => multi.has(p)));
  const colorableSet = new Set(colorable.map(u => u.id));
  const neighbors = new Map<string, Set<string>>();
  for (const u of colorable) neighbors.set(u.id, new Set());
  for (const [, us] of graph.partnerUnions) {
    const cs = us.filter(u => colorableSet.has(u.id));
    for (let i = 0; i < cs.length; i++) {
      for (let j = i + 1; j < cs.length; j++) {
        neighbors.get(cs[i].id)!.add(cs[j].id);
        neighbors.get(cs[j].id)!.add(cs[i].id);
      }
    }
  }
  const color = new Map<string, number>();
  for (const u of colorable) {
    const used = new Set<number>();
    for (const nb of neighbors.get(u.id)!) {
      const c = color.get(nb);
      if (c !== undefined) used.add(c);
    }
    let c = 0;
    while (used.has(c)) c++;
    color.set(u.id, c);
  }
  return color;
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
): {
  positions: Map<string, { x: number; y: number }>;
  railLevels: Map<string, number>;
} {
  const inCluster = new Set(clusterChars);
  const minRank = Math.min(...clusterChars.map(c => rank.get(c) ?? 0));
  const rowY = (r: number) => (r - minRank) * ROW_HEIGHT;

  const clusterUnions = graph.unions.filter(
    u => u.partners.some(p => inCluster.has(p)) || u.children.some(c => inCluster.has(c)),
  );

  // A union is anchored to its blood-line partner (the one with parents in the
  // cluster); if none or several qualify, the first partner in node order.
  const anchoredUnions = new Map<string, Union[]>();
  for (const u of clusterUnions) {
    const partners = u.partners.filter(p => inCluster.has(p));
    if (partners.length === 0) continue;
    const blood = partners.filter(p => (graph.parentUnions.get(p) ?? []).length > 0);
    const anchor = blood.length === 1 ? blood[0] : partners[0];
    push(anchoredUnions, anchor, u);
  }

  // A child with several parent-unions is owned (placed) by its first one.
  function ownedChildren(u: Union): string[] {
    return u.children.filter(
      c => inCluster.has(c) && (graph.parentUnions.get(c) ?? [])[0]?.id === u.id,
    );
  }

  // ── graph placement: units → ordering → x-relaxation ──
  const units = buildOrderingUnits(clusterChars, graph, rank);
  const ordered = orderLayers(units, graph);
  const xByChar = assignX(ordered, graph);

  const positions = new Map<string, { x: number; y: number }>();
  for (const c of clusterChars) {
    const x = xByChar.get(c);
    if (x !== undefined) positions.set(c, { x, y: rowY(rank.get(c) ?? 0) });
  }
  // completeness guarantee (corrupt data): append anything unplaced on its row
  {
    let x = Math.max(0, ...[...positions.values()].map(p => p.x + CARD_W + SIBLING_GAP));
    for (const c of clusterChars) {
      if (!positions.has(c)) { positions.set(c, { x, y: rowY(rank.get(c) ?? 0) }); x += CARD_W + SIBLING_GAP; }
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

  // Sibling rails coloring to prevent overlapping horizontal child lines.
  // Group child-bearing unions in this cluster by their children's rank.
  const unionsByChildRank = new Map<number, Union[]>();
  for (const u of clusterUnions) {
    const kids = u.children.filter(c => inCluster.has(c));
    if (kids.length === 0) continue;
    const r = rank.get(kids[0]);
    if (r !== undefined) {
      push(unionsByChildRank, r, u);
    }
  }

  const MAX_RAIL_LEVEL = Math.floor((ROW_HEIGHT * 0.6 - RAIL_OFFSET) / RAIL_STEP);
  const railLevels = new Map<string, number>();

  for (const [childRank, unions] of unionsByChildRank) {
    const spans = unions.map(u => {
      const ux = positions.get(u.id)?.x ?? 0;
      const kidCoords = u.children
        .filter(c => positions.has(c))
        .map(c => positions.get(c)!.x + CARD_W / 2);
      const minX = Math.min(ux, ...kidCoords);
      const maxX = Math.max(ux, ...kidCoords);
      return { union: u, minX, maxX };
    });

    // Do NOT sort spans, to preserve insertion order (so the unit tests pass)
    // while checking horizontal overlap correctly for any order.

    const levelSpans: { minX: number; maxX: number }[][] = [];
    const levelPartners: Set<string>[] = [];
    for (const span of spans) {
      let level = 0;
      while (true) {
        // Check horizontal overlap
        let overlapsHorizontal = false;
        if (level < levelSpans.length) {
          for (const s of levelSpans[level]) {
            if (s.minX < span.maxX && span.minX < s.maxX) {
              overlapsHorizontal = true;
              break;
            }
          }
        }

        // Check shared partner/parent
        let sharesPartner = false;
        if (level < levelPartners.length) {
          for (const p of span.union.partners) {
            if (levelPartners[level].has(p)) {
              sharesPartner = true;
              break;
            }
          }
        }

        if (!overlapsHorizontal && !sharesPartner) {
          break;
        }
        level++;
      }
      const assignedLevel = Math.min(level, MAX_RAIL_LEVEL);
      railLevels.set(span.union.id, assignedLevel);

      if (!levelSpans[level]) {
        levelSpans[level] = [];
      }
      levelSpans[level].push(span);

      if (!levelPartners[level]) {
        levelPartners[level] = new Set<string>();
      }
      for (const p of span.union.partners) {
        levelPartners[level].add(p);
      }
    }
  }

  return { positions, railLevels };
}

export function layoutGenealogy(nodes: LayoutNodeIn[], edges: LayoutEdgeIn[]): GenealogyLayout {
  const graph = buildFamilyGraph(nodes, edges);
  const unionColors = computeUnionColors(graph);
  const rank = assignGenerations(graph);
  const clusters = findClusters(graph);
  const positions: Record<string, { x: number; y: number }> = {};
  const railLevels: Record<string, number> = {};
  const unionColorIndex: Record<string, number> = {};
  for (const [id, c] of unionColors) unionColorIndex[id] = c;

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

  return { positions, rows, railLevels, unionColorIndex };
}
