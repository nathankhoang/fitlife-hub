#!/usr/bin/env node
// Before/after preview: renders both image variants (hero-photo and
// stat-callout) for all 4 platforms, plus updated captions, so you can
// compare against the pre-research baseline.
//
// Run: npx tsx scripts/preview-social-comparison.mts [slug]
// Output: tmp-social-preview/v2/<slug>__<platform>__<variant>.webp

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.loadEnvFile(path.join(ROOT, ".env.local"));

const { PLATFORMS, STRATEGIES } = await import("../lib/social/strategies.ts");
const { generateSocialImage } = await import("../lib/social/generate-image.ts");
const { generateCaption } = await import("../lib/social/generate-caption.ts");
const { extractHeroStat } = await import("../lib/social/extract-stat.ts");

const ARTICLES_DIR = path.join(ROOT, "content", "articles");
const IMAGES_DIR = path.join(ROOT, "public", "images", "articles");
const OUT_DIR = path.join(ROOT, "tmp-social-preview", "v2");

const CATEGORY_LABELS: Record<string, string> = {
  "home-workouts": "Home Workouts",
  supplements: "Supplement Reviews",
  "diet-nutrition": "Diet & Nutrition",
  "weight-loss": "Weight Loss",
  "muscle-building": "Muscle Building",
  wellness: "Wellness & Recovery",
};

async function pickArticle(slugArg?: string) {
  const files = (await fs.readdir(ARTICLES_DIR)).filter((f) => f.endsWith(".mdx"));
  const target = slugArg ? files.find((f) => f === `${slugArg}.mdx`) : files[Math.floor(Math.random() * files.length)];
  if (!target) throw new Error(`Article not found: ${slugArg}`);
  const raw = await fs.readFile(path.join(ARTICLES_DIR, target), "utf8");
  const { data, content } = matter(raw);
  const slug = target.replace(/\.mdx$/, "");
  return {
    slug,
    title: data.title as string,
    description: data.description as string,
    category: data.category as string,
    categoryLabel: CATEGORY_LABELS[data.category as string] ?? (data.category as string),
    body: content.trim(),
  };
}

function banner(label: string) {
  const line = "━".repeat(78);
  return `\n${line}\n  ${label}\n${line}`;
}

async function main() {
  const slugArg = process.argv[2];
  const article = await pickArticle(slugArg);
  const heroImage = path.join(IMAGES_DIR, `${article.slug}.webp`);
  await fs.mkdir(OUT_DIR, { recursive: true });

  console.log(banner(`ARTICLE: ${article.slug}`));
  console.log(`  title:    ${article.title}`);
  console.log(`  category: ${article.categoryLabel}`);

  console.log(banner(`1) EXTRACT HERO STAT (for stat-callout variant)`));
  const stat = await extractHeroStat({
    title: article.title,
    description: article.description,
    body: article.body,
  });
  console.log(`  value:   ${stat.value}`);
  console.log(`  context: ${stat.context}`);

  console.log(banner(`2) RENDER IMAGES — 4 platforms × 2 variants`));
  for (const platform of PLATFORMS) {
    for (const variant of ["hero-photo", "stat-callout"] as const) {
      const buf = await generateSocialImage({
        title: article.title,
        categoryLabel: article.categoryLabel,
        heroImage: variant === "hero-photo" ? heroImage : undefined,
        statValue: variant === "stat-callout" ? stat.value : undefined,
        statContext: variant === "stat-callout" ? stat.context : undefined,
        platform,
        variant,
      });
      const outFile = path.join(OUT_DIR, `${article.slug}__${platform}__${variant}.webp`);
      await fs.writeFile(outFile, buf);
      console.log(`  ${platform.padEnd(10)} ${variant.padEnd(14)} ${buf.length.toLocaleString().padStart(8)}  bytes → ${path.relative(ROOT, outFile)}`);
    }
  }

  console.log(banner(`3) GENERATE CAPTIONS — updated prompts (answer-forward)`));
  for (const platform of PLATFORMS) {
    const strategy = STRATEGIES[platform];
    console.log(banner(`  ${strategy.label.toUpperCase()}  (max ${strategy.caption.maxChars} chars)`));
    const result = await generateCaption({
      article: {
        slug: article.slug,
        title: article.title,
        description: article.description,
        category: article.category,
        categoryLabel: article.categoryLabel,
        body: article.body,
      },
      platform,
    });
    console.log(`  hook:  ${result.hookLine}`);
    console.log(`  chars: ${result.caption.length}/${strategy.caption.maxChars}`);
    console.log(``);
    console.log(result.caption);
  }
}

main().catch((err) => {
  console.error("[preview] failed:", err);
  process.exit(1);
});
