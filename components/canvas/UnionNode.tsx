// components/canvas/UnionNode.tsx
"use client";

import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import type { UnionData } from '@/types/canvas';

export type UnionNodeType = Node<UnionData, 'union'>;

const HANDLE_STYLE = '!w-2 !h-2 !bg-transparent !border-0 !opacity-0';

export const UnionNode = memo(({ id, selected }: NodeProps<UnionNodeType>) => {
  void id;
  return (
    <div
      className={[
        'flex items-center justify-center rounded-full transition-colors',
        'w-4 h-4 cursor-default',
        selected
          ? 'bg-zinc-700 ring-2 ring-blue-400/60 border-2 border-white'
          : 'bg-zinc-800 border-2 border-zinc-400 hover:border-white',
      ].join(' ')}
      title="Family union — drop a character here to add as child or partner"
    >
      <Handle type="target" position={Position.Top}    id="top"    className={HANDLE_STYLE} />
      <Handle type="target" position={Position.Left}   id="left"   className={HANDLE_STYLE} />
      <Handle type="target" position={Position.Right}  id="right"  className={HANDLE_STYLE} />
      <Handle type="source" position={Position.Bottom} id="bottom" className={HANDLE_STYLE} />
    </div>
  );
});

UnionNode.displayName = 'UnionNode';
