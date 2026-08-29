import { ImageResponse } from "next/og";
import { markSvg } from "@/lib/mark";

/**
 * The raster favicon. `app/icon.svg` is what a current browser actually uses;
 * this exists because Google Search wants a square icon that is a multiple of
 * 48px, and because both links have to show the SAME art — two `rel="icon"`
 * entries with different drawings means the tab is a coin toss.
 *
 * No background wrapper: unlike the crest, the mark carries its own tile.
 */
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// nodejs, not edge — next/og reads from disk, like the OG routes.
export const runtime = "nodejs";

export default function Icon() {
  const src = `data:image/svg+xml;base64,${Buffer.from(markSvg(512)).toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        {/* Satori takes arbitrary vector as an <img> data URI — see og-card. */}
        <img src={src} alt="" width={512} height={512} />
      </div>
    ),
    size,
  );
}
