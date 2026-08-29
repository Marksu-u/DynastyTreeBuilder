// lib/descendant-subtree.ts
// Pure bloodline walks over the union-node graph, used to drive hover
// highlighting. Two directions, never sideways: we walk DOWN into descendants
// and UP into ancestors, but we never descend back out of an ancestor — so a
// sibling, cousin or step-branch is deliberately not part of your lineage
// spine. Marrying-in spouses are collected (so marriage lines light up) but not
// traversed, which is what keeps the walk out of unrelated bloodlines.
// No React / React Flow imports — unit-testable.
import type { FamilyGraph } from './genealogy-layout';

/** Where a person sits relative to the hovered one. `spouse` is married-in
 *  (not blood); everything else is on the bloodline. */
export type BloodTier = 'root' | 'ancestor' | 'descendant' | 'spouse';

/** `depth` is generations from the hovered person: 0 = them, negative = up
 *  toward ancestors, positive = down toward descendants. A spouse takes the
 *  depth of the blood partner they married. */
export interface BloodlineEntry { tier: BloodTier; depth: number }

export interface BloodlineHighlight {
  chars: Map<string, BloodlineEntry>;
  /** Unions carry a tier too, so connectors can be tinted by direction. */
  unions: Map<string, BloodlineEntry>;
}

function isBlood(e: BloodlineEntry | undefined): boolean {
  return !!e && e.tier !== 'spouse';
}

/** Downward walk: children (blood, traversed) and their partners (spouse, not
 *  traversed). Mutates `out`. */
function descend(graph: FamilyGraph, root: string, out: BloodlineHighlight): void {
  const queue: string[] = [root];
  while (queue.length) {
    const person = queue.shift()!;
    const depth = out.chars.get(person)!.depth;
    for (const u of graph.partnerUnions.get(person) ?? []) {
      if (out.unions.has(u.id)) continue;
      out.unions.set(u.id, { tier: 'descendant', depth: depth + 1 });
      for (const p of u.partners) {
        // Spouses light up so the marriage line reads, but are never walked —
        // that would leak into the spouse's own unrelated family.
        if (!out.chars.has(p)) out.chars.set(p, { tier: 'spouse', depth });
      }
      for (const c of u.children) {
        if (isBlood(out.chars.get(c))) continue;
        out.chars.set(c, { tier: 'descendant', depth: depth + 1 });
        queue.push(c);
      }
    }
  }
}

/** Upward walk: both partners of a parent union are blood ancestors. Mutates
 *  `out`. Never descends, so siblings stay out of the spine. */
function ascend(graph: FamilyGraph, root: string, out: BloodlineHighlight): void {
  const queue: string[] = [root];
  while (queue.length) {
    const person = queue.shift()!;
    const depth = out.chars.get(person)!.depth;
    for (const u of graph.parentUnions.get(person) ?? []) {
      if (out.unions.has(u.id)) continue;
      out.unions.set(u.id, { tier: 'ancestor', depth });
      for (const p of u.partners) {
        if (isBlood(out.chars.get(p))) continue;
        out.chars.set(p, { tier: 'ancestor', depth: depth - 1 });
        queue.push(p);
      }
    }
  }
}

/**
 * The full lineage spine around one person: their ancestors, their descendants,
 * the spouses attached to both, and every union linking them.
 *
 * Always returns at least the hovered person, so no card is ever inert — a
 * childless, unmarried person still lights their ancestry.
 */
export function bloodlineHighlight(graph: FamilyGraph, charId: string): BloodlineHighlight {
  const out: BloodlineHighlight = { chars: new Map(), unions: new Map() };
  out.chars.set(charId, { tier: 'root', depth: 0 });
  descend(graph, charId, out);
  ascend(graph, charId, out);
  return out;
}

/**
 * A single marriage: the couple and the children of that union only — no
 * ancestry, no grandchildren. Drives hovering a marriage line, a narrower lens
 * than the whole spine.
 */
export function unionHighlight(graph: FamilyGraph, unionId: string): BloodlineHighlight {
  const out: BloodlineHighlight = { chars: new Map(), unions: new Map() };
  const u = graph.unionById.get(unionId);
  if (!u) return out;
  out.unions.set(u.id, { tier: 'descendant', depth: 1 });
  for (const p of u.partners) out.chars.set(p, { tier: 'root', depth: 0 });
  for (const c of u.children) out.chars.set(c, { tier: 'descendant', depth: 1 });
  return out;
}

/**
 * Descendants only, as plain id sets. Retained for callers that just need
 * "who descends from this person" without tiers.
 */
export function descendantSubtree(
  graph: FamilyGraph,
  charId: string,
): { charIds: Set<string>; unionIds: Set<string> } {
  const out: BloodlineHighlight = { chars: new Map(), unions: new Map() };
  out.chars.set(charId, { tier: 'root', depth: 0 });
  descend(graph, charId, out);
  return { charIds: new Set(out.chars.keys()), unionIds: new Set(out.unions.keys()) };
}
