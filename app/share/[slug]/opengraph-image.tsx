import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

// Node runtime: the card is built from a Prisma query, which the edge runtime
// cannot run. Matches the page's own revalidation window.
export const revalidate = 60;
export const alt = "Dynasty tree on Dynasty Tree Builder";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SETTING_LABELS: Record<string, string> = {
  FANTASY: "Fantasy",
  SCI_FI: "Sci-Fi",
  HISTORICAL: "Historical",
  MODERN: "Modern",
  HORROR: "Horror",
  OTHER: "Other",
};

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let dynasty: {
    name: string;
    setting: string;
    isPublic: boolean;
    _count: { characters: number; relationships: number };
  } | null = null;

  try {
    dynasty = await prisma.dynasty.findUnique({
      where: { slug },
      select: {
        name: true,
        setting: true,
        isPublic: true,
        _count: { select: { characters: true, relationships: true } },
      },
    });
  } catch (error) {
    console.warn("share og: failed to load dynasty, falling back to generic card", error);
  }

  const isVisible = Boolean(dynasty?.isPublic);
  const name = isVisible ? dynasty!.name : "Dynasty Tree Builder";
  const setting = isVisible
    ? SETTING_LABELS[dynasty!.setting] ?? dynasty!.setting
    : null;
  const characters = isVisible ? dynasty!._count.characters : 0;
  const relationships = isVisible ? dynasty!._count.relationships : 0;

  // Long dynasty names need to stay on one or two lines at 1200×630.
  const nameSize = name.length > 34 ? 56 : name.length > 22 ? 68 : 84;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#f5f4f0",
          padding: "72px 88px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {setting ? (
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                backgroundColor: "#EEEDFE",
                border: "2px solid #534AB7",
                borderRadius: 999,
                padding: "8px 22px",
                fontSize: 24,
                fontWeight: 600,
                color: "#3C3489",
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              {setting}
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              fontSize: nameSize,
              fontWeight: 700,
              color: "#2c2c2a",
              lineHeight: 1.1,
              maxWidth: 1000,
            }}
          >
            {name}
          </div>

          {isVisible ? (
            <div
              style={{
                display: "flex",
                gap: 40,
                fontSize: 30,
                color: "#5f5e5a",
              }}
            >
              <div style={{ display: "flex" }}>
                {characters} {characters === 1 ? "character" : "characters"}
              </div>
              <div style={{ display: "flex" }}>
                {relationships} {relationships === 1 ? "relationship" : "relationships"}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", fontSize: 30, color: "#5f5e5a" }}>
              Build dynasty trees for your TTRPG campaigns
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 26,
            fontWeight: 600,
            color: "#5f5e5a",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 14,
              height: 14,
              borderRadius: 4,
              backgroundColor: "#534AB7",
            }}
          />
          <div style={{ display: "flex" }}>Dynasty Tree Builder</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
