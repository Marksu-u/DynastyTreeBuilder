/**
 * The landing page's hero house — generated rather than borrowed.
 *
 * The real showcase dynasty is roughly 4:1 wide, with a disconnected in-law
 * cluster off to one side. Fitted into the landing's column that letterboxes
 * into a thin band with dead space above and below, and the branch that matters
 * ends up too small to read.
 *
 * So this is composed for the shape instead: five generations that widen once
 * and then taper to a single line, giving a near-square silhouette that fills
 * the panel, a clear central spine for the gold bloodline to trace, and enough
 * bands that the scroll reveal has somewhere to go.
 *
 * It carries no names. The cards render as bars at this size anyway, and an
 * invented house name would be a claim the page does not need to make.
 */

export interface GeneratedDynasty {
  characters: { id: string; flags: string[] }[];
  relationships: { fromId: string; toId: string; type: string }[];
}

/**
 * Row plan. `heirs` is how many children the previous generation's central
 * couple had; the heir is always the middle child, which keeps the spine
 * centred and the silhouette symmetrical.
 */
const ROWS = [3, 3, 2, 1];

export function landingDynasty(): GeneratedDynasty {
  const characters: GeneratedDynasty["characters"] = [];
  const relationships: GeneratedDynasty["relationships"] = [];

  const person = (id: string, flags: string[] = []) => {
    characters.push({ id, flags });
    return id;
  };
  const marry = (a: string, b: string) =>
    relationships.push({ fromId: a, toId: b, type: "SPOUSE" });
  const child = (parent: string, kid: string) =>
    relationships.push({ fromId: parent, toId: kid, type: "PARENT" });

  // Generation 0: the founding couple.
  const founder = person("g0-heir", ["FOUNDER"]);
  marry(founder, person("g0-consort"));

  let heir = founder;
  ROWS.forEach((count, gen) => {
    const g = gen + 1;
    // The heir is the middle child, so the spine stays centred as the tree grows.
    const heirIndex = Math.floor((count - 1) / 2);
    let nextHeir = "";

    for (let i = 0; i < count; i++) {
      const id = person(`g${g}-${i}`);
      child(heir, id);
      if (i === heirIndex) nextHeir = id;
    }

    // Only the heir marries in, which is what makes the tree taper: the other
    // siblings are leaves.
    if (g < ROWS.length) {
      marry(nextHeir, person(`g${g}-consort`));
    }
    heir = nextHeir;
  });

  return { characters, relationships };
}
