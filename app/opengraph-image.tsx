import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderOgCard, OG_SIZE } from "@/lib/og-card";
import { buildOgGraph } from "@/lib/og-tree";

// nodejs, not edge: lib/og-card loads Geist from disk with fs.readFile, which
// the edge runtime does not provide.
export const runtime = "nodejs";
export const alt =
  "Dynasty Tree Builder — family trees for D&D and TTRPG campaigns";
export const size = OG_SIZE;
export const contentType = "image/png";

interface Showcase {
  dynasty: { name: string };
  characters: { id: string; flags: string[] }[];
  relationships: { fromId: string; toId: string; type: string }[];
}

export default function Image() {
  // Legacy pair edges, exactly like the DB, so buildOgGraph migrates them to the
  // union-node model the same way the share route does.
  const seed = JSON.parse(
    readFileSync(join(process.cwd(), "lib", "seed", "showcase-dynasty.json"), "utf8"),
  ) as Showcase;

  const { nodes, edges, founderIds } = buildOgGraph(seed.characters, seed.relationships);

  return renderOgCard({
    houseName: seed.dynasty.name,
    meta: `Fantasy · ${seed.characters.length} characters`,
    crestSeed: "house-thorne",
    nodes,
    edges,
    founderIds,
  });
}
