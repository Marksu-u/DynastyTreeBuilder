import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Dynasty Tree Builder";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          backgroundColor: "#f5f4f0",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 100px",
        }}
      >
        {/* Left: text */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            maxWidth: 560,
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: "#2c2c2a",
              lineHeight: 1.1,
            }}
          >
            Dynasty Tree Builder
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#5f5e5a",
              lineHeight: 1.4,
            }}
          >
            Build dynasty trees for your TTRPG campaigns
          </div>
        </div>

        {/* Right: three-node diagram */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
            position: "relative",
          }}
        >
          {/* Top node */}
          <div
            style={{
              display: "flex",
              backgroundColor: "#EEEDFE",
              border: "2px solid #534AB7",
              borderRadius: 12,
              padding: "14px 28px",
              fontSize: 20,
              fontWeight: 600,
              color: "#3C3489",
            }}
          >
            Founder
          </div>
          {/* Two child nodes */}
          <div style={{ display: "flex", gap: 32 }}>
            <div
              style={{
                display: "flex",
                backgroundColor: "#E1F5EE",
                border: "2px solid #0F6E56",
                borderRadius: 12,
                padding: "14px 24px",
                fontSize: 20,
                fontWeight: 600,
                color: "#085041",
              }}
            >
              Heir
            </div>
            <div
              style={{
                display: "flex",
                backgroundColor: "#FAECE7",
                border: "2px solid #993C1D",
                borderRadius: 12,
                padding: "14px 24px",
                fontSize: 20,
                fontWeight: 600,
                color: "#712B13",
              }}
            >
              Rival
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
