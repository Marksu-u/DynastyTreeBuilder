import { describe, it, expect } from 'vitest';
import {
  buildFamilyGraph, assignGenerations, layoutGenealogy,
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
});
