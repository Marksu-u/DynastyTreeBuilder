// lib/descendant-subtree.ts
// Pure downward walk: from a character, collect every union and person in their
// descendant bloodline. Marrying-in spouses are collected (so marriage lines
// highlight) but NOT traversed — we never wander into an unrelated bloodline.
// No React / React Flow imports — unit-testable.
import type { FamilyGraph } from './genealogy-layout';

export function descendantSubtree(
  graph: FamilyGraph,
  charId: string,
): { charIds: Set<string>; unionIds: Set<string> } {
  const charIds = new Set<string>([charId]);
  const unionIds = new Set<string>();
  const queue: string[] = [charId];

  while (queue.length) {
    const person = queue.shift()!;
    for (const u of graph.partnerUnions.get(person) ?? []) {
      if (unionIds.has(u.id)) continue;
      unionIds.add(u.id);
      for (const p of u.partners) charIds.add(p);      // spouses: highlight, don't walk
      for (const c of u.children) {
        if (!charIds.has(c)) { charIds.add(c); queue.push(c); }
      }
    }
  }
  return { charIds, unionIds };
}
