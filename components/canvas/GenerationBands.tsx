// components/canvas/GenerationBands.tsx
"use client";

import { memo, useMemo } from 'react';
import { ViewportPortal } from '@xyflow/react';
import { CARD_H, CARD_W, ROW_HEIGHT, type GenerationRow } from '@/lib/genealogy-layout';
import { crestFromSeed, crestToSvg } from '@/lib/crest';
import type { AnyCanvasNode } from '@/store/canvas';

const BAND_PAD_X = 400;   // band extends this far beyond the tree bounds
const BAND_PAD_Y = 48;    // vertical padding around the card row
const LABEL_GUTTER = 96;

function toRoman(n: number): string {
  const table: [number, string][] = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let out = ''; let rest = n;
  for (const [v, s] of table) while (rest >= v) { out += s; rest -= v; }
  return out || 'I';
}

interface Props {
  rows: GenerationRow[];
  nodes: AnyCanvasNode[];       // laid-out nodes (for bounds)
  houseName?: string;
  /** When set, the house's arms replace the plain diamond ornaments. */
  crestSeed?: string;
}

/**
 * Viewport-synced background chrome: alternating generation bands with
 * Roman-numeral labels, plus the house-name header above generation I.
 */
export const GenerationBands = memo(({ rows, nodes, houseName, crestSeed }: Props) => {
  const bounds = useMemo(() => {
    const chars = nodes.filter(n => n.type === 'character');
    if (chars.length === 0) return null;
    const xs = chars.map(n => n.position.x);
    return { minX: Math.min(...xs), maxX: Math.max(...xs) + CARD_W };
  }, [nodes]);

  const crest = useMemo(
    () => (crestSeed ? crestToSvg(crestFromSeed(crestSeed), 28) : null),
    [crestSeed],
  );

  if (!bounds || rows.length === 0) return null;

  const left = bounds.minX - BAND_PAD_X;
  const width = bounds.maxX - bounds.minX + 2 * BAND_PAD_X;

  return (
    <ViewportPortal>
      {rows.map(row => (
        <div
          key={row.index}
          className={row.index % 2 === 0 ? 'bg-zinc-900/40' : 'bg-transparent'}
          style={{
            position: 'absolute',
            left, width,
            top: row.y - BAND_PAD_Y,
            height: ROW_HEIGHT,
            zIndex: -1,
            pointerEvents: 'none',
          }}
        >
          <span
            className="absolute text-[11px] font-medium uppercase tracking-widest text-zinc-600"
            style={{ left: BAND_PAD_X - LABEL_GUTTER, top: BAND_PAD_Y + CARD_H / 2 - 8 }}
          >
            Gen {toRoman(row.index + 1)}
          </span>
        </div>
      ))}

      {houseName && (
        <div
          style={{
            position: 'absolute',
            left: bounds.minX,
            width: bounds.maxX - bounds.minX,
            top: rows[0].y - BAND_PAD_Y - 72,
            zIndex: -1,
            pointerEvents: 'none',
          }}
          className="flex items-center justify-center gap-3"
        >
          {/* This plate lives in the ViewportPortal, so it is captured by
              exportCanvasToPng — which is how the crest reaches the PNG
              without lib/export.ts knowing anything about heraldry. */}
          {crest ? (
            <span
              aria-hidden="true"
              style={{ display: 'inline-block', lineHeight: 0 }}
              dangerouslySetInnerHTML={{ __html: crest }}
            />
          ) : (
            <span className="text-accent">◆</span>
          )}
          <span className="text-xl font-semibold tracking-wide text-zinc-200">{houseName}</span>
          {!crest && <span className="text-accent">◆</span>}
        </div>
      )}
    </ViewportPortal>
  );
});

GenerationBands.displayName = 'GenerationBands';
