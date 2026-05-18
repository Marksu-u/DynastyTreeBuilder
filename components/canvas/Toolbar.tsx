"use client";

import { useReactFlow } from '@xyflow/react';
import { Plus, Maximize2, Grid3X3, Undo2, Redo2 } from 'lucide-react';
import { useCanvasStore } from '@/store/canvas';

interface Props {
  onAddCharacter: () => void;
}

export function Toolbar({ onAddCharacter }: Props) {
  const { fitView } = useReactFlow();
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const canUndo = useCanvasStore((s) => s.past.length > 0);
  const canRedo = useCanvasStore((s) => s.future.length > 0);
  const gridVisible = useCanvasStore((s) => s.gridVisible);
  const toggleGrid = useCanvasStore((s) => s.toggleGrid);

  return (
    <div className="absolute left-4 top-4 z-10 flex items-center gap-0.5 rounded-lg border border-zinc-700 bg-zinc-900/95 p-1 shadow-lg backdrop-blur-sm">
      <button
        onClick={onAddCharacter}
        className="flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-800"
      >
        <Plus size={14} />
        Add Character
      </button>

      <div className="mx-0.5 h-5 w-px bg-zinc-700" />

      <button
        onClick={() => fitView({ duration: 400, padding: 0.15 })}
        className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
        title="Zoom to fit"
      >
        <Maximize2 size={14} />
      </button>

      <button
        onClick={toggleGrid}
        className={[
          'rounded p-1.5 transition-colors',
          gridVisible
            ? 'bg-zinc-800 text-zinc-200'
            : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300',
        ].join(' ')}
        title="Toggle grid"
      >
        <Grid3X3 size={14} />
      </button>

      <div className="mx-0.5 h-5 w-px bg-zinc-700" />

      <button
        onClick={undo}
        disabled={!canUndo}
        className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
        title="Undo"
      >
        <Undo2 size={14} />
      </button>

      <button
        onClick={redo}
        disabled={!canRedo}
        className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
        title="Redo"
      >
        <Redo2 size={14} />
      </button>
    </div>
  );
}
