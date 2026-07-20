/**
 * The shared list of Bag Of Holding Tools. Every tool's footer renders this
 * same list (minus itself) so a new tool only requires one addition here —
 * see docs/ecosystem.md §4. Keep this file byte-identical across tool repos.
 */
export type EcosystemTool = {
  name: string;
  /** Absolute URL from another tool's footer; "/" is fine only within this tool's own app. */
  url: string;
};

export const ECOSYSTEM_TOOLS: EcosystemTool[] = [
  { name: "Any Map Builder", url: "https://anymapbuilder.vercel.app" },
  { name: "Dynasty Tree Builder", url: "/" },
];
