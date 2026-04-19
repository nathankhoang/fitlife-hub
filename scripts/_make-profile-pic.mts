// Generate a 400x400 LBE profile picture using the same Satori/Resvg/Sharp
// pipeline already used for social images. Output: tmp-brand/lbe-profile-400.png
// and tmp-brand/lbe-profile-1024.png (for platforms that prefer larger).

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "tmp-brand");

async function loadFonts() {
  const fontsDir = path.join(ROOT, "assets", "fonts");
  const [bold] = await Promise.all([fs.readFile(path.join(fontsDir, "Geist-Bold.ttf"))]);
  return [{ name: "Geist", data: bold, weight: 700 as const, style: "normal" as const }];
}

function tree(size: number) {
  // Dark background with a green radial glow — matches the FB banner treatment.
  // Big bright-green "LBE" wordmark centered. No rounded corners since IG/FB
  // round-crop avatars anyway.
  const fontSize = Math.round(size * 0.34);
  return {
    type: "div",
    props: {
      style: {
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0A0A0A",
        backgroundImage:
          "radial-gradient(circle at 50% 50%, rgba(16,185,129,0.28) 0%, rgba(10,10,10,0) 60%)",
        fontFamily: "Geist",
        color: "#10B981",
        fontWeight: 700,
        fontSize,
        letterSpacing: -fontSize * 0.04,
      },
      children: "LBE",
    },
  };
}

async function renderAt(size: number, basename: string) {
  const fonts = await loadFonts();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svg = await satori(tree(size) as any, { width: size, height: size, fonts });
  // Opaque dark background to preserve the glow across platforms that don't
  // keep transparency on avatar uploads.
  const png = new Resvg(svg, { background: "#0A0A0A" }).render().asPng();
  await fs.mkdir(OUT, { recursive: true });
  const outFile = path.join(OUT, `${basename}.png`);
  await sharp(png).png().toFile(outFile);
  console.log(`wrote ${outFile}`);
}

await renderAt(400, "lbe-profile-400");
await renderAt(1024, "lbe-profile-1024");
