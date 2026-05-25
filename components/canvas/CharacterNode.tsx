"use client";

import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { Pencil } from 'lucide-react';
import { useCanvasStore } from '@/store/canvas';
import type { CharacterData, CharacterRole } from '@/types/canvas';

type CharacterNodeType = Node<CharacterData, 'character'>;

const ROLE_COLORS: Record<CharacterRole, string> = {
  HEIR:        'bg-amber-500/20 text-amber-300 border-amber-500/40',
  PATRIARCH:   'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  MATRIARCH:   'bg-rose-500/20 text-rose-300 border-rose-500/40',
  OPERATIVE:   'bg-blue-500/20 text-blue-300 border-blue-500/40',
  INFORMANT:   'bg-purple-500/20 text-purple-300 border-purple-500/40',
  SWORN_ENEMY: 'bg-red-500/20 text-red-300 border-red-500/40',
  ALLY:        'bg-green-500/20 text-green-300 border-green-500/40',
  RIVAL:       'bg-orange-500/20 text-orange-300 border-orange-500/40',
  ADVISOR:     'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  UNKNOWN:     'bg-zinc-700/50 text-zinc-400 border-zinc-600/40',
  OTHER:       'bg-zinc-700/50 text-zinc-400 border-zinc-600/40',
};

const ROLE_LABELS: Record<CharacterRole, string> = {
  HEIR: 'Heir', PATRIARCH: 'Patriarch', MATRIARCH: 'Matriarch',
  OPERATIVE: 'Operative', INFORMANT: 'Informant', SWORN_ENEMY: 'Sworn Enemy',
  ALLY: 'Ally', RIVAL: 'Rival', ADVISOR: 'Advisor',
  UNKNOWN: 'Unknown', OTHER: 'Other',
};

const HANDLE_STYLE =
  '!w-3 !h-3 !bg-zinc-600 !border-2 !border-zinc-500 hover:!bg-blue-400 hover:!border-blue-400 transition-colors';

export const CharacterNode = memo(({ id, data, selected }: NodeProps<CharacterNodeType>) => {
  const setEditingCharacterId = useCanvasStore((s) => s.setEditingCharacterId);

  return (
    <div
      className={[
        'relative w-[180px] rounded-lg border bg-zinc-800/95 px-3 py-3 shadow-lg transition-colors duration-100',
        selected
          ? 'border-blue-400 ring-2 ring-blue-400/20'
          : 'border-zinc-700 hover:border-zinc-600',
        data.isLost ? 'opacity-50' : '',
      ].join(' ')}
    >
      <Handle type="source" position={Position.Top}    id="top"    className={HANDLE_STYLE} />
      <Handle type="source" position={Position.Left}   id="left"   className={HANDLE_STYLE} />
      <Handle type="source" position={Position.Right}  id="right"  className={HANDLE_STYLE} />
      <Handle type="source" position={Position.Bottom} id="bottom" className={HANDLE_STYLE} />

      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight text-zinc-100">{data.name}</p>
          {data.alias && (
            <p className="truncate text-[11px] italic text-zinc-400">"{data.alias}"</p>
          )}
        </div>
        {!data.isReadOnly && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditingCharacterId(id);
            }}
            className="nodrag flex-shrink-0 rounded p-0.5 text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-300"
            title="Edit character"
          >
            <Pencil size={12} />
          </button>
        )}
      </div>

      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
        <span
          className={[
            'inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium',
            ROLE_COLORS[data.role],
          ].join(' ')}
        >
          {ROLE_LABELS[data.role]}
        </span>
        <span className="inline-flex items-center rounded border border-zinc-600/30 bg-zinc-700/40 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
          Gen {data.generation ?? 0}
        </span>
        {data.isFounder && (
          <span className="text-[9px] font-medium uppercase tracking-wide text-amber-400">
            ◆ Founder
          </span>
        )}
      </div>

      {data.style !== 'OTHER' && (
        <p className="mt-1 text-[10px] capitalize text-zinc-500">
          {data.style.toLowerCase()}
        </p>
      )}
    </div>
  );
});

CharacterNode.displayName = 'CharacterNode';
