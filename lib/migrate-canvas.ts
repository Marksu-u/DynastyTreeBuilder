// lib/migrate-canvas.ts
// One definition, shared: this file's own `AnyNode` used to be a fourth copy of
// the same union.
import type {
  AnyCanvasNode as AnyNode,
  RelationshipEdgeType as AnyEdge,
  IncomingEdge,
  RelationshipData,
} from '@/types/canvas';

const pairKey = (a: string, b: string) => [a, b].sort().join('::');

/**
 * Legacy DB pair edges (SPOUSE/PARENT/ADOPTED) → the union-node client model.
 * Idempotent: a graph that already has union nodes is returned untouched.
 */
export function migrateCanvas(
  nodes: AnyNode[],
  edges: IncomingEdge[],
): { nodes: AnyNode[]; edges: AnyEdge[] } {
  // A graph carrying union nodes is already in the client model, so its edges
  // are already client edges. This is the one place that assumption lives — it
  // used to be spread across every call site as `as never`.
  if (nodes.some(n => n.type === 'union')) return { nodes, edges: edges as AnyEdge[] };

  const newNodes: AnyNode[] = [...nodes];
  const newEdges: AnyEdge[] = [];
  const nodeById = new Map(nodes.map(n => [n.id, n]));

  // ── Step 1: SPOUSE edges → union nodes + PARTNER edges ──────────────────────
  // Dedup by unordered pair: duplicate/reversed-direction SPOUSE rows in the DB
  // (not blocked by any DB constraint) would otherwise each spawn their own
  // union node — a phantom second marriage on reload.
  const pairToUnion = new Map<string, string>();  // "a::b" (sorted) → unionId
  for (const e of edges) {
    if ((e.data?.type as unknown as string) !== 'SPOUSE') continue;
    const key = pairKey(e.source, e.target);
    if (pairToUnion.has(key)) continue;
    const nodeA = nodeById.get(e.source);
    const nodeB = nodeById.get(e.target);
    if (!nodeA || !nodeB) continue;

    const unionId = crypto.randomUUID();
    const x = (nodeA.position.x + nodeB.position.x) / 2;
    const y = Math.max(nodeA.position.y, nodeB.position.y) + 40;
    newNodes.push({ id: unionId, type: 'union', position: { x, y }, data: {} });
    pairToUnion.set(key, unionId);
    newEdges.push(makeEdge(e.source, unionId, 'PARTNER'));
    newEdges.push(makeEdge(e.target, unionId, 'PARTNER'));
  }

  // ── Step 2: PARENT/ADOPTED edges → CHILD/ADOPTED_CHILD through the union of
  // the child's actual parent PAIR. Keying off a single `charToUnion.get(parent)`
  // (the old approach) breaks for a parent with several spouses: every child
  // collapses onto that parent's last-married union and gets duplicated onto the
  // co-parent's union too. Instead, group each child's parents and resolve the
  // union from the pair itself. ──────────────────────────────────────────────
  const childParents = new Map<string, { parents: string[]; adopted: boolean }>();
  for (const e of edges) {
    const t = e.data?.type as unknown as string;
    if (t !== 'PARENT' && t !== 'ADOPTED') continue;
    if (!nodeById.has(e.source) || !nodeById.has(e.target)) continue;
    let rec = childParents.get(e.target);
    if (!rec) { rec = { parents: [], adopted: true }; childParents.set(e.target, rec); }
    if (!rec.parents.includes(e.source)) rec.parents.push(e.source);
    if (t !== 'ADOPTED') rec.adopted = false;  // any biological edge → not adopted
  }

  const coParentUnion = new Map<string, string>();    // "a::b" → unionId (unmarried co-parents)
  const singleParentUnion = new Map<string, string>(); // parentId → unionId (solo)
  const unionChildren = new Map<string, Set<string>>();

  const attachChild = (unionId: string, childId: string, clientType: string) => {
    let set = unionChildren.get(unionId);
    if (!set) { set = new Set(); unionChildren.set(unionId, set); }
    if (set.has(childId)) return;
    set.add(childId);
    newEdges.push(makeEdge(unionId, childId, clientType));
  };

  const makePairUnion = (p0: string, p1: string): string => {
    const nA = nodeById.get(p0)!;
    const nB = nodeById.get(p1)!;
    const unionId = crypto.randomUUID();
    const x = (nA.position.x + nB.position.x) / 2;
    const y = Math.max(nA.position.y, nB.position.y) + 40;
    newNodes.push({ id: unionId, type: 'union', position: { x, y }, data: {} });
    newEdges.push(makeEdge(p0, unionId, 'PARTNER'));
    newEdges.push(makeEdge(p1, unionId, 'PARTNER'));
    return unionId;
  };

  for (const [childId, { parents, adopted }] of childParents) {
    const clientType = adopted ? 'ADOPTED_CHILD' : 'CHILD';

    if (parents.length >= 2) {
      // Prefer a married (SPOUSE) union among the parent pairs; otherwise treat
      // the first two parents as co-parents and synthesize/reuse one union.
      let unionId: string | undefined;
      for (let i = 0; i < parents.length && !unionId; i++) {
        for (let j = i + 1; j < parents.length && !unionId; j++) {
          unionId = pairToUnion.get(pairKey(parents[i], parents[j]));
        }
      }
      if (!unionId) {
        const key = pairKey(parents[0], parents[1]);
        unionId = coParentUnion.get(key) ?? makePairUnion(parents[0], parents[1]);
        coParentUnion.set(key, unionId);
      }
      attachChild(unionId, childId, clientType);
    } else if (parents.length === 1) {
      const p = parents[0];
      let unionId = singleParentUnion.get(p);
      if (!unionId) {
        const pn = nodeById.get(p)!;
        unionId = crypto.randomUUID();
        newNodes.push({
          id: unionId, type: 'union',
          position: { x: pn.position.x, y: pn.position.y + 80 }, data: {},
        });
        singleParentUnion.set(p, unionId);
        newEdges.push(makeEdge(p, unionId, 'PARTNER'));
      }
      attachChild(unionId, childId, clientType);
    }
  }

  return { nodes: newNodes, edges: newEdges };
}

function makeEdge(source: string, target: string, type: string): AnyEdge {
  return {
    id: crypto.randomUUID(),
    type: 'relationship',
    source,
    target,
    data: { type: type as RelationshipData['type'], isMutual: false },
  };
}
