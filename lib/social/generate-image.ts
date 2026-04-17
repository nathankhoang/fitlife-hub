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

export type GenerateImageInput = {
  /** Article title — rendered as the main headline */
  title: string;
  /** Category label shown as eyebrow text (e.g., "Supplement Reviews") */
  categoryLabel: string;
  /** Hero image — either a local file path or a remote URL */
  heroImage: string;
  platform: Platform;
};

type FontData = Awaited<ReturnType<typeof loadFonts>>[number];

let cachedFonts: FontData[] | null = null;

async function loadFonts() {
  if (cachedFonts) return cachedFonts;
  const root = process.cwd();
  const fontsDir = path.join(root, "assets", "fonts");
  const [bold, semibold] = await Promise.all([
    fs.readFile(path.join(fontsDir, "Geist-Bold.ttf")),
    fs.readFile(path.join(fontsDir, "Geist-SemiBold.ttf")),
  ]);
  cachedFonts = [
    { name: "Geist", data: bold, weight: 700 as const, style: "normal" as const },
    { name: "Geist", data: semibold, weight: 600 as const, style: "normal" as const },
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

export async function generateSocialImage(input: GenerateImageInput): Promise<Buffer> {
  const spec = STRATEGIES[input.platform].image;
  const fonts = await loadFonts();

  // satori works with a React-like tree; the `any` keeps it light-weight here.
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

  return sharp(hero).composite([{ input: overlayPng, top: 0, left: 0 }]).webp({ quality: 85 }).toBuffer();
}
