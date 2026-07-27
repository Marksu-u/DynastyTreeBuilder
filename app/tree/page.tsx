"use client";

import '@xyflow/react/dist/style.css';
import { ReactFlowProvider } from '@xyflow/react';
import { GuestBanner } from '@/components/canvas/GuestBanner';
import { TreeCanvas } from '@/components/canvas/TreeCanvas';

export default function TreePage() {
  return (
    <div className="flex h-screen flex-col bg-zinc-950">
      <GuestBanner />
      {/* min-h-0 is load-bearing: without it this flex item has no definite
          height on the first layout pass, the canvas's h-full resolves to 0,
          and React Flow caches a 0×0 viewport — which makes every later
          fitView() clamp to minZoom instead of framing the tree. */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <ReactFlowProvider>
          <TreeCanvas />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
