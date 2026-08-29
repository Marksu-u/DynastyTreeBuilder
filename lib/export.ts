import { toPng } from "html-to-image";
import { toast } from "sonner";
import type { Node } from "@xyflow/react";

export function triggerJsonDownload(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const CHARACTER_W = 180;
const CHARACTER_H = 64;
const UNION_SIZE = 16;

/** Fallback only — the live value comes from the --background token. */
const EXPORT_BG_FALLBACK = "#09090b";

/** Reads the canvas background off the theme token so a themed canvas exports
 *  on its own ground rather than a hardcoded zinc-950. */
function resolveExportBackground(): string {
  if (typeof window === "undefined") return EXPORT_BG_FALLBACK;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue("--background")
    .trim();
  return value || EXPORT_BG_FALLBACK;
}

export async function exportCanvasToPng(
  instance: { getNodes: () => Node[] },
  containerRef: React.RefObject<HTMLDivElement | null>,
  dynastyName: string,
): Promise<void> {
  const viewportEl = containerRef.current?.querySelector<HTMLElement>(
    ".react-flow__viewport",
  );
  if (!viewportEl) {
    toast.error("Canvas element not found");
    return;
  }

  const allNodes = instance.getNodes();
  if (allNodes.length === 0) {
    toast.error("No characters to export");
    return;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of allNodes) {
    const isUnion = node.type === "union";
    const w =
      node.measured?.width ?? node.width ?? (isUnion ? UNION_SIZE : CHARACTER_W);
    const h =
      node.measured?.height ??
      node.height ??
      (isUnion ? UNION_SIZE : CHARACTER_H);

    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + w);
    maxY = Math.max(maxY, node.position.y + h);
  }

  const treeWidth = maxX - minX;
  const treeHeight = maxY - minY;

  const EDGE_SAFETY = 40;
  const PAD_LEFT = 160 + EDGE_SAFETY;
  const PAD_RIGHT = 60 + EDGE_SAFETY;
  const PAD_TOP = 180 + EDGE_SAFETY;
  const PAD_BOTTOM = 60 + EDGE_SAFETY;

  const exportWidth = Math.ceil(treeWidth + PAD_LEFT + PAD_RIGHT);
  const exportHeight = Math.ceil(treeHeight + PAD_TOP + PAD_BOTTOM);

  const tx = PAD_LEFT - minX;
  const ty = PAD_TOP - minY;

  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  toast.info("Generating high-resolution PNG…");

  // Webfonts are inlined by fetching them, so capturing before they resolve
  // bakes the fallback face into the PNG. Guard is cheap once fonts are cached.
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  // Freeze every animation and transition under the canvas for the capture —
  // see the .exporting rule in globals.css.
  const guardEl = containerRef.current;
  guardEl?.classList.add("exporting");

  try {
    const dataUrl = await toPng(viewportEl, {
      backgroundColor: resolveExportBackground(),
      width: exportWidth,
      height: exportHeight,
      pixelRatio: 2, // 2× pixel density for crisp text at any zoom
      style: {
        width: `${exportWidth}px`,
        height: `${exportHeight}px`,
        transform: `translate(${tx}px, ${ty}px) scale(1)`,
      },
      filter: (node) => {
        if (node instanceof Element) {
          if (
            node.classList.contains("react-flow__panel") ||
            node.classList.contains("react-flow__controls") ||
            node.classList.contains("react-flow__minimap") ||
            node.classList.contains("connection-popup")
          ) {
            return false;
          }
        }
        return true;
      },
    });

    const link = document.createElement("a");
    link.download = `${dynastyName || "dynasty-tree"}.png`;
    link.href = dataUrl;
    link.click();
    toast.success("Exported as PNG");
  } catch (error) {
    console.error("Export failed:", error);
    toast.error("Export failed");
  } finally {
    guardEl?.classList.remove("exporting");
  }
}

