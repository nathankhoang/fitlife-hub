#!/usr/bin/env node
// Generates a 3-variant thumbnail kit from REAL STOCK PHOTOGRAPHY (Pexels)
// with Claude vision picking the best candidate out of 4.
//
//   - hero       (1600x1000)  — blog page; NO text overlay
//   - og         (1200x630)   — Twitter / LinkedIn / FB / default Open Graph; WITH overlay
//   - pinterest  (1000x1500)  — Pinterest portrait; WITH overlay
//
// Pipeline:
//   1. Pexels API search → 4 landscape candidates + 4 portrait candidates
//   2. Claude Haiku 4.5 (vision) ranks each set, picks best fit for title + category
//   3. Full-res download of the picks
//   4. sharp resizes/crops to each target aspect
//   5. satori renders title overlay (Geist Bold) → PNG via @resvg/resvg-js
//   6. sharp composites overlay onto photo, exports WebP @ q85
//   7. Updates frontmatter `image:`, `imageOg:`, `imagePinterest:`, plus `photoCredit:` / `photoCreditUrl:`
//
// Required env vars:
//   PEXELS_API_KEY       — https://www.pexels.com/api/ (free)
//   ANTHROPIC_API_KEY    — used for vision-model candidate ranking
//
// If ANTHROPIC_API_KEY is missing, the script falls back to Pexels' own ranking (first result).
// If PEXELS_API_KEY is missing, the script fails hard — no silent generative fallback.
//
// Usage: node scripts/generate-thumbnail.mjs --slug <slug> --title "<title>" --category <category>

import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import Anthropic from "@anthropic-ai/sdk";

// ----------------------------------------------------------------------
// Query building from title + category
// ----------------------------------------------------------------------
const CATEGORY_QUERY_HINTS = {
  "home-workouts": "home workout fitness",
  supplements: "supplement protein powder",
  "diet-nutrition": "healthy food nutrition",
  "weight-loss": "fitness lifestyle",
  "muscle-building": "gym strength training",
  wellness: "wellness meditation",
};

const CATEGORY_LABELS = {
  "home-workouts": "Home Workouts",
  supplements: "Supplements",
  "diet-nutrition": "Diet & Nutrition",
  "weight-loss": "Weight Loss",
  "muscle-building": "Muscle Building",
  wellness: "Wellness",
};

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 2) args[argv[i].replace(/^--/, "")] = argv[i + 1];
  return args;
}

function buildSearchQuery(title, category) {
  const stripped = title
    .toLowerCase()
    .replace(/[:()?!,"'&]/g, " ")
    .replace(/\b(how\s+to|a\s+complete|the\s+complete|guide|for\s+beginners|beginner['']?s?|your\s+first|actually\s+work(s)?|science[-\s]?backed|step[-\s]?by[-\s]?step|ultimate|full[-\s]?body|in\s+\d+\s+days?|at\s+home|\d+[-\s]?day|\d+[-\s]?week|\d{4}|top\s+\d+|best\s+\d+|review|guide|methods?|tips)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = stripped.split(" ").filter((w) => w.length > 2 && !/^\d+$/.test(w));
  let q = words.slice(0, 4).join(" ").trim();
  if (q.length < 6) q = CATEGORY_QUERY_HINTS[category] ?? category.replace(/-/g, " ");
  return q;
}

// ----------------------------------------------------------------------
// Pexels API
// ----------------------------------------------------------------------
async function searchPexels(query, orientation, perPage = 4) {
  const key = process.env.PEXELS_API_KEY;
  if (!key) throw new Error("PEXELS_API_KEY environment variable not set");

  const url =
    "https://api.pexels.com/v1/search?" +
    new URLSearchParams({
      query,
      per_page: String(perPage),
      orientation, // 'landscape' | 'portrait'
      size: "large",
    });

  const res = await fetch(url, {
    headers: { Authorization: key },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Pexels HTTP ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.photos ?? [];
}

async function fetchBuffer(url, { attempts = 3, timeout = 60_000 } = {}) {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(timeout) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 2000) throw new Error(`small response (${buf.length} bytes)`);
      return buf;
    } catch (err) {
      lastErr = err;
      if (i < attempts) await new Promise((r) => setTimeout(r, 1500 * i));
    }
  }
  throw lastErr;
}

// ----------------------------------------------------------------------
// Vision-model ranker (Claude Haiku 4.5)
// ----------------------------------------------------------------------
const RANKER_SYSTEM = `You are an editorial image curator for a fitness blog. Given a post title, a category, and a set of candidate stock photos, you pick the single best fit.

Selection rubric (apply in order):
1. Topical fit — does the image visually match the title and category?
2. Editorial quality — composition, lighting, craft. Prefer candid/lifestyle over staged/corny stock.
3. Avoid clichés — generic handshake photos, bland gym backgrounds, overused "woman with measuring tape"
4. Avoid visible text, logos, watermarks, or brand names in the photo
5. Prefer images where the subject has room for a title overlay on the lower third

Return ONLY this JSON, nothing else: {"pick": N, "reason": "one short sentence"} where N is the 0-indexed candidate number.`;

async function rankCandidatesWithClaude({ title, category, candidates }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { pickIdx: 0, reason: "no ANTHROPIC_API_KEY — fell back to Pexels ranking", skipped: true };

  const client = new Anthropic({ apiKey });

  // Download each candidate at medium size for vision API efficiency
  const images = await Promise.all(
    candidates.map(async (c, idx) => {
      const buf = await fetchBuffer(c.src.medium, { attempts: 2, timeout: 15_000 });
      return { idx, base64: buf.toString("base64"), mime: "image/jpeg" };
    }),
  );

  const content = [
    {
      type: "text",
      text: `Post title: "${title}"\nCategory: ${category}\n\n${images.length} candidate images follow, numbered 0 to ${images.length - 1}. Pick the best.`,
    },
  ];
  for (const img of images) {
    content.push({ type: "text", text: `Candidate ${img.idx}:` });
    content.push({
      type: "image",
      source: { type: "base64", media_type: img.mime, data: img.base64 },
    });
  }

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 256,
    system: RANKER_SYSTEM,
    messages: [{ role: "user", content }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const raw = textBlock?.text ?? "";
  const match = raw.match(/\{[\s\S]*?\}/);
  if (!match) {
    process.stderr.write(`  ranker returned non-JSON: ${raw.slice(0, 100)}\n`);
    return { pickIdx: 0, reason: "ranker response unparseable — fell back to first candidate", skipped: true };
  }
  try {
    const parsed = JSON.parse(match[0]);
    const pickIdx = Number.isInteger(parsed.pick) && parsed.pick >= 0 && parsed.pick < candidates.length ? parsed.pick : 0;
    return {
      pickIdx,
      reason: parsed.reason ?? "(no reason given)",
      usage: response.usage,
    };
  } catch (err) {
    return { pickIdx: 0, reason: `ranker JSON parse failed: ${err.message}`, skipped: true };
  }
}

// ----------------------------------------------------------------------
// Satori overlay builder (unchanged from prior version)
// ----------------------------------------------------------------------
function overlayTree({ width, height, title, categoryLabel }) {
  const isVertical = height > width;
  const padding = isVertical ? 64 : 56;
  const titleSize = isVertical ? 76 : 60;
  const eyebrowSize = isVertical ? 20 : 18;
  const urlSize = isVertical ? 22 : 20;
  const monogramSize = isVertical ? 64 : 56;
  const monogramFont = isVertical ? 22 : 19;

  return {
    type: "div",
    props: {
      style: {
        width, height,
        display: "flex", flexDirection: "column",
        justifyContent: "space-between",
        fontFamily: "Geist", color: "white",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              display: "flex", flexDirection: "row",
              justifyContent: "space-between", alignItems: "flex-start",
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
                    fontSize: eyebrowSize, fontWeight: 700,
                    letterSpacing: 3, textTransform: "uppercase",
                    padding: "10px 16px", borderRadius: 999,
                  },
                  children: categoryLabel,
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    width: monogramSize, height: monogramSize,
                    backgroundColor: "#059669", borderRadius: 14,
                    alignItems: "center", justifyContent: "center",
                    fontSize: monogramFont, fontWeight: 700, letterSpacing: -0.5,
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
              display: "flex", flexDirection: "column",
              padding: `${Math.round(padding * 1.6)}px ${padding}px ${padding}px ${padding}px`,
              backgroundImage:
                "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0) 100%)",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex", fontSize: titleSize, fontWeight: 700,
                    lineHeight: 1.05, letterSpacing: -1.5,
                    marginBottom: Math.round(titleSize * 0.35), color: "white",
                  },
                  children: title,
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex", fontSize: urlSize, fontWeight: 600,
                    color: "rgba(255,255,255,0.7)", letterSpacing: 0.5,
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

async function loadFonts() {
  const root = process.cwd();
  const bold = await fs.readFile(path.join(root, "assets/fonts/Geist-Bold.ttf"));
  const semibold = await fs.readFile(path.join(root, "assets/fonts/Geist-SemiBold.ttf"));
  return [
    { name: "Geist", data: bold, weight: 700, style: "normal" },
    { name: "Geist", data: semibold, weight: 600, style: "normal" },
  ];
}

async function renderOverlay({ width, height, title, categoryLabel, fonts }) {
  const tree = overlayTree({ width, height, title, categoryLabel });
  const svg = await satori(tree, { width, height, fonts });
  return new Resvg(svg, { background: "rgba(0,0,0,0)" }).render().asPng();
}

// ----------------------------------------------------------------------
// Frontmatter updater
// ----------------------------------------------------------------------
async function updateFrontmatter(filePath, updates) {
  if (!existsSync(filePath)) return false;
  let raw = await fs.readFile(filePath, "utf8");
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return false;
  let fm = fmMatch[1];

  for (const [key, value] of Object.entries(updates)) {
    if (value == null) continue;
    const lineRegex = new RegExp(`^${key}:.*$`, "m");
    const escaped = String(value).replace(/"/g, '\\"');
    const newLine = `${key}: "${escaped}"`;
    if (lineRegex.test(fm)) {
      fm = fm.replace(lineRegex, newLine);
    } else if (/^image:/m.test(fm)) {
      fm = fm.replace(/^image:.*$/m, (m) => `${m}\n${newLine}`);
    } else {
      fm = `${fm}\n${newLine}`;
    }
  }

  const newRaw = raw.replace(fmMatch[0], `---\n${fm}\n---`);
  if (newRaw === raw) return false;
  await fs.writeFile(filePath, newRaw, "utf8");
  return true;
}

// ----------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------
async function main() {
  const args = parseArgs(process.argv);
  const { slug, title, category } = args;
  if (!slug || !title || !category) {
    console.error('Usage: --slug <slug> --title "<title>" --category <category>');
    process.exit(2);
  }

  const t0 = Date.now();
  const query = buildSearchQuery(title, category);
  const categoryLabel = CATEGORY_LABELS[category] ?? category;
  process.stderr.write(`→ slug: ${slug}\n`);
  process.stderr.write(`→ pexels query: "${query}"\n`);

  // 1. Search Pexels for landscape + portrait candidates in parallel
  const [landscapeCandidates, portraitCandidates] = await Promise.all([
    searchPexels(query, "landscape", 4),
    searchPexels(query, "portrait", 4),
  ]);

  if (landscapeCandidates.length === 0) throw new Error(`No Pexels landscape results for "${query}"`);
  if (portraitCandidates.length === 0) throw new Error(`No Pexels portrait results for "${query}"`);

  process.stderr.write(`→ pexels returned ${landscapeCandidates.length} landscape + ${portraitCandidates.length} portrait candidates\n`);

  // 2. Claude Haiku vision ranks each set in parallel
  process.stderr.write(`→ ranking with claude-haiku-4-5 (vision)...\n`);
  const [landscapePick, portraitPick] = await Promise.all([
    rankCandidatesWithClaude({ title, category, candidates: landscapeCandidates }),
    rankCandidatesWithClaude({ title, category, candidates: portraitCandidates }),
  ]);

  const chosenLandscape = landscapeCandidates[landscapePick.pickIdx];
  const chosenPortrait = portraitCandidates[portraitPick.pickIdx];
  process.stderr.write(`→ landscape pick: #${landscapePick.pickIdx} — ${landscapePick.reason}\n`);
  process.stderr.write(`→ portrait pick:  #${portraitPick.pickIdx} — ${portraitPick.reason}\n`);

  // 3. Download full-res source photos
  const [landscapeBuf, portraitBuf] = await Promise.all([
    fetchBuffer(chosenLandscape.src.original),
    fetchBuffer(chosenPortrait.src.original),
  ]);
  const fetchedMs = Date.now() - t0;
  process.stderr.write(`→ full-res downloads complete in ${fetchedMs}ms\n`);

  // 4. Variant pipeline (unchanged)
  const fonts = await loadFonts();
  const outDir = path.join(process.cwd(), "public", "images", "articles");
  await fs.mkdir(outDir, { recursive: true });

  const variants = [
    { name: "hero", file: `${slug}.webp`, frontmatterKey: "image", w: 1600, h: 1000, source: landscapeBuf, overlay: false },
    { name: "og", file: `${slug}-og.webp`, frontmatterKey: "imageOg", w: 1200, h: 630, source: landscapeBuf, overlay: true },
    { name: "pinterest", file: `${slug}-pinterest.webp`, frontmatterKey: "imagePinterest", w: 1000, h: 1500, source: portraitBuf, overlay: true },
  ];

  const variantReports = [];
  const frontmatterUpdates = {};

  for (const v of variants) {
    const photo = await sharp(v.source)
      .resize(v.w, v.h, { fit: "cover", position: "attention" })
      .toBuffer();

    let final = photo;
    if (v.overlay) {
      const overlayPng = await renderOverlay({ width: v.w, height: v.h, title, categoryLabel, fonts });
      final = await sharp(photo).composite([{ input: overlayPng, top: 0, left: 0 }]).toBuffer();
    }

    const webp = await sharp(final).webp({ quality: 85, effort: 5 }).toBuffer();
    await fs.writeFile(path.join(outDir, v.file), webp);

    const relPath = `/images/articles/${v.file}`;
    frontmatterUpdates[v.frontmatterKey] = relPath;

    variantReports.push({ variant: v.name, file: relPath, width: v.w, height: v.h, bytes: webp.length, overlay: v.overlay });
  }

  // 5. Attribution (Pexels license requires credit)
  const photographerName = chosenLandscape.photographer;
  const photoUrl = chosenLandscape.url;
  frontmatterUpdates.photoCredit = `Photo by ${photographerName} on Pexels`;
  frontmatterUpdates.photoCreditUrl = photoUrl;

  // 6. Update both draft and article MDX
  const updatedFiles = [];
  for (const dir of ["drafts", "articles"]) {
    const fp = path.join(process.cwd(), "content", dir, `${slug}.mdx`);
    if (await updateFrontmatter(fp, frontmatterUpdates)) updatedFiles.push(`content/${dir}/${slug}.mdx`);
  }

  const totalMs = Date.now() - t0;

  console.log(JSON.stringify({
    ok: true,
    slug,
    provider: "pexels",
    ranker: process.env.ANTHROPIC_API_KEY ? "claude-haiku-4-5" : "pexels-default",
    query,
    landscape_pick: {
      index: landscapePick.pickIdx,
      reason: landscapePick.reason,
      pexels_id: chosenLandscape.id,
      photographer: chosenLandscape.photographer,
      page_url: chosenLandscape.url,
    },
    portrait_pick: {
      index: portraitPick.pickIdx,
      reason: portraitPick.reason,
      pexels_id: chosenPortrait.id,
      photographer: chosenPortrait.photographer,
      page_url: chosenPortrait.url,
    },
    ranker_usage: {
      landscape: landscapePick.usage ?? null,
      portrait: portraitPick.usage ?? null,
    },
    fetched_ms: fetchedMs,
    total_ms: totalMs,
    variants: variantReports,
    frontmatter_updated: updatedFiles,
    frontmatter_keys: Object.keys(frontmatterUpdates),
  }, null, 2));
}

main().catch((err) => {
  console.log(JSON.stringify({ ok: false, error: err.message, stack: err.stack }, null, 2));
  process.exit(1);
});
