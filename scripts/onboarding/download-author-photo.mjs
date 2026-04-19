#!/usr/bin/env node
/**
 * download-author-photo.mjs
 *
 * Downloads the headshot from the Google Drive / Dropbox / direct-HTTPS link
 * in client.config.json._operator.headshotSourceUrl, resizes to a 600×600
 * webp, and saves to the path already declared in client.config.json
 * author.photoUrl (typically public/images/author/<slug>.webp).
 *
 * Supports:
 *   - Google Drive share links  (https://drive.google.com/file/d/ID/view...)
 *   - Dropbox share links        (?dl=0 auto-rewritten to ?dl=1)
 *   - Any direct image URL
 *
 * Usage:
 *   node scripts/onboarding/download-author-photo.mjs
 */

import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import sharp from "sharp";
import { assertNotTemplateRepo } from "../_template-guard.mjs";

const root = path.resolve(
  path.dirname(url.fileURLToPath(import.meta.url)),
  "..",
  "..",
);
const CONFIG_PATH = path.join(root, "client.config.json");

assertNotTemplateRepo({
  cwd: root,
  argv: process.argv,
  scriptName: "download-author-photo",
});

function fail(msg) {
  console.error(`\u2717 ${msg}`);
  process.exit(1);
}
function ok(msg) {
  console.log(`\u2713 ${msg}`);
}
function info(msg) {
  console.log(`  ${msg}`);
}

if (!fs.existsSync(CONFIG_PATH)) fail(`Missing ${CONFIG_PATH}`);
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));

const source = config?._operator?.headshotSourceUrl?.trim();
const targetRel = config?.author?.photoUrl;

if (!source) {
  ok("No headshot URL on the form — nothing to download. AuthorCard will use the monogram fallback.");
  process.exit(0);
}
if (!targetRel) {
  fail(
    "client.config.json.author.photoUrl is null — re-run the exporter after the client adds a headshot link, or set photoUrl manually first.",
  );
}

const targetAbs = path.join(root, "public", targetRel.replace(/^\//, ""));

// --- Resolve direct-download URL ---

function normalize(rawUrl) {
  // Google Drive share links → direct download
  // https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // https://drive.google.com/open?id=FILE_ID
  const gDriveMatch =
    rawUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    rawUrl.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (gDriveMatch) {
    return `https://drive.google.com/uc?export=download&id=${gDriveMatch[1]}`;
  }
  // Dropbox share links: ensure ?dl=1
  if (/dropbox\.com/.test(rawUrl)) {
    return rawUrl.replace(/\?dl=0$/, "?dl=1").replace(/&dl=0$/, "&dl=1");
  }
  return rawUrl;
}

const downloadUrl = normalize(source);

// --- Download ---

info(`Source:  ${source}`);
info(`Download: ${downloadUrl}`);
info(`Target:  ${path.relative(root, targetAbs)}`);

const res = await fetch(downloadUrl, { redirect: "follow" });
if (!res.ok) {
  fail(
    `Download failed with HTTP ${res.status}. If the link is private, make it public-shareable in Drive/Dropbox and rerun.`,
  );
}
const contentType = res.headers.get("content-type") ?? "";
if (!/image|octet-stream/i.test(contentType) && !contentType.startsWith("application/")) {
  // Google Drive sometimes returns HTML (the virus-scan interstitial) for
  // big files. Surface that clearly.
  fail(
    `Download returned ${contentType || "unknown content-type"}, not an image. ` +
      `For Drive links this usually means the file is too big for direct download or the share permission is wrong. ` +
      `Open the Drive link in a browser, download manually, and save to ${path.relative(root, targetAbs)}.`,
  );
}

const buf = Buffer.from(await res.arrayBuffer());
ok(`Downloaded ${(buf.length / 1024).toFixed(1)} KB`);

// --- Resize + convert ---

fs.mkdirSync(path.dirname(targetAbs), { recursive: true });

await sharp(buf)
  .resize(600, 600, {
    fit: "cover",
    position: "attention", // focuses on face-ish subject matter
  })
  .webp({ quality: 85 })
  .toFile(targetAbs);

const stat = fs.statSync(targetAbs);
ok(
  `Wrote ${path.relative(root, targetAbs)} (${(stat.size / 1024).toFixed(1)} KB)`,
);
console.log();
console.log("Inspect the output — if the crop centered on the wrong thing,");
console.log("download the original manually and replace the webp.");
