// Renders a per-platform social image by compositing a satori-rendered
// overlay (title + LBE monogram + category chip + domain) on top of the
// article's hero image, resized to the platform's required dimensions.
//
// Used by both the runtime social pipeline and by scripts/preview-social-images.mjs.

import fs from "node:fs/promises";
import path from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
import { STRATEGIES, type Platform, type ImageSpec } from "./strategies";

export type ImageVariant = "hero-photo" | "stat-callout";

export type GenerateImageInput = {
  /** Article title — rendered as the main headline */
  title: string;
  /** Category label shown as eyebrow text (e.g., "Supplement Reviews") */
  categoryLabel: string;
  /** Hero image — required for variant "hero-photo"; ignored for "stat-callout" */
  heroImage?: string;
  /** For variant "stat-callout": the big number, e.g. "~15%", "3–5 g" */
  statValue?: string;
  /** For variant "stat-callout": short context line, e.g. "more training volume" */
  statContext?: string;
  platform: Platform;
  /** Visual template. Defaults to "hero-photo" for back-compat. */
  variant?: ImageVariant;
};

type FontData = {
  name: string;
  data: Buffer;
  weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  style: "normal" | "italic";
};

let cachedFonts: FontData[] | null = null;

async function loadFonts(): Promise<FontData[]> {
  if (cachedFonts) return cachedFonts;
  const root = process.cwd();
  const fontsDir = path.join(root, "assets", "fonts");
  const [bold, semibold] = await Promise.all([
    fs.readFile(path.join(fontsDir, "Geist-Bold.ttf")),
    fs.readFile(path.join(fontsDir, "Geist-SemiBold.ttf")),
  ]);
  cachedFonts = [
    { name: "Geist", data: bold, weight: 700, style: "normal" },
    { name: "Geist", data: semibold, weight: 600, style: "normal" },
  ];
  return cachedFonts;
}

async function readHero(heroImage: string): Promise<Buffer> {
  if (/^https?:\/\//.test(heroImage)) {
    const res = await fetch(heroImage);
    if (!res.ok) throw new Error(`hero fetch failed: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  return fs.readFile(heroImage);
}

function overlayTree(
  { title, categoryLabel }: { title: string; categoryLabel: string },
  spec: ImageSpec,
) {
  const { width, height, padding, titleSize, eyebrowSize, urlSize, monogramSize, monogramFont } = spec;
  return {
    type: "div",
    props: {
      style: {
        width,
        height,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        fontFamily: "Geist",
        color: "white",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              padding: `${padding}px ${padding}px 0 ${padding}px`,
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    backgroundColor: "rgba(0,0,0,0.55)",
                    color: "#10B981",
                    fontSize: eyebrowSize,
                    fontWeight: 700,
                    letterSpacing: 3,
                    textTransform: "uppercase",
                    padding: "10px 16px",
                    borderRadius: 999,
                  },
                  children: categoryLabel,
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    width: monogramSize,
                    height: monogramSize,
                    backgroundColor: "#059669",
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: monogramFont,
                    fontWeight: 700,
                    letterSpacing: -0.5,
                  },
                  children: "LBE",
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              padding: `${Math.round(padding * 1.6)}px ${padding}px ${padding}px ${padding}px`,
              backgroundImage:
                "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0) 100%)",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    fontSize: titleSize,
                    fontWeight: 700,
                    lineHeight: 1.05,
                    letterSpacing: -1.5,
                    marginBottom: Math.round(titleSize * 0.35),
                    color: "white",
                  },
                  children: title,
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    fontSize: urlSize,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.7)",
                    letterSpacing: 0.5,
                  },
                  children: "leanbodyengine.com",
                },
              },
            ],
          },
        },
      ],
    },
  };
}

/**
 * Stat-callout layout: no hero photo, big number centered on a near-black
 * background. Research shows peer brands in the evidence-based fitness
 * niche have largely moved to typography-forward templates like this.
 */
function statCalloutTree(
  {
    title,
    categoryLabel,
    statValue,
    statContext,
  }: { title: string; categoryLabel: string; statValue: string; statContext: string },
  spec: ImageSpec,
) {
  const { width, height, padding, eyebrowSize, urlSize, monogramSize, monogramFont } = spec;
  // Scale the stat value to take up a dominant chunk of the canvas.
  const isPortrait = spec.orientation === "portrait";
  const statSize = isPortrait ? 240 : 200;
  const contextSize = isPortrait ? 36 : 32;
  const titleSize = isPortrait ? 40 : 32;

  return {
    type: "div",
    props: {
      style: {
        width,
        height,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#0A0A0A",
        backgroundImage:
          "radial-gradient(circle at 30% 20%, rgba(16,185,129,0.22) 0%, rgba(10,10,10,0) 55%)",
        fontFamily: "Geist",
        color: "white",
        padding: `${padding}px`,
      },
      children: [
        // Top row: category pill + LBE monogram
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    backgroundColor: "rgba(16,185,129,0.15)",
                    color: "#10B981",
                    fontSize: eyebrowSize,
                    fontWeight: 700,
                    letterSpacing: 3,
                    textTransform: "uppercase",
                    padding: "10px 16px",
                    borderRadius: 999,
                  },
                  children: categoryLabel,
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    width: monogramSize,
                    height: monogramSize,
                    backgroundColor: "#059669",
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: monogramFont,
                    fontWeight: 700,
                    letterSpacing: -0.5,
                  },
                  children: "LBE",
                },
              },
            ],
          },
        },
        // Center block: big stat + context
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "center",
              flex: 1,
              paddingTop: Math.round(padding * 0.5),
              paddingBottom: Math.round(padding * 0.5),
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    fontSize: statSize,
                    fontWeight: 700,
                    lineHeight: 1.0,
                    letterSpacing: -4,
                    color: "#10B981",
                  },
                  children: statValue,
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    fontSize: contextSize,
                    fontWeight: 600,
                    lineHeight: 1.3,
                    marginTop: Math.round(statSize * 0.08),
                    color: "rgba(255,255,255,0.9)",
                    maxWidth: width - padding * 2,
                  },
                  children: statContext,
                },
              },
            ],
          },
        },
        // Bottom: article title (small, dim) + url
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              borderTopWidth: 1,
              borderTopStyle: "solid",
              borderTopColor: "rgba(255,255,255,0.12)",
              paddingTop: Math.round(padding * 0.5),
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    fontSize: titleSize,
                    fontWeight: 600,
                    lineHeight: 1.2,
                    letterSpacing: -0.5,
                    color: "rgba(255,255,255,0.8)",
                    marginBottom: 10,
                  },
                  children: title,
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    fontSize: urlSize,
                    fontWeight: 600,
                    color: "rgba(16,185,129,0.8)",
                    letterSpacing: 0.5,
                  },
                  children: "leanbodyengine.com",
                },
              },
            ],
          },
        },
      ],
    },
  };
}

async function renderHeroPhoto(input: GenerateImageInput, spec: ImageSpec, fonts: FontData[]): Promise<Buffer> {
  if (!input.heroImage) throw new Error("generateSocialImage: heroImage is required for variant=hero-photo");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svg = await satori(overlayTree({ title: input.title, categoryLabel: input.categoryLabel }, spec) as any, {
    width: spec.width,
    height: spec.height,
    fonts,
  });
  const overlayPng = new Resvg(svg, { background: "rgba(0,0,0,0)" }).render().asPng();

  const heroBuf = await readHero(input.heroImage);
  const hero = await sharp(heroBuf)
    .resize(spec.width, spec.height, { fit: "cover", position: "attention" })
    .toFormat("png")
    .toBuffer();

  return sharp(hero).composite([{ input: overlayPng, top: 0, left: 0 }]).jpeg({ quality: 88 }).toBuffer();
}

async function renderStatCallout(input: GenerateImageInput, spec: ImageSpec, fonts: FontData[]): Promise<Buffer> {
  if (!input.statValue || !input.statContext) {
    throw new Error("generateSocialImage: statValue and statContext are required for variant=stat-callout");
  }
  const tree = statCalloutTree(
    {
      title: input.title,
      categoryLabel: input.categoryLabel,
      statValue: input.statValue,
      statContext: input.statContext,
    },
    spec,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as any;
  const svg = await satori(tree, { width: spec.width, height: spec.height, fonts });
  const png = new Resvg(svg, { background: "#0A0A0A" }).render().asPng();
  return sharp(png).jpeg({ quality: 88 }).toBuffer();
}

export async function generateSocialImage(input: GenerateImageInput): Promise<Buffer> {
  const spec = STRATEGIES[input.platform].image;
  const fonts = await loadFonts();
  const variant = input.variant ?? "hero-photo";
  return variant === "stat-callout"
    ? renderStatCallout(input, spec, fonts)
    : renderHeroPhoto(input, spec, fonts);
}
