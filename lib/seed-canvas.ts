// lib/seed-canvas.ts
// First-run seeding for the guest canvas.
//
// An empty infinite canvas reads as a broken page rather than a blank one: a
// first-time visitor has never seen what a finished tree looks like, so there
// is nothing to imitate and no evidence the layout engine exists. Seeding House
// Thorne on the very first visit turns that screen into a worked example the
// visitor can drag, rename, or throw away.
//
// The fixture is imported lazily by the caller so its ~14KB never lands in the
// canvas bundle for returning users, who are the common case.
import { parseImportFile, buildCanvasFromExport } from '@/lib/import-canvas';
import type { AnyCanvasNode, RelationshipEdgeType } from '@/store/canvas';

/**
 * Records that first-run seeding has already been decided for this browser, so
 * a visitor who clears the example never has it grow back. Deliberately
 * separate from the store's own persisted key: clearing the canvas must not
 * re-arm seeding.
 */
export const SEED_DECIDED_KEY = 'dynasty-tree-seeded';

/** Set while the canvas still holds the untouched example, to drive the banner. */
export const SHOWING_EXAMPLE_KEY = 'dynasty-tree-showing-example';

export const EXAMPLE_HOUSE_NAME = 'House Thorne';

export function hasSeedBeenDecided(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(SEED_DECIDED_KEY) !== null;
  } catch {
    // Private mode or blocked storage — treat as decided so we never seed over
    // a tree we simply cannot see.
    return true;
  }
}

export function markSeedDecided(value: 'seeded' | 'skipped'): void {
  try {
    localStorage.setItem(SEED_DECIDED_KEY, value);
  } catch {
    /* storage unavailable — seeding is best-effort */
  }
}

export function isShowingExample(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(SHOWING_EXAMPLE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setShowingExample(showing: boolean): void {
  try {
    if (showing) localStorage.setItem(SHOWING_EXAMPLE_KEY, '1');
    else localStorage.removeItem(SHOWING_EXAMPLE_KEY);
  } catch {
    /* storage unavailable */
  }
}

/**
 * Builds the example dynasty through the same import path a user's own file
 * takes, so the fixture can never drift into a shape the importer rejects.
 */
export async function buildSeedCanvas(): Promise<{
  nodes: AnyCanvasNode[];
  edges: RelationshipEdgeType[];
}> {
  const fixture = (await import('@/lib/seed/showcase-dynasty.json')).default;
  const data = parseImportFile(JSON.stringify(fixture));
  const { nodes, edges } = buildCanvasFromExport(data);
  return { nodes: nodes as AnyCanvasNode[], edges: edges as RelationshipEdgeType[] };
}
