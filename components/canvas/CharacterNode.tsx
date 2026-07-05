"use client";

import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { Pencil, Skull } from 'lucide-react';
import { useCanvasStore } from '@/store/canvas';
import { useCanvasContext } from './CanvasContext';
import type { CharacterData } from '@/types/canvas';

type CharacterNodeType = Node<CharacterData, 'character'>;

// Quiet by default (small, muted, low opacity); full size + amber accent on
// hover, on an active connection drag (connectingfrom/connectingto), or when
// the card is selected (selectedClass, applied conditionally below) — so
// touch/keyboard users can reach handles by selecting the card first.
const HANDLE_STYLE =
  '!w-2 !h-2 !bg-zinc-600 !border !border-zinc-600 !opacity-40 transition-all duration-150 ' +
  'hover:!opacity-100 hover:!w-3 hover:!h-3 hover:!bg-accent hover:!border-accent ' +
  '[&.connectingfrom]:!opacity-100 [&.connectingfrom]:!w-3 [&.connectingfrom]:!h-3 [&.connectingfrom]:!bg-accent [&.connectingfrom]:!border-accent ' +
  '[&.connectingto]:!opacity-100 [&.connectingto]:!w-3 [&.connectingto]:!h-3 [&.connectingto]:!bg-accent [&.connectingto]:!border-accent';

const HANDLE_STYLE_SELECTED = HANDLE_STYLE + ' !opacity-100 !w-3 !h-3 !bg-accent !border-accent';

// Rect inset by half-stroke so the stroke sits exactly on the card edge.
// rx matches rounded-lg (8px) minus the inset (0.75px).
const SVG_RECT_PROPS = {
  x: 0.75, y: 0.75, rx: 7.25, ry: 7.25,
  fill: 'none', strokeWidth: 1.5,
} as const;

export const CharacterNode = memo(({ id, data, selected }: NodeProps<CharacterNodeType>) => {
  const canvasCtx = useCanvasContext();
  const setEditingCharacterIdStore = useCanvasStore((s) => s.setEditingCharacterId);
  const setEditingCharacterId = canvasCtx ? canvasCtx.setEditingCharacterId : setEditingCharacterIdStore;
  const flags = data.flags ?? [];

  const isDeceased = flags.includes('DECEASED');
  const isGhost = data.isGhost ?? false;
  const isFounder  = flags.includes('FOUNDER');
  const isBastard  = flags.includes('BASTARD');
  const isAdopted  = flags.includes('ADOPTED');
  const isExile    = flags.includes('EXILE');

  const hasSvgBorder = !selected && (isAdopted || isExile);
  // Both flags: "7 13" with orange offset 10 → teal 7px, gap 3px, orange 7px, gap 3px, repeat
  // Single flag: "7 4" for a standard dashed look
  const dashArray = isAdopted && isExile ? '7 13' : '7 4';

  const statusLabels = [
    isBastard && { label: 'Bastard', color: '#EF9F27' },
    isAdopted && { label: 'Adopted', color: '#5DCAA5' },
    isExile   && { label: 'Exiled',  color: '#D85A30' },
  ].filter(Boolean) as { label: string; color: string }[];

  const hasSubRow = (data.style && data.style !== 'OTHER') || statusLabels.length > 0;

  return (
    <div
      className={[
        'relative w-[180px] rounded-lg bg-zinc-800/95 px-3 py-3 shadow-lg transition-colors duration-100',
        selected
          ? 'border border-blue-400 ring-2 ring-blue-400/20'
          : hasSvgBorder
          ? ''
          : 'border border-zinc-700 hover:border-zinc-600',
      ].join(' ')}
      style={isGhost ? { opacity: 0.4, filter: 'grayscale(1)' } : undefined}
    >
      {/* SVG dashed border — follows border-radius on all four sides */}
      {hasSvgBorder && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          {isAdopted && (
            <rect
              {...SVG_RECT_PROPS}
              style={{ width: 'calc(100% - 1.5px)', height: 'calc(100% - 1.5px)' }}
              stroke="#5DCAA5"
              strokeDasharray={dashArray}
              strokeDashoffset="0"
            />
          )}
          {isExile && (
            <rect
              {...SVG_RECT_PROPS}
              style={{ width: 'calc(100% - 1.5px)', height: 'calc(100% - 1.5px)' }}
              stroke="#D85A30"
              strokeDasharray={dashArray}
              strokeDashoffset={isAdopted ? '10' : '0'}
            />
          )}
        </svg>
      )}

      <Handle type="source" position={Position.Top}    id="top"    className={selected ? HANDLE_STYLE_SELECTED : HANDLE_STYLE} />
      <Handle type="source" position={Position.Left}   id="left"   className={selected ? HANDLE_STYLE_SELECTED : HANDLE_STYLE} />
      <Handle type="source" position={Position.Right}  id="right"  className={selected ? HANDLE_STYLE_SELECTED : HANDLE_STYLE} />
      <Handle type="source" position={Position.Bottom} id="bottom" className={selected ? HANDLE_STYLE_SELECTED : HANDLE_STYLE} />
      <Handle type="target" position={Position.Top} id="t" className="!w-px !h-px !min-w-0 !min-h-0 !bg-transparent !border-0 !opacity-0" isConnectable={false} />

      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            {isFounder && (
              <span className="flex-shrink-0 text-[10px] text-[#F5A623]">◆</span>
            )}
            {isBastard && (
              <span className="flex-shrink-0 h-[7px] w-[7px] rounded-full bg-[#EF9F27]" />
            )}
            <p
              className={`truncate text-sm font-semibold leading-tight ${
                isGhost
                  ? 'text-zinc-500 italic'
                  : isDeceased
                  ? 'text-zinc-400 line-through decoration-zinc-500'
                  : 'text-zinc-100'
              }`}
            >
              {isGhost ? 'Unknown' : data.name}
            </p>
            {data.gender === 'MALE' && (
              <span className="flex-shrink-0 text-[14px] leading-none text-[#4DA3FF]">♂</span>
            )}
            {data.gender === 'FEMALE' && (
              <span className="flex-shrink-0 text-[14px] leading-none text-[#FF6FA5]">♀</span>
            )}
            {data.gender === 'NON_BINARY' && (
              <span className="flex-shrink-0 text-[13px] leading-none text-[#C9A8FF]">⚧</span>
            )}
            {data.gender === 'UNKNOWN' && (
              <span className="flex-shrink-0 text-[12px] font-bold leading-none text-zinc-500">?</span>
            )}
            {isDeceased && (
              <Skull size={12} className="flex-shrink-0 text-zinc-300" />
            )}
          </div>

          {data.alias && (
            <p className="truncate text-[11px] italic text-zinc-400">&quot;{data.alias}&quot;</p>
          )}
        </div>

        {!data.isReadOnly && !isGhost && (
          <button
            onClick={(e) => { e.stopPropagation(); setEditingCharacterId(id); }}
            className="nodrag flex-shrink-0 rounded p-0.5 text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-300"
            title="Edit character"
          >
            <Pencil size={12} />
          </button>
        )}
      </div>

      {hasSubRow && (
        <div className="mt-1 flex flex-wrap items-center gap-x-1 text-[10px] text-zinc-500">
          {data.style && data.style !== 'OTHER' && (
            <span>{data.style.charAt(0) + data.style.slice(1).toLowerCase().replace(/_/g, ' ')}</span>
          )}
          {data.style && data.style !== 'OTHER' && statusLabels.length > 0 && (
            <span className="text-zinc-600">·</span>
          )}
          {statusLabels.map((s, i) => (
            <span key={s.label} className="flex items-center gap-x-1">
              {i > 0 && <span className="text-zinc-600">·</span>}
              <span style={{ color: s.color }}>{s.label}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

CharacterNode.displayName = 'CharacterNode';
