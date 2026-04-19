// Uploads brand assets from tmp-brand/ to Vercel Blob and prints public URLs
// so the user can download them to wherever they need (e.g. their phone for
// Instagram).

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { put } from "@vercel/blob";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.loadEnvFile(path.join(ROOT, ".env.local"));

const BRAND = path.join(ROOT, "tmp-brand");
const files = ["lbe-profile-1024.png", "lbe-profile-400.png", "lbe-fb-cover-1640x624.png"];

for (const name of files) {
  const p = path.join(BRAND, name);
  try {
    const buf = await fs.readFile(p);
    const uploaded = await put(`brand/${name}`, buf, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "image/png",
    });
    console.log(`${name}  →  ${uploaded.url}`);
  } catch (err) {
    console.log(`${name}  →  SKIP (${(err as Error).message})`);
  }
}
