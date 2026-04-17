#!/usr/bin/env node
// Fetches a commercial-safe Creative Commons image for every post in data/queue.json,
// converts to a 1600×1000 WebP hero, and saves to public/images/articles/<slug>.webp.
//
// Source: Openverse API (api.openverse.org) — free, no key required, aggregates Flickr,
// Wikimedia, Smithsonian, etc. Rate limit: 200 anon req/day, 20 req/min.
//
// License filter: cc0, by, by-sa, pdm — all allow commercial use AND modification.
// (Excludes nc* and nd* licenses — unsafe for commercial affiliate blog.)
//
// Attribution: logged to data/telemetry/image-attributions.json so we can render credit
// on the article page. CC BY / BY-SA licenses REQUIRE attribution.
//
// Usage:  node scripts/fetch-post-images.mjs               # all posts
//         node scripts/fetch-post-images.mjs --slug foo    # single post
//         node scripts/fetch-post-images.mjs --force       # overwrite even if WebP exists

import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "images", "articles");
const ATTR_PATH = path.join(ROOT, "data", "telemetry", "image-attributions.json");

const CATEGORY_HINTS = {
  "home-workouts": "fitness exercise",
  supplements: "supplement vitamins",
  "diet-nutrition": "healthy food",
  "weight-loss": "fitness running",
  "muscle-building": "gym weights",
  wellness: "wellness meditation",
};

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--force") args.force = true;
    else if (a.startsWith("--")) args[a.slice(2)] = argv[++i];
  }
  return args;
}

// Slug-level curated keywords — these produce good Openverse matches under the
// commercial-only license filter. Fallback keywords handle edge cases.
const SLUG_KEYWORDS = {
  "best-creatine-for-beginners": ["creatine supplement", "protein powder", "gym"],
  "hiit-workout-plan-beginners": ["hiit workout", "running", "exercise"],
  "how-to-lose-belly-fat-30-day-plan-beginners": ["running exercise", "fitness", "healthy lifestyle"],
  "high-protein-meal-prep-beginners-guide": ["meal prep", "healthy food", "protein food"],
  "compound-vs-isolation-exercises": ["weightlifting", "gym weights", "dumbbells"],
  "how-to-recover-faster-after-workout": ["yoga stretch", "massage", "relaxation"],
  "optimum-nutrition-gold-standard-whey-review": ["protein shake", "protein smoothie", "whey"],
  "home-workout-guide-for-beginners-30-days": ["home exercise", "workout", "fitness"],
  "cardio-vs-strength-training-fat-loss": ["running", "weightlifting", "gym"],
  "best-high-protein-foods-muscle-fat-loss": ["healthy food", "protein food", "meat fish"],
  "how-to-get-bigger-arms-beginner-guide": ["biceps dumbbell", "gym weights", "bodybuilding"],
  "yoga-for-beginners-complete-starter-guide": ["yoga pose", "yoga", "meditation"],
  "breathing-techniques-stress-relief": ["meditation", "yoga", "relaxation"],
  "kettlebell-workout-for-beginners": ["kettlebell", "gym weights", "exercise"],
  "creatine-monohydrate-review-2026": ["creatine supplement", "powder", "gym"],
  "intermittent-fasting-for-beginners-16-8": ["clock food", "healthy food", "plate"],
  "how-to-build-stronger-legs-beginners": ["squat exercise", "legs gym", "weightlifting"],
  "calorie-counting-for-beginners": ["healthy food", "measuring food", "nutrition"],
  "best-pre-workout-for-beginners-review": ["pre workout", "supplement powder", "gym"],
  "resistance-band-workout-12-exercises": ["resistance band", "exercise band", "fitness"],
  "fat-loss-vs-weight-loss-difference": ["scale weight", "fitness running", "healthy lifestyle"],
  "how-to-sleep-better-athletes": ["sleep bed", "sleeping", "rest"],
};

function buildQueryCandidates(slug, title, category) {
  const candidates = [];
  if (SLUG_KEYWORDS[slug]) candidates.push(...SLUG_KEYWORDS[slug]);
  // Add title-derived fallback
  const stripped = title
    .toLowerCase()
    .replace(/[:()?!,"'&]/g, " ")
    .replace(/\b(how\s+to|a\s+complete|the\s+complete|guide|for\s+beginners|beginner['']?s?|your\s+first|actually\s+work(s)?|science[-\s]?backed|step[-\s]?by[-\s]?step|ultimate|full[-\s]?body|in\s+\d+\s+days?|at\s+home|\d+[-\s]?day|\d+[-\s]?week|\d{4}|top\s+\d+|best\s+\d+|review|methods?|tips|vs)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const titleWords = stripped.split(" ").filter((w) => w.length > 2 && !/^\d+$/.test(w));
  if (titleWords.length >= 2) candidates.push(titleWords.slice(0, 2).join(" "));
  // Category hint + final safety net
  if (CATEGORY_HINTS[category]) candidates.push(CATEGORY_HINTS[category]);
  candidates.push("fitness"); // guaranteed-results last resort
  return [...new Set(candidates)];
}

async function searchOpenverse(query, { pageSize = 12, strictAspect = true } = {}) {
  const params = {
    q: query,
    license: "cc0,by,by-sa,pdm",
    page_size: String(pageSize),
    mature: "false",
  };
  if (strictAspect) params.aspect_ratio = "wide";

  const url = "https://api.openverse.org/v1/images/?" + new URLSearchParams(params);

  const res = await fetch(url, {
    headers: { "User-Agent": "leanbodyengine-image-fetcher/1.0" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Openverse HTTP ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.results ?? [];
}

// Merges candidates from every query into one pool, deduped by image id,
// sorted by (wide-aspect preferred, then width desc). Caller can then try each
// in turn — if download fails, fall through to the next candidate.
async function gatherCandidatePool(queries) {
  const seen = new Set();
  const pool = [];
  for (const q of queries) {
    // Wide-aspect search first (best editorial fit)
    for (const r of await searchOpenverse(q, { pageSize: 15, strictAspect: true })) {
      if (seen.has(r.id)) continue;
      if (r.width < 900 || r.height < 500) continue;
      const ratio = r.width / r.height;
      if (ratio < 1.2) continue;
      seen.add(r.id);
      pool.push({ ...r, _query: q, _score: r.width * (ratio >= 1.5 ? 1.1 : 1.0) });
    }
    // Loose search — fills in posts that lack wide candidates
    for (const r of await searchOpenverse(q, { pageSize: 15, strictAspect: false })) {
      if (seen.has(r.id)) continue;
      if (r.width < 900 || r.height < 500) continue;
      const ratio = r.width / r.height;
      if (ratio < 0.95) continue; // reject very portrait
      seen.add(r.id);
      pool.push({ ...r, _query: q, _score: r.width * (ratio >= 1.2 ? 1.0 : 0.7) });
    }
    // Early exit once pool is large enough to absorb rate-limit failures
    if (pool.length >= 20) break;
  }
  return pool.sort((a, b) => b._score - a._score);
}

function pickBest(results, { minWidth = 1200, allowSquare = false, topN = 5 } = {}) {
  const minRatio = allowSquare ? 0.95 : 1.2;
  const qualifying = results.filter(
    (r) => r.width >= minWidth && r.height > 0 && r.width / r.height >= minRatio,
  );
  const sorted = qualifying.sort((a, b) => b.width - a.width);
  if (sorted.length === 0) return null;
  // Return the top candidate but expose the rest so the caller can retry if download fails
  return Object.assign(sorted[0], { _alternates: sorted.slice(1, topN) });
}

async function fetchImageBuffer(url, { attempts = 3, timeout = 30_000 } = {}) {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "leanbodyengine-image-fetcher/1.0" },
        signal: AbortSignal.timeout(timeout),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 3000) throw new Error(`small response (${buf.length} bytes)`);
      return buf;
    } catch (err) {
      lastErr = err;
      if (i < attempts) await new Promise((r) => setTimeout(r, 1500 * i));
    }
  }
  throw lastErr;
}

async function loadExistingAttributions() {
  if (!existsSync(ATTR_PATH)) return {};
  try {
    return JSON.parse(await fs.readFile(ATTR_PATH, "utf8"));
  } catch {
    return {};
  }
}

async function saveAttributions(attributions) {
  await fs.mkdir(path.dirname(ATTR_PATH), { recursive: true });
  await fs.writeFile(ATTR_PATH, JSON.stringify(attributions, null, 2));
}

async function processPost(post, { force, attributions }) {
  const outPath = path.join(OUT_DIR, `${post.slug}.webp`);
  if (!force && existsSync(outPath) && attributions[post.slug]?.source_url) {
    return { slug: post.slug, status: "skipped", reason: "already exists" };
  }

  const queries = buildQueryCandidates(post.slug, post.title, post.category);
  process.stderr.write(`\n→ ${post.slug}\n  candidates: ${queries.join(" | ")}\n`);

  const pool = await gatherCandidatePool(queries);
  if (pool.length === 0) {
    return { slug: post.slug, status: "failed", reason: "no openverse results across all fallback queries" };
  }
  process.stderr.write(`  pool size: ${pool.length}\n`);

  // Try each candidate in score order; fall through on download failure (often 429)
  let chosen = null;
  let srcBuf = null;
  let lastErr = null;
  for (const cand of pool.slice(0, 8)) {
    process.stderr.write(
      `  trying: ${cand.width}x${cand.height} by ${cand.creator ?? "anon"} (${cand.license} ${cand.license_version}) from ${cand.source} [q="${cand._query}"]\n`,
    );
    try {
      srcBuf = await fetchImageBuffer(cand.url, { attempts: 1, timeout: 20_000 });
      chosen = cand;
      break;
    } catch (err) {
      lastErr = err;
      process.stderr.write(`    ↳ ${err.message} — next\n`);
      await new Promise((r) => setTimeout(r, 600));
    }
  }
  if (!chosen) {
    return {
      slug: post.slug,
      status: "failed",
      reason: `all candidates failed to download; last error: ${lastErr?.message}`,
    };
  }

  process.stderr.write(`  ✓ downloaded ${chosen.width}x${chosen.height} (${srcBuf.length} bytes)\n`);

  const webp = await sharp(srcBuf)
    .resize(1600, 1000, { fit: "cover", position: "attention" })
    .webp({ quality: 85, effort: 5 })
    .toBuffer();

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(outPath, webp);

  attributions[post.slug] = {
    title: chosen.title,
    creator: chosen.creator,
    creator_url: chosen.creator_url,
    license: chosen.license,
    license_version: chosen.license_version,
    license_url: chosen.license_url,
    source: chosen.source,
    source_url: chosen.foreign_landing_url,
    attribution_text: chosen.attribution,
    fetched_at: new Date().toISOString(),
  };

  return {
    slug: post.slug,
    status: "ok",
    bytes: webp.length,
    width: chosen.width,
    height: chosen.height,
    creator: chosen.creator,
    license: chosen.license,
    source: chosen.source,
  };
}

async function main() {
  const args = parseArgs(process.argv);

  const queueRaw = await fs.readFile(path.join(ROOT, "data", "queue.json"), "utf8");
  let posts = JSON.parse(queueRaw);

  if (args.slug) {
    posts = posts.filter((p) => p.slug === args.slug);
    if (posts.length === 0) {
      console.error(`No post with slug "${args.slug}"`);
      process.exit(2);
    }
  }

  const attributions = await loadExistingAttributions();
  const results = [];
  const t0 = Date.now();

  for (const post of posts) {
    try {
      const r = await processPost(post, { force: args.force, attributions });
      results.push(r);
      // Save attributions incrementally so a mid-run crash doesn't lose state
      await saveAttributions(attributions);
      // Polite rate-limiting: stay well under 20 req/min
      if (r.status === "ok") await new Promise((res) => setTimeout(res, 1500));
    } catch (err) {
      results.push({ slug: post.slug, status: "error", error: err.message });
      process.stderr.write(`  ERROR: ${err.message}\n`);
    }
  }

  const elapsed = Date.now() - t0;
  const summary = {
    elapsed_ms: elapsed,
    total: results.length,
    ok: results.filter((r) => r.status === "ok").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    failed: results.filter((r) => r.status === "failed" || r.status === "error").length,
    results,
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err.stack);
  process.exit(1);
});
