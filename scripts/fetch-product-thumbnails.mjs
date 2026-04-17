#!/usr/bin/env node
// Fetches real product thumbnails from Amazon for each affiliate product
// in lib/affiliates.ts, normalizes through sharp to 600x600 WebP @ q90 with
// white background, and patches lib/affiliates.ts so successful products
// resolve to the new WebP (failures keep their existing SVG fallback).
//
// Idempotent — safe to re-run when new products are added. Use --force to
// re-fetch products that already have a WebP on disk.
//
// Usage: node scripts/fetch-product-thumbnails.mjs [--force] [--id <product-id>]

import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const ROOT = process.cwd();
const AFFILIATES_FILE = path.join(ROOT, "lib", "affiliates.ts");
const OUT_DIR = path.join(ROOT, "public", "images", "products");

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const HTML_HEADERS = {
  "User-Agent": UA,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
};

const IMAGE_HEADERS = {
  "User-Agent": UA,
  Accept: "image/avif,image/webp,image/png,image/jpeg,*/*",
  Referer: "https://www.amazon.com/",
};

const REQUEST_DELAY_MS = 2500; // polite spacing between Amazon requests

// ----------------------------------------------------------------------
// Args
// ----------------------------------------------------------------------
function parseArgs(argv) {
  const out = { force: false, only: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--force") out.force = true;
    else if (argv[i] === "--id") out.only = argv[++i];
  }
  return out;
}

// ----------------------------------------------------------------------
// Parse lib/affiliates.ts to get [{id, asin}] without importing TS at runtime
// ----------------------------------------------------------------------
async function loadProducts() {
  const src = await fs.readFile(AFFILIATES_FILE, "utf8");
  // Each product block contains:  id: "<id>",  ...  url: amz("<asin>"),
  const blockRe = /id:\s*"([^"]+)"[\s\S]*?url:\s*amz\("([A-Z0-9]+)"\)/g;
  const products = [];
  let m;
  while ((m = blockRe.exec(src))) {
    products.push({ id: m[1], asin: m[2] });
  }
  return { products, src };
}

// ----------------------------------------------------------------------
// Image-URL extraction — try several Amazon HTML patterns
// ----------------------------------------------------------------------
function extractImageUrl(html) {
  // Helper: unescape any \/ or \u002F sequences if present (varies by template)
  const clean = (u) => u.replace(/\\u002F/g, "/").replace(/\\\//g, "/");

  // 1. "hiRes" key in the imageBlock JSON — best quality (typically _SL1500_)
  const hiRes = html.match(/"hiRes":"(https?:[^"]+\.(?:jpg|jpeg|png|webp))"/i);
  if (hiRes && hiRes[1] !== "null") return clean(hiRes[1]);

  // 2. First data-old-hires attribute (same image as hiRes, set on the landing image)
  const oldHires = html.match(/data-old-hires=["'](https?:[^"']+\.(?:jpg|jpeg|png|webp))["']/i);
  if (oldHires) return clean(oldHires[1]);

  // 3. data-a-dynamic-image on landingImage — pick the largest URL from its keys
  const dynamic = html.match(/id=["']landingImage["'][^>]*?data-a-dynamic-image=["']([^"']+)["']/i);
  if (dynamic) {
    const decoded = dynamic[1].replace(/&quot;/g, '"');
    const urls = [...decoded.matchAll(/(https?:\/\/[^"]+?\.(?:jpg|jpeg|png|webp))/gi)].map((m) => m[1]);
    if (urls.length) return urls[urls.length - 1]; // last is usually largest
  }

  // 4. "large" entry in colorImages JSON
  const large = html.match(/"large":"(https?:[^"]+\.(?:jpg|jpeg|png|webp))"/i);
  if (large) return clean(large[1]);

  // 5. og:image meta tag (rarely present on /dp pages but try)
  const og = html.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (og) return og[1];

  return null;
}

// ----------------------------------------------------------------------
// Fetch helpers
// ----------------------------------------------------------------------
async function fetchHtmlWithRetry(url, attempts = 3) {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: HTML_HEADERS,
        signal: AbortSignal.timeout(30_000),
      });
      if (res.status === 503 || res.status === 429) {
        throw new Error(`rate-limited (HTTP ${res.status})`);
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      lastErr = err;
      if (i < attempts) {
        const wait = 5000 * i;
        process.stderr.write(`    retry ${i}/${attempts} after ${err.message} — waiting ${wait}ms\n`);
        await sleep(wait);
      }
    }
  }
  throw lastErr;
}

async function downloadImage(url) {
  const res = await fetch(url, {
    headers: IMAGE_HEADERS,
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`image download HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 2000) throw new Error(`suspiciously small (${buf.length} bytes)`);
  return buf;
}

async function processToWebp(inputBuf, outPath) {
  const out = await sharp(inputBuf)
    .resize(600, 600, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .webp({ quality: 90, effort: 5 })
    .toBuffer();
  await fs.writeFile(outPath, out);
  const meta = await sharp(out).metadata();
  return { bytes: out.length, width: meta.width, height: meta.height };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ----------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------
async function main() {
  const args = parseArgs(process.argv);
  const { products, src: affiliatesSrc } = await loadProducts();
  await fs.mkdir(OUT_DIR, { recursive: true });

  const targets = args.only ? products.filter((p) => p.id === args.only) : products;
  if (targets.length === 0) {
    console.error("No products matched.");
    process.exit(2);
  }

  process.stderr.write(`→ ${targets.length} products to process (force=${args.force})\n`);

  const results = [];
  for (let i = 0; i < targets.length; i++) {
    const { id, asin } = targets[i];
    const outPath = path.join(OUT_DIR, `${id}.webp`);

    if (!args.force && existsSync(outPath)) {
      process.stderr.write(`[${i + 1}/${targets.length}] ${id} — skip (already exists)\n`);
      results.push({ id, asin, ok: true, skipped: true });
      continue;
    }

    process.stderr.write(`[${i + 1}/${targets.length}] ${id} (ASIN ${asin})\n`);
    try {
      const productUrl = `https://www.amazon.com/dp/${asin}`;
      const html = await fetchHtmlWithRetry(productUrl);
      const imgUrl = extractImageUrl(html);
      if (!imgUrl) throw new Error("no image URL found in product HTML");
      process.stderr.write(`    found: ${imgUrl.slice(0, 80)}...\n`);

      const buf = await downloadImage(imgUrl);
      const meta = await processToWebp(buf, outPath);
      process.stderr.write(`    saved: ${meta.bytes} bytes (${meta.width}x${meta.height})\n`);
      results.push({ id, asin, ok: true, source: imgUrl, ...meta });
    } catch (err) {
      process.stderr.write(`    FAIL: ${err.message}\n`);
      results.push({ id, asin, ok: false, error: err.message });
    }

    // Polite delay between requests (skip after last item)
    if (i < targets.length - 1) await sleep(REQUEST_DELAY_MS);
  }

  // -----------------------------------------------------------
  // Patch lib/affiliates.ts so successful products resolve to .webp
  // and failures fall back to the existing .svg.
  //
  // Strategy:
  //  - Ensure the `img()` helper accepts an extension and defaults to "webp"
  //  - For each FAILED product, ensure its line reads img("id", "svg")
  //  - For each SUCCESSFUL product, ensure its line is the simple img("id")
  // -----------------------------------------------------------
  let patched = affiliatesSrc;

  // Update helper signature if still old form
  patched = patched.replace(
    /const img = \(id: string\) => `\/images\/products\/\$\{id\}\.svg`;/,
    `const img = (id: string, ext: "webp" | "svg" = "webp") => \`/images/products/\${id}.\${ext}\`;`,
  );

  // Per-product overrides
  for (const r of results) {
    const successPattern = new RegExp(
      `imageUrl:\\s*img\\("${r.id}"(?:,\\s*"(?:svg|webp)")?\\)`,
    );
    const replacement = r.ok
      ? `imageUrl: img("${r.id}")`
      : `imageUrl: img("${r.id}", "svg")`;
    patched = patched.replace(successPattern, replacement);
  }

  if (patched !== affiliatesSrc) {
    await fs.writeFile(AFFILIATES_FILE, patched, "utf8");
    process.stderr.write(`→ patched ${AFFILIATES_FILE}\n`);
  }

  // Final report
  const ok = results.filter((r) => r.ok && !r.skipped).length;
  const skipped = results.filter((r) => r.skipped).length;
  const failed = results.filter((r) => !r.ok).length;

  console.log(JSON.stringify({
    summary: {
      total: results.length,
      fetched: ok,
      skipped,
      failed,
    },
    results,
  }, null, 2));

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.log(JSON.stringify({ ok: false, error: err.message, stack: err.stack }, null, 2));
  process.exit(1);
});
