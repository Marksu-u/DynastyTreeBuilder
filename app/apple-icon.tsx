import { ImageResponse } from "next/og";
import { markSvg, MARK_TILE } from "@/lib/mark";

/**
 * The home-screen icon. iOS masks it to its own squircle, so the tile is
 * full-bleed here rather than rounded — our corners would otherwise be cut
 * twice — and the glyph is inset to keep its points clear of that mask.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const runtime = "nodejs";

// Full-bleed: the glyph already carries ~15% padding inside its own 32-unit
// grid, so scaling it to the full tile gives the home screen exactly the
// proportions of the favicon. Its extremes sit at the edge midpoints, which
// is the part of the square iOS's squircle does not cut.
const GLYPH = 180;

export default function AppleIcon() {
  const src = `data:image/svg+xml;base64,${Buffer.from(
    markSvg(GLYPH, { tile: false }),
  ).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: MARK_TILE,
        }}
      >
        {/* Satori takes arbitrary vector as an <img> data URI — see og-card. */}
        <img src={src} alt="" width={GLYPH} height={GLYPH} />
      </div>
    ),
    size,
  );
}
