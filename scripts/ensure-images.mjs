#!/usr/bin/env node
// Audits every MDX file in content/drafts and content/articles, finds posts
// with missing images, and fetches the best matching photo for each from
// Openverse (CC-licensed, no API key required).
//
// Saves a single 1600×1000 WebP hero per post and sets image/imageOg/imagePinterest
// frontmatter fields all to that path so the site renders correctly immediately.
//
// License filter: cc0, by, by-sa, pdm — commercial use + modification allowed.
//
// Usage:
//   node scripts/ensure-images.mjs              # audit + backfill all posts
//   node scripts/ensure-images.mjs --dry-run    # report only, no generation
//   node scripts/ensure-images.mjs --slug <s>   # single post (any dir)
//   node scripts/ensure-images.mjs --force      # regenerate even if images exist

import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "images", "articles");
const ATTR_PATH = path.join(ROOT, "data", "telemetry", "image-attributions.json");

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const args = { dryRun: false, force: false, slug: null, url: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--dry-run") args.dryRun = true;
    else if (argv[i] === "--force") args.force = true;
    else if (argv[i] === "--slug" && argv[i + 1]) args.slug = argv[++i];
    else if (argv[i] === "--url" && argv[i + 1]) args.url = argv[++i];
  }
  return args;
}

// ---------------------------------------------------------------------------
// Query building
// ---------------------------------------------------------------------------
const CATEGORY_HINTS = {
  "home-workouts": "fitness exercise",
  supplements: "supplement vitamins",
  "diet-nutrition": "healthy food",
  "weight-loss": "fitness running",
  "muscle-building": "gym weights",
  wellness: "wellness meditation",
};

const SLUG_KEYWORDS = {
  // — already-good posts (kept for completeness) —
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
  "fat-loss-vs-weight-loss-difference": ["scale weight", "fitness running", "healthy lifestyle"],
  "intermittent-fasting-for-beginners-16-8": ["clock food", "healthy food", "plate"],
  "how-to-build-stronger-legs-beginners": ["squat exercise", "legs gym", "weightlifting"],
  "best-pre-workout-for-beginners-review": ["pre workout", "supplement powder", "gym"],
  // — fixed queries for previously bad images —
  "best-pre-workout-supplements": ["gym workout training", "weightlifting barbell", "fitness athlete workout"],
  "best-creatine-supplements": ["gym strength training", "barbell weightlifting", "dumbbell workout gym"],
  "best-multivitamins-athletes": ["athlete running track", "sports fitness running", "jogging exercise athlete"],
  "best-protein-powders-2025": ["protein tub scoop gym", "gym nutrition supplement bottle", "fitness drink muscle gym"],
  "calorie-counting-for-beginners": ["salad healthy green plate", "fresh vegetables healthy diet", "colorful salad bowl"],
  "creatine-monohydrate-review-2026": ["gym barbell weights", "strength training workout", "weightlifting muscle"],
  "how-to-sleep-better-athletes": ["woman sleeping white bed", "person resting pillow bedroom", "man asleep modern bed"],
  "kettlebell-workout-for-beginners": ["kettlebell swing exercise", "kettlebell workout", "kettlebell training gym"],
  "resistance-band-workout-12-exercises": ["woman resistance band squat", "fitness stretch band workout", "leg exercise band stretch"],
  "7-day-meal-plan-weight-loss": ["meal prep food bowls", "healthy food containers diet", "vegetables meal prep"],
  "hiit-vs-steady-state-cardio": ["running sprint cardio", "jogging run fitness", "cardio running exercise"],
  "home-gym-setup-under-200": ["dumbbell rack home exercise", "home barbell garage gym", "home weights exercise"],
  "home-workouts-beginners": ["pushup exercise floor", "home exercise workout", "fitness training indoors"],
  "intermittent-fasting-beginners": ["healthy lunch salad bowl", "morning fruit bowl breakfast", "fresh healthy food eating"],
  "keto-diet-beginners-guide": ["avocado eggs bacon", "low carb keto food", "keto diet avocado"],
};

function buildQueryCandidates(slug, title, category) {
  const candidates = [];
  if (SLUG_KEYWORDS[slug]) candidates.push(...SLUG_KEYWORDS[slug]);
  const stripped = title
    .toLowerCase()
    .replace(/[:()?!,"'&]/g, " ")
    .replace(/\b(how\s+to|a\s+complete|the\s+complete|guide|for\s+beginners|beginner['']?s?|your\s+first|actually\s+work(s)?|science[-\s]?backed|step[-\s]?by[-\s]?step|ultimate|full[-\s]?body|in\s+\d+\s+days?|at\s+home|\d+[-\s]?day|\d+[-\s]?week|\d{4}|top\s+\d+|best\s+\d+|review|methods?|tips|vs)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const titleWords = stripped.split(" ").filter((w) => w.length > 2 && !/^\d+$/.test(w));
  if (titleWords.length >= 2) candidates.push(titleWords.slice(0, 3).join(" "));
  if (CATEGORY_HINTS[category]) candidates.push(CATEGORY_HINTS[category]);
  candidates.push("fitness");
  return [...new Set(candidates)];
}

// Creators/sources known to dominate Openverse results with irrelevant content.
// These are legitimate CC-licensed photographers, but their material doesn't fit
// a fitness blog (Indian food, historical archives, sports conferences, etc.).
const BLOCKED_CREATORS = new Set([
  "sumita roy dutta",
  "biswarup ganguly",
  "oketch michael eriya",
  "sportsmedcon",
  "library of congress",
  "national library of medicine",
  "wellcome collection gallery",
  "internet archive book images",
  "rawpixel",     // often low-quality clipart
  "usfws",        // wildlife service — unrelated
]);

function isBlocked(result) {
  const creator = (result.creator ?? "").toLowerCase();
  const source = (result.source ?? "").toLowerCase();
  for (const blocked of BLOCKED_CREATORS) {
    if (creator.includes(blocked) || source.includes(blocked)) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Openverse API
// ---------------------------------------------------------------------------
async function searchOpenverse(query, { pageSize = 15, strictAspect = true } = {}) {
  const params = { q: query, license: "cc0,by,by-sa,pdm", page_size: String(pageSize), mature: "false" };
  if (strictAspect) params.aspect_ratio = "wide";
  const url = "https://api.openverse.org/v1/images/?" + new URLSearchParams(params);
  const res = await fetch(url, {
    headers: { "User-Agent": "fitbodyengine-image-fetcher/1.0" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Openverse HTTP ${res.status}`);
  return (await res.json()).results ?? [];
}

async function gatherCandidatePool(queries) {
  const seen = new Set();
  const pool = [];
  for (const q of queries) {
    for (const strict of [true, false]) {
      for (const r of await searchOpenverse(q, { pageSize: 20, strictAspect: strict })) {
        if (seen.has(r.id)) continue;
        if (isBlocked(r)) continue;
        if (r.width < 900 || r.height < 500) continue;
        const ratio = r.width / r.height;
        if (ratio < (strict ? 1.2 : 0.95)) continue;
        seen.add(r.id);
        pool.push({ ...r, _query: q, _score: r.width * (ratio >= 1.5 ? 1.1 : 1.0) });
      }
    }
    if (pool.length >= 20) break;
  }
  return pool.sort((a, b) => b._score - a._score);
}

async function fetchImageBuffer(url, { attempts = 3, timeout = 30_000 } = {}) {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "fitbodyengine-image-fetcher/1.0" },
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

// ---------------------------------------------------------------------------
// Frontmatter (handles both LF and CRLF)
// ---------------------------------------------------------------------------
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const fm = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*"?([^"]*)"?/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return fm;
}

async function updateFrontmatter(filePath, updates) {
  if (!existsSync(filePath)) return false;
  let raw = await fs.readFile(filePath, "utf8");
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
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

// ---------------------------------------------------------------------------
// Image presence check
// ---------------------------------------------------------------------------
function needsImages(fm, slug, force) {
  if (force) return { needed: true, reason: "--force" };
  const missing = [];
  if (!fm.image || fm.image === "") missing.push("image empty");
  if (!existsSync(path.join(OUT_DIR, `${slug}.webp`))) missing.push("hero .webp missing");
  return missing.length > 0 ? { needed: true, reason: missing.join("; ") } : { needed: false };
}

// ---------------------------------------------------------------------------
// Collect posts
// ---------------------------------------------------------------------------
async function collectPosts(dir, targetSlug) {
  const posts = [];
  if (!existsSync(dir)) return posts;
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".mdx"));
  for (const file of files) {
    const slug = file.replace(/\.mdx$/, "");
    if (targetSlug && slug !== targetSlug) continue;
    const filePath = path.join(dir, file);
    const raw = await fs.readFile(filePath, "utf8");
    const fm = parseFrontmatter(raw);
    posts.push({ slug, filePath, fm, error: fm ? null : "no frontmatter" });
  }
  return posts;
}

// ---------------------------------------------------------------------------
// Fetch + save one post's image
// ---------------------------------------------------------------------------
async function fetchAndSave(post, attributions, directUrl = null) {
  const { slug, fm } = post;

  let srcBuf;
  let attribution;

  if (directUrl) {
    process.stderr.write(`  direct URL: ${directUrl}\n`);
    try {
      srcBuf = await fetchImageBuffer(directUrl, { attempts: 3, timeout: 30_000 });
    } catch (err) {
      return { ok: false, error: `failed to download direct URL: ${err.message}` };
    }
    attribution = { source_url: directUrl, fetched_at: new Date().toISOString() };
  } else {
    const title = fm.title ?? slug;
    const category = fm.category ?? "wellness";
    const queries = buildQueryCandidates(slug, title, category);
    process.stderr.write(`  queries: ${queries.join(" | ")}\n`);

    const pool = await gatherCandidatePool(queries);
    if (pool.length === 0) return { ok: false, error: "no Openverse results across all fallback queries" };

    let chosen = null;
    for (const cand of pool.slice(0, 8)) {
      process.stderr.write(`  trying: ${cand.width}×${cand.height} — ${cand.creator ?? "anon"} (${cand.license}) [${cand._query}]\n`);
      try {
        srcBuf = await fetchImageBuffer(cand.url, { attempts: 2, timeout: 25_000 });
        chosen = cand;
        break;
      } catch (err) {
        process.stderr.write(`    ↳ ${err.message} — next\n`);
        await new Promise((r) => setTimeout(r, 600));
      }
    }
    if (!chosen) return { ok: false, error: "all candidates failed to download" };
    attribution = {
      title: chosen.title, creator: chosen.creator, creator_url: chosen.creator_url,
      license: chosen.license, license_version: chosen.license_version, license_url: chosen.license_url,
      source: chosen.source, source_url: chosen.foreign_landing_url,
      attribution_text: chosen.attribution, fetched_at: new Date().toISOString(),
    };
  }

  await fs.mkdir(OUT_DIR, { recursive: true });

  const webp = await sharp(srcBuf)
    .resize(1600, 1000, { fit: "cover", position: "attention" })
    .webp({ quality: 85, effort: 5 })
    .toBuffer();

  const heroFile = `${slug}.webp`;
  await fs.writeFile(path.join(OUT_DIR, heroFile), webp);

  const heroPath = `/images/articles/${heroFile}`;
  const fmUpdates = { image: heroPath, imageOg: heroPath, imagePinterest: heroPath };
  for (const dir of ["drafts", "articles"]) {
    await updateFrontmatter(path.join(ROOT, "content", dir, `${slug}.mdx`), fmUpdates);
  }

  attributions[slug] = attribution;

  return { ok: true, bytes: webp.length, source: attribution.source_url };
}

async function loadAttributions() {
  if (!existsSync(ATTR_PATH)) return {};
  try { return JSON.parse(await fs.readFile(ATTR_PATH, "utf8")); } catch { return {}; }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const args = parseArgs(process.argv);

  const [draftPosts, articlePosts] = await Promise.all([
    collectPosts(path.join(ROOT, "content", "drafts"), args.slug),
    collectPosts(path.join(ROOT, "content", "articles"), args.slug),
  ]);

  // Dedup — prefer articles over drafts as frontmatter source
  const bySlug = new Map();
  for (const p of [...draftPosts, ...articlePosts]) bySlug.set(p.slug, p);
  const posts = [...bySlug.values()];

  if (posts.length === 0) {
    console.log(args.slug ? `No MDX found for slug "${args.slug}".` : "No MDX files found.");
    return;
  }

  const needsWork = [], alreadyGood = [], errors = [];
  for (const post of posts) {
    if (post.error) { errors.push({ slug: post.slug, reason: post.error }); continue; }
    const { needed, reason } = needsImages(post.fm, post.slug, args.force);
    if (needed) needsWork.push({ ...post, reason });
    else alreadyGood.push(post.slug);
  }

  console.log(`\n=== ensure-images audit: ${posts.length} posts ===`);
  console.log(`  good (${alreadyGood.length}): ${alreadyGood.length ? alreadyGood.join(", ") : "none"}`);
  console.log(`  need images (${needsWork.length}): ${needsWork.length ? needsWork.map((p) => p.slug).join(", ") : "none"}`);
  if (errors.length) console.log(`  parse errors: ${errors.map((e) => `${e.slug} (${e.reason})`).join(", ")}`);

  if (needsWork.length === 0) { console.log("\nAll posts have images.\n"); return; }

  if (args.dryRun) {
    console.log("\nDry-run — re-run without --dry-run to backfill.\n");
    for (const p of needsWork) console.log(`  ${p.slug}: ${p.reason}`);
    return;
  }

  console.log(`\nFetching images for ${needsWork.length} post(s) via Openverse...\n`);

  const attributions = await loadAttributions();
  const results = { ok: [], failed: [] };

  for (const post of needsWork) {
    process.stdout.write(`[${post.slug}]\n`);
    try {
      const result = await fetchAndSave(post, attributions, args.url ?? null);
      if (result.ok) {
        console.log(`  → OK — ${result.source} ${(result.bytes / 1024).toFixed(0)} KB\n`);
        results.ok.push(post.slug);
        await fs.mkdir(path.dirname(ATTR_PATH), { recursive: true });
        await fs.writeFile(ATTR_PATH, JSON.stringify(attributions, null, 2));
        if (!args.url) await new Promise((r) => setTimeout(r, 1500)); // respect Openverse rate limit
      } else {
        console.log(`  → FAILED: ${result.error}\n`);
        results.failed.push({ slug: post.slug, reason: result.error });
      }
    } catch (err) {
      console.log(`  → ERROR: ${err.message}\n`);
      results.failed.push({ slug: post.slug, reason: err.message });
    }
  }

  console.log(`=== done: ${results.ok.length}/${needsWork.length} generated ===`);
  if (results.failed.length) {
    console.log(`failed:`);
    for (const f of results.failed) console.log(`  ${f.slug}: ${f.reason}`);
  }
  console.log();
}

main().catch((err) => { console.error(err.message); process.exit(1); });
