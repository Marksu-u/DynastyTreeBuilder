"use client";

import { useReactFlow } from "@xyflow/react";
import { Plus, Minus, Square } from "lucide-react";

/**
 * Zoom, in the bottom-left slot directly above the legend (design.md §9).
 *
 * This replaces React Flow's own <Controls>, which defaults to the bottom-left
 * but had been pushed to the bottom-right — where it collided with the toast
 * slot. Owning the markup is cheaper than fighting `!important` overrides for a
 * three-button stack.
 *
 * Deliberately no "fit" button: the slot map puts fit in the top-left tool
 * actions, and it is already there. This stack is zoom only — in, out, and back
 * to 1:1.
 */
export function ZoomControls() {
  const { zoomIn, zoomOut, zoomTo } = useReactFlow();

  return (
    <div className="flex w-fit flex-col overflow-hidden rounded-lg border border-zinc-700 bg-surface-1 shadow-lg">
      <Button label="Zoom in" onClick={() => zoomIn({ duration: 160 })}>
        <Plus size={13} />
      </Button>
      <Button label="Zoom out" onClick={() => zoomOut({ duration: 160 })}>
        <Minus size={13} />
      </Button>
      <Button label="Reset zoom to 100%" last onClick={() => zoomTo(1, { duration: 160 })}>
        <Square size={13} />
      </Button>
    </div>
  );
}

function Button({
  label,
  onClick,
  last = false,
  children,
}: {
  label: string;
  onClick: () => void;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex cursor-pointer items-center justify-center px-2 py-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 ${
        last ? "" : "border-b border-zinc-700"
      }`}
    >
      {children}
    </button>
  );
}
