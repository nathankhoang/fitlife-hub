#!/usr/bin/env node
// Audits every MDX file in content/drafts and content/articles, finds posts
// with missing or empty image fields (image, imageOg, imagePinterest) or whose
// WebP files don't exist on disk, and runs generate-thumbnail.mjs for each.
//
// Usage:
//   node scripts/ensure-images.mjs              # audit + backfill all posts
//   node scripts/ensure-images.mjs --dry-run    # report only, no generation
//   node scripts/ensure-images.mjs --slug <s>   # single post (any dir)
//   node scripts/ensure-images.mjs --force      # regenerate even if images exist

import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import process from "node:process";

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const args = { dryRun: false, force: false, slug: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--dry-run") args.dryRun = true;
    else if (argv[i] === "--force") args.force = true;
    else if (argv[i] === "--slug" && argv[i + 1]) { args.slug = argv[++i]; }
  }
  return args;
}

// ---------------------------------------------------------------------------
// Frontmatter parsing (minimal — we only need a few fields)
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

// ---------------------------------------------------------------------------
// Check whether a post needs images
// ---------------------------------------------------------------------------
function needsImages(fm, slug, force) {
  if (force) return { needed: true, reason: "--force" };

  const missing = [];
  const imgDir = path.join(process.cwd(), "public", "images", "articles");

  // Check frontmatter fields
  if (!fm.image || fm.image === "") missing.push("image frontmatter empty");
  if (!fm.imageOg || fm.imageOg === "") missing.push("imageOg frontmatter empty");
  if (!fm.imagePinterest || fm.imagePinterest === "") missing.push("imagePinterest frontmatter empty");

  // Check files on disk even if frontmatter is set
  const heroPath = path.join(imgDir, `${slug}.webp`);
  const ogPath = path.join(imgDir, `${slug}-og.webp`);
  const pinterestPath = path.join(imgDir, `${slug}-pinterest.webp`);

  if (!existsSync(heroPath)) missing.push(`missing ${slug}.webp`);
  if (!existsSync(ogPath)) missing.push(`missing ${slug}-og.webp`);
  if (!existsSync(pinterestPath)) missing.push(`missing ${slug}-pinterest.webp`);

  return missing.length > 0
    ? { needed: true, reason: missing.join("; ") }
    : { needed: false, reason: "ok" };
}

// ---------------------------------------------------------------------------
// Collect posts from one directory
// ---------------------------------------------------------------------------
async function collectPosts(dir, targetSlug) {
  const posts = [];
  if (!existsSync(dir)) return posts;
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".mdx"));
  for (const file of files) {
    const slug = file.replace(/\.mdx$/, "");
    if (targetSlug && slug !== targetSlug) continue;
    const raw = await fs.readFile(path.join(dir, file), "utf8");
    const fm = parseFrontmatter(raw);
    if (!fm) { posts.push({ slug, file: path.join(dir, file), fm: null, error: "no frontmatter" }); continue; }
    posts.push({ slug, file: path.join(dir, file), fm });
  }
  return posts;
}

// ---------------------------------------------------------------------------
// Run generate-thumbnail.mjs for one post
// ---------------------------------------------------------------------------
async function generateImages(slug, title, category) {
  const script = path.join(process.cwd(), "scripts", "generate-thumbnail.mjs");
  let stdout = "";
  let stderr = "";
  try {
    ({ stdout, stderr } = await execFileAsync(
      process.execPath,
      [script, "--slug", slug, "--title", title, "--category", category],
      { cwd: process.cwd(), timeout: 120_000 }
    ));
  } catch (err) {
    // execFile throws on non-zero exit; capture any stdout it produced
    stdout = err.stdout ?? "";
    stderr = err.stderr ?? "";
  }
  if (stderr) process.stderr.write(stderr);
  try {
    return JSON.parse(stdout.trim());
  } catch {
    return { ok: false, error: "generate-thumbnail exited with no parseable JSON (likely missing PEXELS_API_KEY or ANTHROPIC_API_KEY)", raw: stdout.slice(0, 300) };
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const args = parseArgs(process.argv);
  const root = process.cwd();
  const draftsDir = path.join(root, "content", "drafts");
  const articlesDir = path.join(root, "content", "articles");

  // Collect all posts (dedup by slug — prefer articles over drafts)
  const [draftPosts, articlePosts] = await Promise.all([
    collectPosts(draftsDir, args.slug),
    collectPosts(articlesDir, args.slug),
  ]);

  const bySlug = new Map();
  for (const p of [...draftPosts, ...articlePosts]) bySlug.set(p.slug, p);
  const posts = [...bySlug.values()];

  if (posts.length === 0) {
    console.log(args.slug
      ? `No MDX found for slug "${args.slug}".`
      : "No MDX files found in content/drafts or content/articles."
    );
    return;
  }

  // Audit
  const needsWork = [];
  const alreadyGood = [];
  const errors = [];

  for (const post of posts) {
    if (post.error) { errors.push({ slug: post.slug, reason: post.error }); continue; }
    const { needed, reason } = needsImages(post.fm, post.slug, args.force);
    if (needed) needsWork.push({ ...post, reason });
    else alreadyGood.push(post.slug);
  }

  // Report audit
  console.log(`\n=== ensure-images audit: ${posts.length} posts ===`);
  console.log(`  good (${alreadyGood.length}): ${alreadyGood.length > 0 ? alreadyGood.join(", ") : "none"}`);
  console.log(`  need images (${needsWork.length}): ${needsWork.length > 0 ? needsWork.map((p) => p.slug).join(", ") : "none"}`);
  if (errors.length) console.log(`  errors (${errors.length}): ${errors.map((e) => `${e.slug} (${e.reason})`).join(", ")}`);

  if (needsWork.length === 0) {
    console.log("\nAll posts have images. Nothing to do.\n");
    return;
  }

  if (args.dryRun) {
    console.log("\nDry-run mode — no images generated. Re-run without --dry-run to backfill.\n");
    for (const p of needsWork) console.log(`  ${p.slug}: ${p.reason}`);
    return;
  }

  // Backfill
  console.log(`\nGenerating images for ${needsWork.length} post(s)...\n`);

  const results = { ok: [], failed: [] };

  for (const post of needsWork) {
    const { slug, fm } = post;
    const title = fm.title ?? slug;
    const category = fm.category ?? "wellness";

    process.stdout.write(`  [${slug}] "${title}" (${category}) ... `);
    try {
      const result = await generateImages(slug, title, category);
      if (result.ok) {
        console.log(`OK (${result.total_ms}ms, provider: ${result.provider})`);
        results.ok.push(slug);
      } else {
        console.log(`FAILED: ${result.error}`);
        results.failed.push({ slug, reason: result.error });
      }
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      results.failed.push({ slug, reason: err.message });
    }
  }

  // Summary
  console.log(`\n=== ensure-images complete ===`);
  console.log(`  generated: ${results.ok.length}/${needsWork.length}`);
  if (results.failed.length) {
    console.log(`  failed:`);
    for (const f of results.failed) console.log(`    ${f.slug}: ${f.reason}`);
  }
  console.log();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
