#!/usr/bin/env node
// Dev-time helper: pick a sample article, render all 4 platform images,
// write them to tmp-social-preview/ for visual QA.
//
// Run: node scripts/preview-social-images.mjs [slug]
// If a slug isn't passed, a random published article is picked.
//
// Output: tmp-social-preview/<slug>__<platform>.webp

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { generateSocialImage } from "../lib/social/generate-image.ts";
import { PLATFORMS } from "../lib/social/strategies.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARTICLES_DIR = path.join(ROOT, "content", "articles");
const IMAGES_DIR = path.join(ROOT, "public", "images", "articles");
const OUT_DIR = path.join(ROOT, "tmp-social-preview");

const CATEGORY_LABELS = {
  "home-workouts": "Home Workouts",
  supplements: "Supplement Reviews",
  "diet-nutrition": "Diet & Nutrition",
  "weight-loss": "Weight Loss",
  "muscle-building": "Muscle Building",
  wellness: "Wellness & Recovery",
};

async function pickArticle(slugArg) {
  const files = (await fs.readdir(ARTICLES_DIR)).filter((f) => f.endsWith(".mdx"));
  const target = slugArg
    ? files.find((f) => f === `${slugArg}.mdx`)
    : files[Math.floor(Math.random() * files.length)];
  if (!target) throw new Error(`Article not found: ${slugArg}`);
  const raw = await fs.readFile(path.join(ARTICLES_DIR, target), "utf8");
  const { data } = matter(raw);
  const slug = target.replace(/\.mdx$/, "");
  return { slug, title: data.title, category: data.category };
}

async function findHero(slug) {
  // Heroes are either .webp or fall back to .jpg; articles.ts prefers webp.
  const webp = path.join(IMAGES_DIR, `${slug}.webp`);
  try {
    await fs.access(webp);
    return webp;
  } catch {
    throw new Error(`No hero image for slug "${slug}" at ${webp}`);
  }
}

async function main() {
  const slugArg = process.argv[2];
  const article = await pickArticle(slugArg);
  const heroImage = await findHero(article.slug);
  const categoryLabel = CATEGORY_LABELS[article.category] ?? article.category;

  console.log(`[preview] article: ${article.slug}`);
  console.log(`[preview]   title: ${article.title}`);
  console.log(`[preview]   hero:  ${path.relative(ROOT, heroImage)}`);
  console.log(`[preview]   cat:   ${categoryLabel}`);

  await fs.mkdir(OUT_DIR, { recursive: true });
  for (const platform of PLATFORMS) {
    const buf = await generateSocialImage({
      title: article.title,
      categoryLabel,
      heroImage,
      platform,
    });
    const outFile = path.join(OUT_DIR, `${article.slug}__${platform}.webp`);
    await fs.writeFile(outFile, buf);
    console.log(`[preview] wrote ${platform.padEnd(9)} ${buf.length.toLocaleString().padStart(8)}  bytes → ${path.relative(ROOT, outFile)}`);
  }
}

main().catch((err) => {
  console.error("[preview] failed:", err);
  process.exit(1);
});
