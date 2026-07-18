"use client";

import { useCallback, useRef, useState, useEffect, RefObject } from "react";
import { useReactFlow } from "@xyflow/react";
import { Download, ChevronDown } from "lucide-react";
import { exportCanvasToPng } from "@/lib/export";
import { toast } from "sonner";

interface Props {
  dynastyName: string;
  canvasRef: RefObject<HTMLDivElement | null>;
  onExportJson?: () => Promise<void>;
}

export function ExportButton({ dynastyName, canvasRef, onExportJson }: Props) {
  const reactFlow = useReactFlow();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleExportPng = useCallback(async () => {
    setOpen(false);
    await exportCanvasToPng(reactFlow, canvasRef, dynastyName);
  }, [reactFlow, canvasRef, dynastyName]);

  const handleExportJson = useCallback(async () => {
    setOpen(false);
    if (!onExportJson) return;
    try {
      await onExportJson();
      toast.success("Downloaded as JSON");
    } catch {
      toast.error("Export failed");
    }
  }, [onExportJson]);

  if (!onExportJson) {
    return (
      <button
        onClick={handleExportPng}
        className="flex items-center gap-1.5 rounded px-2 py-1 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
        title="Export as PNG"
      >
        <Download size={14} />
        Export
      </button>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded px-2 py-1 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
        title="Export"
      >
        <Download size={14} />
        Export
        <ChevronDown size={12} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] overflow-hidden rounded-md border border-zinc-700 bg-zinc-900 py-1 shadow-lg">
          <button
            onClick={handleExportPng}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Export PNG
          </button>
          <button
            onClick={handleExportJson}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Download JSON
          </button>
        </div>
      )}
    </div>
  );
}
