"use client";

import { useCallback, RefObject } from "react";
import { useReactFlow } from "@xyflow/react";
import { Download } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";

interface Props {
  dynastyName: string;
  canvasRef: RefObject<HTMLDivElement | null>;
}

export function ExportButton({ dynastyName, canvasRef }: Props) {
  const { fitView } = useReactFlow();

  const handleExport = useCallback(async () => {
    await fitView({ duration: 0, padding: 0.15 });
    await new Promise<void>((r) => requestAnimationFrame(() => r()));

    const element = canvasRef.current?.querySelector<HTMLElement>(".react-flow");
    if (!element) return;

    try {
      const dataUrl = await toPng(element, {
        backgroundColor: "#09090b",
        filter: (node) => {
          if (node instanceof Element && node.classList.contains("react-flow__panel")) {
            return false;
          }
          return true;
        },
      });

      const link = document.createElement("a");
      link.download = `${dynastyName}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Exported as PNG");
    } catch {
      toast.error("Export failed");
    }
  }, [fitView, canvasRef, dynastyName]);

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-1.5 rounded px-2 py-1 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
      title="Export as PNG"
    >
      <Download size={14} />
      Export
    </button>
  );
}
