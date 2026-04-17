import { ImageResponse } from "next/og";

export const alt = "LeanBodyEngine — Fitness, Health & Wellness";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 55%, #262626 100%)",
          color: "#FAFAFA",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "#A3A3A3",
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              background: "#22C55E",
              borderRadius: 999,
              marginRight: 14,
            }}
          />
          leanbodyengine.com
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 96,
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              color: "#FFFFFF",
            }}
          >
            LeanBodyEngine
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 40,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
              color: "#D4D4D4",
              maxWidth: 960,
            }}
          >
            Evidence-first fitness, supplements, diet, and wellness.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
