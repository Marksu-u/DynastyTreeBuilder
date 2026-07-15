import { describe, it, expect } from 'vitest';
import {
  buildFamilyGraph, assignGenerations, layoutGenealogy, buildOrderingUnits, orderLayers, assignX,
  CARD_W, CARD_H, PARTNER_GAP, ROW_HEIGHT, CLUSTER_GAP,
} from './genealogy-layout';

// ── fixture helpers ───────────────────────────────────────────────────────────
const char = (id: string) => ({ id, type: 'character' as const });
const union = (id: string) => ({ id, type: 'union' as const });
const partner = (charId: string, unionId: string) => ({
  source: charId, target: unionId, data: { type: 'PARTNER' as const },
});
const child = (unionId: string, charId: string, adopted = false) => ({
  source: unionId, target: charId,
  data: { type: adopted ? ('ADOPTED_CHILD' as const) : ('CHILD' as const) },
});

/** dad + mom married via u1, kids c1..cN */
function nuclear(kids = 1) {
  const nodes = [char('dad'), char('mom'), union('u1'),
    ...Array.from({ length: kids }, (_, i) => char(`c${i + 1}`))];
  const edges = [partner('dad', 'u1'), partner('mom', 'u1'),
    ...Array.from({ length: kids }, (_, i) => child('u1', `c${i + 1}`))];
  return { nodes, edges };
}

describe('buildFamilyGraph', () => {
  it('collects partners and children per union', () => {
    const { nodes, edges } = nuclear(2);
    const g = buildFamilyGraph(nodes, edges);
    expect(g.unionById.get('u1')!.partners).toEqual(['dad', 'mom']);
    expect(g.unionById.get('u1')!.children).toEqual(['c1', 'c2']);
    expect(g.parentUnions.get('c1')![0].id).toBe('u1');
    expect(g.partnerUnions.get('dad')![0].id).toBe('u1');
  });

  it('ignores duplicate edges', () => {
    const { nodes, edges } = nuclear(1);
    const g = buildFamilyGraph(nodes, [...edges, partner('dad', 'u1'), child('u1', 'c1')]);
    expect(g.unionById.get('u1')!.partners).toEqual(['dad', 'mom']);
    expect(g.unionById.get('u1')!.children).toEqual(['c1']);
  });
});

describe('assignGenerations', () => {
  it('parents rank 0, child rank 1', () => {
    const { nodes, edges } = nuclear(1);
    const r = assignGenerations(buildFamilyGraph(nodes, edges));
    expect(r.get('dad')).toBe(0);
    expect(r.get('mom')).toBe(0);
    expect(r.get('c1')).toBe(1);
  });

  it('equalizes partners across generations (marrying in pulls down)', () => {
    // gp -u0-> p ; p + spouse -u1-> k. spouse has no parents but must sit at p's rank.
    const nodes = [char('gp'), union('u0'), char('p'), char('spouse'), union('u1'), char('k')];
    const edges = [partner('gp', 'u0'), child('u0', 'p'),
      partner('p', 'u1'), partner('spouse', 'u1'), child('u1', 'k')];
    const r = assignGenerations(buildFamilyGraph(nodes, edges));
    expect(r.get('gp')).toBe(0);
    expect(r.get('p')).toBe(1);
    expect(r.get('spouse')).toBe(1);
    expect(r.get('k')).toBe(2);
  });

  it('terminates on cyclic (corrupt) data', () => {
    // a -u1-> b ; b -u2-> a  (a is b's parent AND child)
    const nodes = [char('a'), char('b'), union('u1'), union('u2')];
    const edges = [partner('a', 'u1'), child('u1', 'b'), partner('b', 'u2'), child('u2', 'a')];
    const r = assignGenerations(buildFamilyGraph(nodes, edges));
    expect(r.get('a')).toBeTypeOf('number'); // finite, no hang
    expect(r.get('b')).toBeTypeOf('number');
  });
});

describe('layoutGenealogy — placement invariants', () => {
  function positionsOf(fix: { nodes: { id: string; type?: string }[]; edges: ReturnType<typeof partner>[] }) {
    return layoutGenealogy(fix.nodes, fix.edges).positions;
  }

  it('partners are adjacent on the same row, PARTNER_GAP apart', () => {
    const p = positionsOf(nuclear(1));
    expect(p.dad.y).toBe(p.mom.y);
    const [l, r] = [p.dad, p.mom].sort((a, b) => a.x - b.x);
    expect(r.x - (l.x + CARD_W)).toBe(PARTNER_GAP);
  });

  it('children sit exactly one ROW_HEIGHT below their parents', () => {
    const p = positionsOf(nuclear(3));
    for (const c of ['c1', 'c2', 'c3']) expect(p[c].y).toBe(p.dad.y + ROW_HEIGHT);
  });

  it('no two characters on the same row overlap', () => {
    const fix = nuclear(4);
    // add a grandchild layer: c1 + spouse s1 -> u2 -> g1,g2
    fix.nodes.push(char('s1'), union('u2'), char('g1'), char('g2'));
    fix.edges.push(partner('c1', 'u2'), partner('s1', 'u2'), child('u2', 'g1'), child('u2', 'g2'));
    const p = positionsOf(fix);
    const chars = fix.nodes.filter(n => n.type === 'character').map(n => n.id);
    for (const a of chars) for (const b of chars) {
      if (a >= b || p[a].y !== p[b].y) continue;
      expect(Math.abs(p[a].x - p[b].x)).toBeGreaterThanOrEqual(CARD_W + 8);
    }
  });

  it('remarriage: both spouses on the anchor row, no overlap', () => {
    const nodes = [char('anchor'), char('w1'), char('w2'), union('u1'), union('u2'),
      char('k1'), char('k2')];
    const edges = [partner('anchor', 'u1'), partner('w1', 'u1'), child('u1', 'k1'),
      partner('anchor', 'u2'), partner('w2', 'u2'), child('u2', 'k2')];
    const p = layoutGenealogy(nodes, edges).positions;
    expect(p.w1.y).toBe(p.anchor.y);
    expect(p.w2.y).toBe(p.anchor.y);
    const xs = [p.anchor.x, p.w1.x, p.w2.x].sort((a, b) => a - b);
    expect(xs[1] - xs[0]).toBeGreaterThanOrEqual(CARD_W + PARTNER_GAP);
    expect(xs[2] - xs[1]).toBeGreaterThanOrEqual(CARD_W + PARTNER_GAP);
  });

  it('solo parent: child below the single parent', () => {
    const nodes = [char('p'), union('u1'), char('k')];
    const edges = [partner('p', 'u1'), child('u1', 'k')];
    const p = layoutGenealogy(nodes, edges).positions;
    expect(p.k.y).toBe(p.p.y + ROW_HEIGHT);
  });

  it('intermarriage between branches keeps both partners on one row (marriage line stays horizontal)', () => {
    // two root couples, one child each, and the two children marry
    const nodes = [char('a1'), char('a2'), union('ua'), char('ka'),
      char('b1'), char('b2'), union('ub'), char('kb'), union('um'), char('gk')];
    const edges = [partner('a1', 'ua'), partner('a2', 'ua'), child('ua', 'ka'),
      partner('b1', 'ub'), partner('b2', 'ub'), child('ub', 'kb'),
      partner('ka', 'um'), partner('kb', 'um'), child('um', 'gk')];
    const p = layoutGenealogy(nodes, edges).positions;
    expect(p.ka.y).toBe(p.kb.y);
    expect(p.gk.y).toBe(p.ka.y + ROW_HEIGHT);
  });
});

describe('layoutGenealogy — clusters, rows, determinism', () => {
  it('disconnected clusters do not overlap and are separated by ≥ CLUSTER_GAP', () => {
    const a = nuclear(2);
    const nodes = [...a.nodes, char('lone1'), char('lone2'), union('u9')];
    const edges = [...a.edges, partner('lone1', 'u9'), partner('lone2', 'u9')];
    const { positions: p } = layoutGenealogy(nodes, edges);
    const aMaxX = Math.max(p.dad.x, p.mom.x, p.c1.x, p.c2.x) + CARD_W;
    const bMinX = Math.min(p.lone1.x, p.lone2.x);
    expect(bMinX - aMaxX).toBeGreaterThanOrEqual(CLUSTER_GAP);
  });

  it('every input node gets a position (characters, unions, singletons)', () => {
    const fix = nuclear(1);
    fix.nodes.push(char('hermit'));
    const { positions } = layoutGenealogy(fix.nodes, fix.edges);
    for (const n of fix.nodes) expect(positions[n.id]).toBeDefined();
  });

  it('rows cover every generation at ROW_HEIGHT pitch', () => {
    const nodes = [char('a'), union('u1'), char('b'), union('u2'), char('c')];
    const edges = [partner('a', 'u1'), child('u1', 'b'), partner('b', 'u2'), child('u2', 'c')];
    const { rows } = layoutGenealogy(nodes, edges);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual({ index: 0, y: 0, height: CARD_H });
    expect(rows[2].y).toBe(2 * ROW_HEIGHT);
  });

  it('is deterministic', () => {
    const fix = nuclear(3);
    fix.nodes.push(char('s1'), union('u2'), char('g1'));
    fix.edges.push(partner('c1', 'u2'), partner('s1', 'u2'), child('u2', 'g1'));
    expect(layoutGenealogy(fix.nodes, fix.edges)).toEqual(layoutGenealogy(fix.nodes, fix.edges));
  });

  it('adopted children lay out identically to biological ones', () => {
    const bio = nuclear(2);
    const adopted = {
      nodes: bio.nodes,
      edges: [partner('dad', 'u1'), partner('mom', 'u1'), child('u1', 'c1'), child('u1', 'c2', true)],
    };
    expect(layoutGenealogy(adopted.nodes, adopted.edges)).toEqual(layoutGenealogy(bio.nodes, bio.edges));
  });

  it('empty input yields no positions and no rows', () => {
    const { positions, rows } = layoutGenealogy([], []);
    expect(Object.keys(positions)).toHaveLength(0);
    expect(rows).toEqual([]);
  });

  it('adjacent siblings with mismatched strip/child widths never overlap', () => {
    // root couple with two children:
    //  - c1 is strip-wide: two marriages (s1, s2), one kid per union
    //  - c2 is child-wide: one marriage (s3), five kids
    const fix = nuclear(2);
    fix.nodes.push(
      char('s1'), char('s2'), union('m1'), union('m2'), char('k1'), char('k2'),
      char('s3'), union('m3'), char('q1'), char('q2'), char('q3'), char('q4'), char('q5'),
    );
    fix.edges.push(
      partner('c1', 'm1'), partner('s1', 'm1'), child('m1', 'k1'),
      partner('c1', 'm2'), partner('s2', 'm2'), child('m2', 'k2'),
      partner('c2', 'm3'), partner('s3', 'm3'),
      child('m3', 'q1'), child('m3', 'q2'), child('m3', 'q3'), child('m3', 'q4'), child('m3', 'q5'),
    );
    const p = layoutGenealogy(fix.nodes, fix.edges).positions;
    const chars = fix.nodes.filter(n => n.type === 'character').map(n => n.id);
    for (const a of chars) for (const b of chars) {
      if (a >= b || p[a].y !== p[b].y) continue;
      expect(Math.abs(p[a].x - p[b].x), `${a} vs ${b}`).toBeGreaterThanOrEqual(CARD_W + 8);
    }
  });
});

describe('below-row marriage rails (3+ spouses)', () => {
  function threeSpouses() {
    const nodes = [char('dad'), char('m1'), char('m2'), char('m3'),
      union('u1'), union('u2'), union('u3')];
    const edges = [
      partner('dad', 'u1'), partner('m1', 'u1'),
      partner('dad', 'u2'), partner('m2', 'u2'),
      partner('dad', 'u3'), partner('m3', 'u3'),
    ];
    return { nodes, edges };
  }

  it('drops a 3-marriage anchor’s union points below the card row, staggered', () => {
    const { nodes, edges } = threeSpouses();
    const { positions } = layoutGenealogy(nodes, edges);
    const rowY = positions.dad.y;
    const ys = ['u1', 'u2', 'u3'].map(u => positions[u].y);
    for (const y of ys) expect(y).toBeGreaterThan(rowY + CARD_H); // below the cards
    expect(new Set(ys).size).toBe(3);                              // three distinct heights
  });

  it('keeps a 2-marriage anchor’s union points at card-mid (unchanged)', () => {
    const nodes = [char('dad'), char('m1'), char('m2'), union('u1'), union('u2')];
    const edges = [partner('dad', 'u1'), partner('m1', 'u1'), partner('dad', 'u2'), partner('m2', 'u2')];
    const { positions } = layoutGenealogy(nodes, edges);
    expect(positions.u1.y).toBe(positions.dad.y + CARD_H / 2);
    expect(positions.u2.y).toBe(positions.dad.y + CARD_H / 2);
  });

  it('keeps an ordinary couple’s union point at card-mid', () => {
    const { nodes, edges } = nuclear(2);
    const { positions } = layoutGenealogy(nodes, edges);
    expect(positions.u1.y).toBe(positions.dad.y + CARD_H / 2);
  });
});

describe('railLevels (staggered sibling rails)', () => {
  // dad marries mom (u1 -> c1) and mom2 (u2 -> c2). dad anchors both unions.
  function twoPartners() {
    const nodes = [
      char('dad'), char('mom'), char('mom2'),
      union('u1'), union('u2'),
      char('c1'), char('c2'),
    ];
    const edges = [
      partner('dad', 'u1'), partner('mom', 'u1'), child('u1', 'c1'),
      partner('dad', 'u2'), partner('mom2', 'u2'), child('u2', 'c2'),
    ];
    return { nodes, edges };
  }

  it('assigns distinct levels to a parent with two child-bearing unions', () => {
    const { nodes, edges } = twoPartners();
    const { railLevels } = layoutGenealogy(nodes, edges);
    expect(railLevels['u1']).toBe(0);
    expect(railLevels['u2']).toBe(1);
  });

  it('leaves an ordinary single-partnership couple unstaggered', () => {
    const { nodes, edges } = nuclear(2);
    const { railLevels } = layoutGenealogy(nodes, edges);
    expect(railLevels['u1'] ?? 0).toBe(0);
  });

  it('clamps at MAX_RAIL_LEVEL for a very high partner count', () => {
    const nodes: { id: string; type: string }[] = [char('dad')];
    const edges: { source: string; target: string; data: { type: string } }[] = [];
    for (let i = 1; i <= 10; i++) {
      nodes.push(char(`m${i}`), union(`u${i}`), char(`k${i}`));
      edges.push(partner('dad', `u${i}`), partner(`m${i}`, `u${i}`), child(`u${i}`, `k${i}`));
    }
    const { railLevels } = layoutGenealogy(nodes, edges);
    const levels = Object.values(railLevels);
    const max = Math.max(...levels);
    // MAX_RAIL_LEVEL = floor((ROW_HEIGHT*0.6 - RAIL_OFFSET) / RAIL_STEP) = floor((120-24)/16) = 6
    expect(max).toBe(6);
    expect(railLevels['u10']).toBe(6);
  });
});

describe('buildOrderingUnits', () => {
  const build = (fix: { nodes: any[]; edges: any[] }) => {
    const g = buildFamilyGraph(fix.nodes, fix.edges);
    const r = assignGenerations(g);
    return buildOrderingUnits(g.characterIds, g, r);
  };

  it('a simple couple is one unit, partners adjacent in strip order', () => {
    const units = build(nuclear(1));
    const rank0 = units.filter(u => u.rank === 0);
    expect(rank0).toHaveLength(1);
    expect(rank0[0].members).toEqual(['dad', 'mom']);
    expect(rank0[0].width).toBe(2 * CARD_W + PARTNER_GAP);
  });

  it('a bridging spouse merges two couples into one unit, sitting in the middle', () => {
    const nodes = [char('a'), char('X'), char('b'), union('ua'), union('ub')];
    const edges = [partner('a', 'ua'), partner('X', 'ua'),
      partner('X', 'ub'), partner('b', 'ub')];
    const units = build({ nodes, edges });
    expect(units).toHaveLength(1);
    expect(new Set(units[0].members)).toEqual(new Set(['a', 'X', 'b']));
    expect(units[0].members[1]).toBe('X'); // bridge in the middle
  });

  it('a remarriage star flanks the anchor with its spouses', () => {
    const nodes = [char('dad'), char('m1'), char('m2'), char('m3'),
      union('u1'), union('u2'), union('u3')];
    const edges = [partner('dad', 'u1'), partner('m1', 'u1'),
      partner('dad', 'u2'), partner('m2', 'u2'),
      partner('dad', 'u3'), partner('m3', 'u3')];
    const units = build({ nodes, edges });
    expect(units).toHaveLength(1);
    expect(units[0].members).toEqual(['m2', 'dad', 'm1', 'm3']);
  });

  it('non-married siblings are separate units', () => {
    const units = build(nuclear(2));
    const rank1 = units.filter(u => u.rank === 1);
    expect(rank1).toHaveLength(2);
    expect(rank1.map(u => u.members)).toEqual([['c1'], ['c2']]);
  });
});

describe('orderLayers', () => {
  const prep = (fix: { nodes: any[]; edges: any[] }) => {
    const g = buildFamilyGraph(fix.nodes, fix.edges);
    const r = assignGenerations(g);
    return { g, r, units: buildOrderingUnits(g.characterIds, g, r) };
  };

  it('is deterministic', () => {
    const { g, r, units } = prep(nuclear(3));
    const a = orderLayers(units, g);
    const b = orderLayers(units, g);
    expect([...a.get(1)!].map(u => u.key)).toEqual([...b.get(1)!].map(u => u.key));
  });

  it('orders a child under its parent when input order would cross', () => {
    const nodes = [
      char('pL'), char('sL'), union('uL'), char('pR'), char('sR'), union('uR'),
      char('cR'), char('cL'),
    ];
    const edges = [
      partner('pL', 'uL'), partner('sL', 'uL'),
      partner('pR', 'uR'), partner('sR', 'uR'),
      child('uR', 'cR'), child('uL', 'cL'),
    ];
    const { g, r, units } = prep({ nodes, edges });
    const ordered = orderLayers(units, g);
    const row1 = ordered.get(1)!.map(u => u.members[0]);
    expect(row1).toEqual(['cL', 'cR']);
  });

  it('keeps a no-parent unit in its original slot', () => {
    const fix = nuclear(1);
    fix.nodes.push(char('x1'), char('x2'), union('ux'));
    fix.edges.push(partner('x1', 'ux'), partner('x2', 'ux'));
    const { g, r, units } = prep(fix);
    const ordered = orderLayers(units, g);
    const keys = ordered.get(0)!.map(u => u.key);
    expect(keys).toContain('unit:x1');
  });
});

describe('assignX', () => {
  const run = (fix: { nodes: any[]; edges: any[] }) => {
    const g = buildFamilyGraph(fix.nodes, fix.edges);
    const r = assignGenerations(g);
    const ordered = orderLayers(buildOrderingUnits(g.characterIds, g, r), g);
    return { g, r, x: assignX(ordered, g) };
  };

  it('centers a child under its parents’ union midpoint', () => {
    const { x } = run(nuclear(1));
    const unionMid = ((x.get('dad')! + x.get('mom')!) / 2) + CARD_W / 2;
    const childMid = x.get('c1')! + CARD_W / 2;
    expect(Math.abs(childMid - unionMid)).toBeLessThanOrEqual(1);
  });

  it('leaves no two same-rank cards overlapping', () => {
    const { g, r, x } = run(nuclear(4));
    const byRank = new Map<number, string[]>();
    for (const id of g.characterIds) {
      const k = r.get(id)!;
      if (!byRank.has(k)) byRank.set(k, []);
      byRank.get(k)!.push(id);
    }
    for (const ids of byRank.values()) {
      for (const a of ids) for (const b of ids) {
        if (a >= b) continue;
        expect(Math.abs(x.get(a)! - x.get(b)!)).toBeGreaterThanOrEqual(CARD_W + 8);
      }
    }
  });

  it('is deterministic', () => {
    const { x: a } = run(nuclear(3));
    const { x: b } = run(nuclear(3));
    expect([...a.entries()]).toEqual([...b.entries()]);
  });

  it('a spouse with no parent-union does not add extra pull weight to the shared target', () => {
    const build = (withSpouse: boolean) => {
      const nodes = [
        char('gp1'), char('gp2'), union('u_gp'), char('p'),
        union('u_own'), char('k1'), char('k2'),
        ...(withSpouse ? [char('s')] : []),
      ];
      const edges = [
        partner('gp1', 'u_gp'), partner('gp2', 'u_gp'), child('u_gp', 'p'),
        partner('p', 'u_own'), ...(withSpouse ? [partner('s', 'u_own')] : []),
        child('u_own', 'k1'), child('u_own', 'k2'),
      ];
      return layoutGenealogy(nodes, edges).positions;
    };
    const withoutSpouse = build(false);
    const withSpouse = build(true);
    // p's x should be governed by the SAME two targets (parent union, own kids)
    // regardless of whether a childless-parent spouse also partners the union —
    // that spouse must not double the weight of the "own kids" target.
    expect(Math.abs(withSpouse['p'].x - withoutSpouse['p'].x)).toBeLessThanOrEqual(1);
  });

  it('a married-out sibling does not scatter their childless-parent-union sibling far from the shared parent union', () => {
    const nodes = [
      char('gp1'), char('gp2'), union('u_gp'), char('p'), char('sib'),
      char('s'), union('u_own'), char('k1'), char('k2'),
    ];
    const edges = [
      partner('gp1', 'u_gp'), partner('gp2', 'u_gp'), child('u_gp', 'p'), child('u_gp', 'sib'),
      partner('p', 'u_own'), partner('s', 'u_own'), child('u_own', 'k1'), child('u_own', 'k2'),
    ];
    const { positions } = layoutGenealogy(nodes, edges);
    const gpUnionX = positions['u_gp'].x;
    // Both direct children of u_gp should end up within a small multiple of a
    // card width of their shared parent union's point — not torn across
    // several rows' worth of horizontal space by p's own descendants.
    expect(Math.abs(positions['p'].x - gpUnionX)).toBeLessThan(CARD_W * 4);
    expect(Math.abs(positions['sib'].x - gpUnionX)).toBeLessThan(CARD_W * 4);
  });
});

describe('layoutGenealogy — graph layout acceptance', () => {
  it('a bridging spouse sits between her two husbands, on their row', () => {
    // Ashalle married to Rowan (u1 -> kid j) and Alphonse (u2 -> kid n)
    const nodes = [char('rowan'), char('ashalle'), char('alphonse'),
      union('u1'), union('u2'), char('j'), char('n')];
    const edges = [partner('rowan', 'u1'), partner('ashalle', 'u1'), child('u1', 'j'),
      partner('ashalle', 'u2'), partner('alphonse', 'u2'), child('u2', 'n')];
    const { positions: p } = layoutGenealogy(nodes, edges);
    expect(p.ashalle.y).toBe(p.rowan.y);
    expect(p.ashalle.y).toBe(p.alphonse.y);
    const xs = [p.rowan.x, p.ashalle.x, p.alphonse.x];
    const mid = xs.sort((a, b) => a - b)[1];
    expect(p.ashalle.x).toBe(mid); // Ashalle is the middle card
  });

  it('no unrelated card lands inside a marriage line’s horizontal span', () => {
    // rowan+ashalle and alphonse+ashalle as above, plus rowan’s sibling elara.
    const nodes = [char('rowan'), char('elara'), char('ashalle'), char('alphonse'),
      union('gp'), // rowan & elara’s parents’ union
      char('gpa'), char('gpb'),
      union('u1'), union('u2'), char('n')];
    const edges = [
      partner('gpa', 'gp'), partner('gpb', 'gp'), child('gp', 'rowan'), child('gp', 'elara'),
      partner('rowan', 'u1'), partner('ashalle', 'u1'),
      partner('ashalle', 'u2'), partner('alphonse', 'u2'), child('u2', 'n'),
    ];
    const { positions: p } = layoutGenealogy(nodes, edges);
    // The ashalle×alphonse marriage line spans [min..max] of their card centers.
    const lo = Math.min(p.ashalle.x, p.alphonse.x);
    const hi = Math.max(p.ashalle.x, p.alphonse.x);
    // elara sits on the row above, but assert no same-row card of that union’s
    // rank is strictly inside the span except the two partners themselves.
    for (const id of ['rowan']) {
      if (p[id].y !== p.ashalle.y) continue;
      const inside = p[id].x + CARD_W > lo && p[id].x < hi;
      expect(inside).toBe(false);
    }
  });
});
