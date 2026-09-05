"use client";

import '@xyflow/react/dist/style.css';
import { ReactFlowProvider } from '@xyflow/react';
import { TreeCanvas } from '@/components/canvas/TreeCanvas';

export default function TreePage() {
  return (
    // Full-bleed: no header, no footer, the surface owns the viewport
    // (design.md §9). The house name, crest and guest state used to sit in a
    // docked GuestBanner above the canvas; they now float in the same
    // top-centre and top-right slots the account workspace uses.
    //
    // Losing the flex column also loses the min-h-0 hazard that came with it —
    // this div has a definite height on the first layout pass, so React Flow
    // never caches a 0×0 viewport and fitView() frames the tree correctly.
    <div className="h-screen h-[100dvh] w-full overflow-hidden bg-background">
      <ReactFlowProvider>
        <TreeCanvas />
      </ReactFlowProvider>
    </div>
  );
}
