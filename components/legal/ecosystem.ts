/**
 * The shared list of Bag Of Holding Tools. Every tool's footer renders this
 * same list (minus itself) so a new tool only requires one addition here
 */
export type EcosystemTool = {
  name: string;
  /** Absolute URL from another tool's footer; "/" is fine only within this tool's own app. */
  url: string;
};

export const ECOSYSTEM_TOOLS: EcosystemTool[] = [
  // { name: "Any Map Builder", url: "https://anymapbuilder.vercel.app" },
  { name: "Dynasty Tree Builder", url: "/" },
  { name: "Manuscript Builder", url: "https://manuscript.bagofholdingtools.com" },
];

export const SOURCE_REPO_URL = "https://github.com/Marksu-u/DynastyTreeBuilder";
