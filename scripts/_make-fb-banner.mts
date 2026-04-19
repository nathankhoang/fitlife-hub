// Generate a simple Facebook cover photo for the leanbodyengine Page.
// Outputs tmp-brand/lbe-fb-cover-1640x624.png (2x retina, 820x312 display).

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "tmp-brand");

const WIDTH = 1640;
const HEIGHT = 624;

async function loadFonts() {
  const fontsDir = path.join(ROOT, "assets", "fonts");
  const [bold, semibold] = await Promise.all([
    fs.readFile(path.join(fontsDir, "Geist-Bold.ttf")),
    fs.readFile(path.join(fontsDir, "Geist-SemiBold.ttf")),
  ]);
  return [
    { name: "Geist", data: bold, weight: 700 as const, style: "normal" as const },
    { name: "Geist", data: semibold, weight: 600 as const, style: "normal" as const },
  ];
}

function tree() {
  return {
    type: "div",
    props: {
      style: {
        width: WIDTH,
        height: HEIGHT,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: 48,
        paddingLeft: 140,
        paddingRight: 140,
        backgroundColor: "#0A0A0A",
        backgroundImage:
          "radial-gradient(circle at 15% 50%, rgba(16,185,129,0.22) 0%, rgba(10,10,10,0) 55%)",
        fontFamily: "Geist",
        color: "white",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 220,
              height: 220,
              borderRadius: 48,
              backgroundColor: "#059669",
              color: "white",
              fontSize: 100,
              fontWeight: 700,
              letterSpacing: -3,
              flexShrink: 0,
            },
            children: "LBE",
          },
        },
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column", gap: 18 },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    fontSize: 88,
                    fontWeight: 700,
                    letterSpacing: -2,
                    lineHeight: 1.0,
                    color: "white",
                  },
                  children: "LeanBodyEngine",
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    fontSize: 34,
                    fontWeight: 600,
                    lineHeight: 1.25,
                    color: "rgba(255,255,255,0.82)",
                    maxWidth: 900,
                  },
                  children: "Evidence-based fitness, nutrition & wellness — translated from the research.",
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    marginTop: 12,
                    fontSize: 26,
                    fontWeight: 600,
                    color: "rgba(16,185,129,0.9)",
                    letterSpacing: 1,
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

const fonts = await loadFonts();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const svg = await satori(tree() as any, { width: WIDTH, height: HEIGHT, fonts });
const png = new Resvg(svg, { background: "#0A0A0A" }).render().asPng();
await fs.mkdir(OUT, { recursive: true });
const outFile = path.join(OUT, "lbe-fb-cover-1640x624.png");
await sharp(png).png().toFile(outFile);
console.log(`wrote ${outFile}`);
