"use client";

import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { Pencil, Skull, Plus } from 'lucide-react';
import { useCanvasStore } from '@/store/canvas';
import { useCanvasContext } from './CanvasContext';
import { useHighlight, tierStyle } from './HighlightContext';
import { fitFontSize } from '@/lib/fit-text';
import type { CharacterData } from '@/types/canvas';

type CharacterNodeType = Node<CharacterData, 'character'>;

// Handles are purely structural anchors for edge routing now — connections
// are made via the contextual add-relative buttons, not drag-connect — so
// all handles are invisible and non-connectable.
const HANDLE_STYLE = '!w-px !h-px !min-w-0 !min-h-0 !bg-transparent !border-0 !opacity-0';

// Rect inset by half-stroke so the stroke sits exactly on the card edge.
// rx matches rounded-lg (8px) minus the inset (0.75px).
const SVG_RECT_PROPS = {
  x: 0.75, y: 0.75, rx: 7.25, ry: 7.25,
  fill: 'none', strokeWidth: 1.5,
} as const;

// The card is 180px with px-3 either side, and the edit pencil takes the right
// edge of the header row — leaving this much for text. Measured on the live
// canvas rather than derived, so keep it in step if the padding changes.
const TEXT_COL_W = 134;
const NAME_MAX_LINES = 2;

export const CharacterNode = memo(({ id, data, selected }: NodeProps<CharacterNodeType>) => {
  const canvasCtx = useCanvasContext();
  const setEditingCharacterIdStore = useCanvasStore((s) => s.setEditingCharacterId);
  const setEditingCharacterId = canvasCtx ? canvasCtx.setEditingCharacterId : setEditingCharacterIdStore;
  const openAddRelative = canvasCtx?.openAddRelative;
  const flags = data.flags ?? [];
  const { chars } = useHighlight();
  const hl = tierStyle(chars?.get(id), chars !== null);

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
    isAdopted && { label: 'Adopted', color: 'var(--success)' },
    isExile   && { label: 'Exiled',  color: 'var(--warning)' },
  ].filter(Boolean) as { label: string; color: string }[];

  const hasSubRow = (data.style && data.style !== 'OTHER') || statusLabels.length > 0;

  const displayName = isGhost ? 'Unknown' : data.name;
  const nameSize = fitFontSize(displayName, {
    maxWidth: TEXT_COL_W,
    maxLines: NAME_MAX_LINES,
  });

  return (
    <div
      className={[
        'character-node relative flex h-[128px] w-[180px] flex-col justify-center rounded-lg bg-zinc-800/95 px-3 py-3 shadow-lg transition-colors duration-100',
        // Selection is chrome, not semantics, so it stays hue-neutral. It used
        // to be blue-400, which sits 9.7° from the ancestor tint (#5AA9E6) at
        // the same lightness — two indistinguishable blue card borders meaning
        // "selected" and "ancestor of the hovered person". White collides with
        // nothing in the canvas vocabulary and reads brighter than all of it.
        selected
          ? 'border border-zinc-100 ring-2 ring-zinc-100/20'
          : hasSvgBorder || hl.tint
          ? ''
          : isFounder
          ? 'border border-[#EF9F27]/50 hover:border-[#EF9F27]/80'
          : 'border border-zinc-700 hover:border-zinc-600',
      ].join(' ')}
      style={{
        ...(isGhost ? { filter: 'grayscale(1)' } : {}),
        opacity: isGhost ? 0.4 : hl.opacity,
        // A tinted border marks direction (ancestors cool, descendants teal,
        // the hovered card gold). It replaces the resting border rather than
        // stacking with it, so the card never gains a second outline — except
        // on flag cards, which keep their SVG dashed border underneath.
        ...(hl.tint && !selected
          ? { border: `1px solid ${hl.tint}`, boxShadow: `0 0 0 1px ${hl.tint}33` }
          : {}),
        transition: 'opacity 120ms, border-color 120ms, box-shadow 120ms',
      }}
    >
      {/* SVG dashed border — follows border-radius on all four sides */}
      {hasSvgBorder && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          {isAdopted && (
            <rect
              {...SVG_RECT_PROPS}
              // stroke goes in `style`, not the presentation attribute: html-to-image
              // serialises computed styles, which resolve var(), whereas a var() in a
              // presentation attribute is the kind of thing that fails to no stroke
              // at all rather than to a wrong colour.
              style={{ width: 'calc(100% - 1.5px)', height: 'calc(100% - 1.5px)', stroke: 'var(--success)' }}
              strokeDasharray={dashArray}
              strokeDashoffset="0"
            />
          )}
          {isExile && (
            <rect
              {...SVG_RECT_PROPS}
              style={{ width: 'calc(100% - 1.5px)', height: 'calc(100% - 1.5px)', stroke: 'var(--warning)' }}
              strokeDasharray={dashArray}
              strokeDashoffset={isAdopted ? '10' : '0'}
            />
          )}
        </svg>
      )}

      <Handle type="source" position={Position.Top}    id="top"    className={HANDLE_STYLE} isConnectable={false} />
      <Handle type="source" position={Position.Left}   id="left"   className={HANDLE_STYLE} isConnectable={false} />
      <Handle type="source" position={Position.Right}  id="right"  className={HANDLE_STYLE} isConnectable={false} />
      <Handle type="source" position={Position.Bottom} id="bottom" className={HANDLE_STYLE} isConnectable={false} />
      <Handle type="target" position={Position.Top} id="t" className="!w-px !h-px !min-w-0 !min-h-0 !bg-transparent !border-0 !opacity-0" isConnectable={false} />

      {selected && openAddRelative && !data.isReadOnly && !isGhost && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); openAddRelative(id, 'parent'); }}
            className="nodrag absolute -top-3.5 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-accent/60 bg-zinc-900 text-accent shadow hover:bg-accent hover:text-zinc-900"
            title="Add parent"
          ><Plus size={12} /></button>
          <button
            onClick={(e) => { e.stopPropagation(); openAddRelative(id, 'partner'); }}
            className="nodrag absolute -right-3.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-accent/60 bg-zinc-900 text-accent shadow hover:bg-accent hover:text-zinc-900"
            title="Add partner"
          ><Plus size={12} /></button>
          <button
            onClick={(e) => { e.stopPropagation(); openAddRelative(id, 'child'); }}
            className="nodrag absolute -bottom-3.5 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-accent/60 bg-zinc-900 text-accent shadow hover:bg-accent hover:text-zinc-900"
            title="Add child"
          ><Plus size={12} /></button>
        </>
      )}

      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          {/* The glyphs are inline, not flex siblings: as siblings they narrowed
              every line of a wrapped name, and by a different amount per card.
              Inline they only occupy the tail of the last line. */}
          <p
            className={`line-clamp-2 font-semibold leading-tight [overflow-wrap:anywhere] ${
              isGhost
                ? 'text-zinc-500 italic'
                : hl.tint
                ? ''
                : 'text-zinc-100'
            }`}
            style={{
              fontSize: `${nameSize}px`,
              ...(!isGhost && hl.tint ? { color: hl.tint } : {}),
            }}
          >
            {isFounder && (
              <span className="mr-1 text-[10px] text-[#F5A623]">◆</span>
            )}
            {isBastard && (
              <span className="mr-1 inline-block h-[7px] w-[7px] rounded-full bg-[#EF9F27] align-middle" />
            )}
            {displayName}
            {data.gender === 'MALE' && (
              <span className="ml-1 text-[14px] leading-none text-[#4DA3FF]">♂</span>
            )}
            {data.gender === 'FEMALE' && (
              <span className="ml-1 text-[14px] leading-none text-[#FF6FA5]">♀</span>
            )}
            {data.gender === 'NON_BINARY' && (
              <span className="ml-1 text-[13px] leading-none text-[#C9A8FF]">⚧</span>
            )}
            {data.gender === 'UNKNOWN' && (
              <span className="ml-1 text-[12px] font-bold leading-none text-zinc-500">?</span>
            )}
            {isDeceased && (
              <Skull size={12} className="ml-1 inline align-middle text-zinc-300" />
            )}
          </p>

          {data.alias && (
            <p className="line-clamp-2 text-[11px] italic text-zinc-400 [overflow-wrap:anywhere]">
              &quot;{data.alias}&quot;
            </p>
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
