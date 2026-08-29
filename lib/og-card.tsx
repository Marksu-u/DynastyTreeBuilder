import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { crestFromSeed, crestToSvg } from './crest';
import { markSvg } from './mark';
import { renderTreeSvg } from './og-tree';
import type { LayoutNodeIn, LayoutEdgeIn } from './genealogy-layout';

export const OG_SIZE = { width: 1200, height: 630 };

/** Mirrors --background in globals.css. Changing it re-grounds both images; the
 *  ?v= hash on share URLs makes platforms refetch the stale cached copies. */
const GROUND = '#0B0E1A';

/**
 * Geist arrives through `next/font/google`, so no font file exists on disk for
 * Satori to use — these two TTFs are vendored for that reason alone. Read once
 * per process, not per request: Discord and Twitter hit these routes hard.
 *
 * This is also why both image routes run on `nodejs` rather than `edge` — the
 * edge runtime has no `fs`.
 */
const fontDir = join(process.cwd(), 'public', 'fonts');
const FONTS = [
  {
    name: 'Geist',
    data: readFileSync(join(fontDir, 'Geist-Regular.ttf')),
    weight: 400 as const,
    style: 'normal' as const,
  },
  {
    name: 'Geist',
    data: readFileSync(join(fontDir, 'Geist-SemiBold.ttf')),
    weight: 600 as const,
    style: 'normal' as const,
  },
];

/** Satori's reliable path for arbitrary vector is an <img> with a data URI. */
function dataUri(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

export interface OgCardInput {
  houseName: string;
  meta: string;
  /**
   * The dynasty's own arms. Omit on the product's own cards, where there is no
   * house to represent and the emblem slot belongs to the brand mark instead —
   * a share card must keep showing the crest its owner chose.
   */
  crestSeed?: string;
  nodes: LayoutNodeIn[];
  edges: LayoutEdgeIn[];
  founderIds: string[];
}

/**
 * Dynasty names have no length cap in `DynastySettingsSchema`, and at a fixed
 * 66px a long one overflows the left column and collides with the meta line and
 * the wordmark. Step the size down, then hard-truncate as a backstop.
 */
function fitHouseName(name: string): { text: string; fontSize: number } {
  const text = name.length > 58 ? `${name.slice(0, 57).trimEnd()}…` : name;
  const fontSize =
    text.length > 40 ? 34 : text.length > 28 ? 44 : text.length > 18 ? 54 : 66;
  return { text, fontSize };
}

export function renderOgCard(input: OgCardInput): ImageResponse {
  // A crest is a shield (taller than wide); the mark is square. The column
  // centres itself, so the emblem carries its own height rather than being
  // letterboxed into the other one's box.
  const emblem = input.crestSeed
    ? { src: dataUri(crestToSvg(crestFromSeed(input.crestSeed), 130)), height: 156 }
    : { src: dataUri(markSvg(130)), height: 130 };
  const houseName = fitHouseName(input.houseName);
  const tree = dataUri(
    renderTreeSvg(input.nodes, input.edges, input.founderIds, { width: 600, height: 470 }),
  );

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: GROUND }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            width: 540,
            padding: '0 0 0 90px',
          }}
        >
          <img src={emblem.src} width={130} height={emblem.height} alt="" />
          <div
            style={{
              fontSize: houseName.fontSize,
              fontWeight: 600,
              color: '#F4F4F5',
              marginTop: 34,
              lineHeight: 1.1,
            }}
          >
            {houseName.text}
          </div>
          <div style={{ fontSize: 27, color: '#a1a1aa', marginTop: 14 }}>{input.meta}</div>
          <div style={{ width: 110, height: 2, background: '#EF9F27', marginTop: 46 }} />
          <div style={{ fontSize: 21, color: '#EF9F27', marginTop: 22, letterSpacing: 4 }}>
            DYNASTY TREE BUILDER
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <img src={tree} width={600} height={470} alt="" />
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: FONTS },
  );
}

/**
 * Fallback for private, missing or empty dynasties. A separate code path from
 * the share page's `notFound()` on purpose — this route must never render a
 * private dynasty's structure into an image anyone can fetch.
 */
export function renderBrandCard(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: GROUND,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img src={dataUri(markSvg(112))} width={112} height={112} alt="" />
        <div style={{ fontSize: 72, fontWeight: 600, color: '#F4F4F5', marginTop: 30 }}>
          Dynasty Tree Builder
        </div>
        <div style={{ fontSize: 30, color: '#a1a1aa', marginTop: 18 }}>
          Family trees for D&amp;D and TTRPG campaigns
        </div>
        <div style={{ width: 140, height: 2, background: '#EF9F27', marginTop: 40 }} />
      </div>
    ),
    { ...OG_SIZE, fonts: FONTS },
  );
}
