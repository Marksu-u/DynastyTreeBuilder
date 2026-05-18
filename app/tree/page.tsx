"use client";

import '@xyflow/react/dist/style.css';
import { ReactFlowProvider } from '@xyflow/react';
import { GuestBanner } from '@/components/canvas/GuestBanner';
import { TreeCanvas } from '@/components/canvas/TreeCanvas';

export default function TreePage() {
  return (
    <div className="flex h-screen flex-col bg-zinc-950">
      <GuestBanner />
      <div className="flex-1 overflow-hidden">
        <ReactFlowProvider>
          <TreeCanvas />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
