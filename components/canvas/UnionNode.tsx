// components/canvas/UnionNode.tsx
"use client";

import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import type { UnionData } from '@/types/canvas';

export type UnionNodeType = Node<UnionData, 'union'>;

const HANDLE_STYLE = '!w-px !h-px !min-w-0 !min-h-0 !bg-transparent !border-0 !opacity-0';

/** Invisible routing point between partners — pure layout anchor, no UI. */
export const UnionNode = memo((_props: NodeProps<UnionNodeType>) => {
  return (
    <div className="pointer-events-none h-px w-px">
      <Handle type="target" position={Position.Top}    id="top"    className={HANDLE_STYLE} isConnectable={false} />
      <Handle type="target" position={Position.Left}   id="left"   className={HANDLE_STYLE} isConnectable={false} />
      <Handle type="target" position={Position.Right}  id="right"  className={HANDLE_STYLE} isConnectable={false} />
      <Handle type="source" position={Position.Bottom} id="bottom" className={HANDLE_STYLE} isConnectable={false} />
    </div>
  );
});

UnionNode.displayName = 'UnionNode';
