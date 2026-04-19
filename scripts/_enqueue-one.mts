// Enqueue a single pending entry for a specific (article, platform) pair.
// Usage: npx tsx scripts/_enqueue-one.mts <slug> <platform>

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.loadEnvFile(path.join(ROOT, ".env.local"));

const { getQueue } = await import("../lib/queue.ts");
const { addSocialEntries } = await import("../lib/social/queue.ts");
const { processEntryById } = await import("../lib/social/worker.ts");

const CATEGORY_LABELS: Record<string, string> = {
  "home-workouts": "Home Workouts",
  supplements: "Supplement Reviews",
  "diet-nutrition": "Diet & Nutrition",
  "weight-loss": "Weight Loss",
  "muscle-building": "Muscle Building",
  wellness: "Wellness & Recovery",
};

const slug = process.argv[2];
const platform = process.argv[3];
if (!slug || !platform) { console.error("usage: npx tsx scripts/_enqueue-one.mts <slug> <platform>"); process.exit(1); }

const article = (await getQueue()).find((e) => e.slug === slug);
if (!article) { console.error(`article not found: ${slug}`); process.exit(1); }

const now = new Date().toISOString();
const id = randomUUID();
await addSocialEntries([{
  id, articleSlug: slug, articleTitle: article.title, articleDescription: article.description,
  articleCategory: article.category, articleCategoryLabel: CATEGORY_LABELS[article.category] ?? article.category,
  platform: platform as "facebook",
  status: "pending",
  caption: null, hookLine: null, firstComment: null, imageBlobUrl: null,
  attempts: 0, regenerateCount: 0, lastError: null,
  postedAt: null, platformPostId: null, platformPostUrl: null,
  createdAt: now, updatedAt: now,
}]);

console.log(`enqueued ${platform} ${id}, processing…`);
await new Promise((r) => setTimeout(r, 2000));
const r = await processEntryById(id);
console.log(`${r.status} image=${r.imageBlobUrl ?? "✗"} caption=${r.caption?.length ?? 0}c`);
if (r.lastError) console.log(`err: ${r.lastError}`);
