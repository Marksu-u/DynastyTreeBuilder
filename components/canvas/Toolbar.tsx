"use client";

import { useRef, useState, useEffect } from "react";
import { useReactFlow } from "@xyflow/react";
import {
  Maximize2, Grid3X3, Undo2, Redo2,
  Download, Upload, ChevronDown,
} from "lucide-react";

interface Props {
  gridVisible: boolean;
  onToggleGrid: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onExport?: () => void;
  onExportJson?: () => void;
  onImportJson?: () => void;
  /** Frames the whole tree. Supplied by the canvas because React Flow's own
   *  fitView() does not work in this app — see lib/fit-viewport.ts. */
  onFitView?: () => void;
  /** Trailing tool actions that are document-specific, e.g. the settings
   *  dialog trigger. The workspace is full-bleed with no header to hold them,
   *  so they belong in this slot rather than a new one (design.md §9). */
  extra?: React.ReactNode;
}

export function Toolbar({
  gridVisible,
  onToggleGrid,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onExport,
  onExportJson,
  onImportJson,
  onFitView,
  extra,
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
  const showDropdown = showExport && (!!onExportJson || !!onImportJson);
  // Undo/redo only exist where there is a history to walk. The account canvas
  // writes through to the server on every edit and keeps no snapshots, so
  // rendering the pair there would be two permanently-disabled buttons — dead
  // chrome in the slot the charter reserves for live tool actions.
  const showHistory = !!onUndo || !!onRedo;

  return (
    <div className="absolute left-4 top-4 z-20 flex items-center gap-0.5 rounded-lg border border-zinc-700 bg-zinc-900/95 p-1 shadow-lg backdrop-blur-sm">
      <button
        onClick={() => (onFitView ? onFitView() : fitView({ duration: 400, padding: 0.15 }))}
        className="cursor-pointer rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
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

      {showHistory && (
        <>
          <div className="mx-0.5 h-5 w-px bg-zinc-700" />

          <button
            onClick={onUndo}
            disabled={!canUndo || !onUndo}
            className="cursor-pointer rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
            title="Undo (Ctrl/⌘+Z)"
          >
            <Undo2 size={14} />
          </button>

          <button
            onClick={onRedo}
            disabled={!canRedo || !onRedo}
            className="cursor-pointer rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
            title="Redo (Ctrl/⌘+Shift+Z)"
          >
            <Redo2 size={14} />
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
                  {onImportJson && (
                    <>
                      <div className="my-1 h-px bg-zinc-700" />
                      <button
                        onClick={() => { setExportOpen(false); onImportJson(); }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
                      >
                        <Upload size={12} />
                        Import JSON
                      </button>
                    </>
                  )}
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

      {extra && (
        <>
          <div className="mx-0.5 h-5 w-px bg-zinc-700" />
          {extra}
        </>
      )}
    </div>
  );
}
