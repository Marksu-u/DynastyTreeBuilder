"use client";

import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { Pencil, Skull, ArrowDownRight, LogOut } from 'lucide-react';
import { useCanvasStore } from '@/store/canvas';
import { useCanvasContext } from './CanvasContext';
import type { CharacterData, CharacterFlag } from '@/types/canvas';

type CharacterNodeType = Node<CharacterData, 'character'>;

const HANDLE_STYLE =
  '!w-3 !h-3 !bg-zinc-600 !border-2 !border-zinc-500 hover:!bg-blue-400 hover:!border-blue-400 transition-colors';

const FLAG_STYLES: Record<CharacterFlag, { label: string; className: string; icon?: React.ReactNode }> = {
  FOUNDER:  { label: 'Founder',  className: 'bg-amber-900/30 border-amber-700/50 text-amber-400',        icon: <span className="text-[8px]">◆</span> },
  BASTARD:  { label: 'Bastard',  className: 'bg-zinc-800/80 border-zinc-600/50 text-zinc-400' },
  ADOPTED:  { label: 'Adopted',  className: 'bg-emerald-900/30 border-emerald-700/50 text-emerald-400',  icon: <ArrowDownRight size={9} /> },
  EXILE:    { label: 'Exile',    className: 'bg-orange-900/30 border-orange-700/50 text-orange-400',     icon: <LogOut size={9} /> },
  DECEASED: { label: 'Dead',     className: 'bg-red-900/20 border-red-800/40 text-red-400',              icon: <Skull size={9} /> },
};

export const CharacterNode = memo(({ id, data, selected }: NodeProps<CharacterNodeType>) => {
  const canvasCtx = useCanvasContext();
  const setEditingCharacterIdStore = useCanvasStore((s) => s.setEditingCharacterId);
  const setEditingCharacterId = canvasCtx ? canvasCtx.setEditingCharacterId : setEditingCharacterIdStore;
  const flags = data.flags ?? [];

  return (
    <div
      className={[
        'relative w-[180px] rounded-lg border bg-zinc-800/95 px-3 py-3 shadow-lg transition-colors duration-100',
        selected
          ? 'border-blue-400 ring-2 ring-blue-400/20'
          : 'border-zinc-700 hover:border-zinc-600',
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
            <p className="truncate text-[11px] italic text-zinc-400">&quot;{data.alias}&quot;</p>
          )}
        </div>
        {!data.isReadOnly && (
          <button
            onClick={(e) => { e.stopPropagation(); setEditingCharacterId(id); }}
            className="nodrag flex-shrink-0 rounded p-0.5 text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-300"
            title="Edit character"
          >
            <Pencil size={12} />
          </button>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center rounded border border-zinc-600/30 bg-zinc-700/40 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
          Gen {data.generation ?? 0}
        </span>

        {data.gender && data.gender !== 'UNKNOWN' && (
          <span
            className={[
              'inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium',
              data.gender === 'MALE'   ? 'bg-[#E6F1FB] border-[#0C447C]/30 text-[#0C447C]' :
              data.gender === 'FEMALE' ? 'bg-[#FBEAF0] border-[#72243E]/30 text-[#72243E]' :
                                         'bg-[#F1EFE8] border-[#444441]/30 text-[#444441]',
            ].join(' ')}
          >
            {data.gender === 'MALE' ? 'M' : data.gender === 'FEMALE' ? 'F' : 'NB'}
          </span>
        )}

        {flags.map((flag) => {
          const def = FLAG_STYLES[flag];
          return (
            <span
              key={flag}
              className={`inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] font-medium ${def.className}`}
            >
              {def.icon}
              {def.label}
            </span>
          );
        })}
      </div>

      {data.style && data.style !== 'OTHER' && (
        <p className="mt-1 text-[10px] capitalize text-zinc-500">
          {data.style.toLowerCase().replace(/_/g, ' ')}
        </p>
      )}
    </div>
  );
});

CharacterNode.displayName = 'CharacterNode';
