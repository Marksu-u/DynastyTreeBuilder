"use client";

import { useRef, useState, useEffect } from "react";
import { useReactFlow } from "@xyflow/react";
import {
  Maximize2, Grid3X3, Undo2, Redo2,
  Download, ChevronDown, Settings2,
} from "lucide-react";

export type SidebarPanel = 'custom';

interface Props {
  gridVisible: boolean;
  onToggleGrid: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  activeSidebar?: SidebarPanel | null;
  onToggleSidebar?: (panel: SidebarPanel) => void;
  onExport?: () => void;
  onExportJson?: () => void;
  /** When true, shows the "Custom options" panel toggle */
  showCustomOptions?: boolean;
}

export function Toolbar({
  gridVisible,
  onToggleGrid,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  activeSidebar = null,
  onToggleSidebar,
  onExport,
  onExportJson,
  showCustomOptions = false,
}: Props) {
  const { fitView } = useReactFlow();
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [exportOpen]);

  const showExport = !!onExport;
  const showDropdown = showExport && !!onExportJson;

  return (
    <div className="absolute left-4 top-4 z-10 flex items-center gap-0.5 rounded-lg border border-zinc-700 bg-zinc-900/95 p-1 shadow-lg backdrop-blur-sm">
      <button
        onClick={() => fitView({ duration: 400, padding: 0.15 })}
        className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
        title="Zoom to fit"
      >
        <Maximize2 size={14} />
      </button>

      <button
        onClick={onToggleGrid}
        className={[
          "rounded p-1.5 transition-colors",
          gridVisible
            ? "bg-zinc-800 text-zinc-200"
            : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300",
        ].join(" ")}
        title="Toggle grid"
      >
        <Grid3X3 size={14} />
      </button>

      <div className="mx-0.5 h-5 w-px bg-zinc-700" />

      <button
        onClick={onUndo}
        disabled={!canUndo || !onUndo}
        className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
        title="Undo"
      >
        <Undo2 size={14} />
      </button>

      <button
        onClick={onRedo}
        disabled={!canRedo || !onRedo}
        className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
        title="Redo"
      >
        <Redo2 size={14} />
      </button>

      {showCustomOptions && onToggleSidebar && (
        <>
          <div className="mx-0.5 h-5 w-px bg-zinc-700" />
          <button
            onClick={() => onToggleSidebar('custom')}
            className={[
              "rounded p-1.5 transition-colors",
              activeSidebar === 'custom'
                ? "bg-zinc-800 text-zinc-200"
                : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300",
            ].join(" ")}
            title="My custom options"
          >
            <Settings2 size={14} />
          </button>
        </>
      )}

      {showExport && (
        <>
          <div className="mx-0.5 h-5 w-px bg-zinc-700" />

          {showDropdown ? (
            <div ref={exportRef} className="relative">
              <button
                onClick={() => setExportOpen((v) => !v)}
                className="flex items-center gap-1 rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                title="Export"
              >
                <Download size={14} />
                <ChevronDown size={11} />
              </button>

              {exportOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 min-w-[140px] overflow-hidden rounded-md border border-zinc-700 bg-zinc-900 py-1 shadow-lg">
                  <button
                    onClick={() => { setExportOpen(false); onExport?.(); }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
                  >
                    Export PNG
                  </button>
                  <button
                    onClick={() => { setExportOpen(false); onExportJson?.(); }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
                  >
                    Download JSON
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onExport}
              className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
              title="Export as PNG"
            >
              <Download size={14} />
            </button>
          )}
        </>
      )}
    </div>
  );
}
