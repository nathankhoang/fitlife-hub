#!/usr/bin/env node
// Dev-time helper: pick a sample article, generate captions for all 4 platforms,
// print them to stdout with char counts and hook lines for visual QA.
//
// Run: node --env-file=.env.local node_modules/.bin/tsx scripts/preview-social-captions.ts [slug]
//  or: npx tsx scripts/preview-social-captions.ts [slug]   (env must already be loaded)
//
// Requires: GOOGLE_GENERATIVE_AI_API_KEY in .env.local (see scripts/infer-voice.mjs).

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Load .env.local before importing modules that read process.env at import time.
try {
  process.loadEnvFile(path.join(ROOT, ".env.local"));
} catch {
  // no-op: env may already be set by the caller
}

const { PLATFORMS, STRATEGIES } = await import("../lib/social/strategies.ts");
const { generateCaption } = await import("../lib/social/generate-caption.ts");
const ARTICLES_DIR = path.join(ROOT, "content", "articles");

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

  console.log(banner(`ARTICLE: ${article.slug}`));
  console.log(`Title:       ${article.title}`);
  console.log(`Description: ${article.description}`);
  console.log(`Category:    ${article.categoryLabel}`);

  for (const platform of PLATFORMS) {
    const strategy = STRATEGIES[platform];
    console.log(banner(`${strategy.label.toUpperCase()}  (max ${strategy.caption.maxChars} chars)`));
    const started = Date.now();
    const result = await generateCaption({ article, platform });
    const ms = Date.now() - started;

    console.log(`[hook line]  ${result.hookLine}`);
    console.log(`[chars]      ${result.caption.length} / ${strategy.caption.maxChars}${result.caption.length > strategy.caption.maxChars ? "  ⚠ OVER LIMIT" : ""}`);
    console.log(`[gen time]   ${ms}ms\n`);
    console.log(result.caption);

    if (result.firstComment) {
      console.log(`\n--- first comment ---\n${result.firstComment}`);
    }
  }
}

main().catch((err) => {
  console.error("[preview-captions] failed:", err);
  process.exit(1);
});
