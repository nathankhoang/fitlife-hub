// Directly append 2 pending entries (IG + FB) to social-queue.json on blob.
// Then call /api/cron/generate-social on the preview to run the worker.

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.loadEnvFile(path.join(ROOT, ".env.local"));
const base = process.env.BLOB_PUBLIC_BASE!;

const SLUG = process.argv[2] ?? "zone-2-cardio-performance-science";

type ArticleQueueEntry = { slug: string; title: string; description: string; category: string };
type SocialEntry = { id: string; platform: string; [k: string]: unknown };

const q = (await (await fetch(`${base}/queue.json?ts=${Date.now()}`)).json()) as ArticleQueueEntry[];
const article = q.find((e) => e.slug === SLUG);
if (!article) { console.error(`article not found: ${SLUG}`); process.exit(1); }

const current = (await (await fetch(`${base}/social-queue.json?ts=${Date.now()}`)).json()) as SocialEntry[];

const CATEGORY_LABELS: Record<string, string> = {
  "home-workouts": "Home Workouts", supplements: "Supplement Reviews",
  "diet-nutrition": "Diet & Nutrition", "weight-loss": "Weight Loss",
  "muscle-building": "Muscle Building", wellness: "Wellness & Recovery",
};

const now = new Date().toISOString();
const makeEntry = (platform: "instagram" | "facebook") => ({
  id: randomUUID(),
  articleSlug: SLUG,
  articleTitle: article.title,
  articleDescription: article.description,
  articleCategory: article.category,
  articleCategoryLabel: CATEGORY_LABELS[article.category] ?? article.category,
  platform,
  status: "pending" as const,
  caption: null, hookLine: null, firstComment: null, imageBlobUrl: null,
  attempts: 0, regenerateCount: 0, lastError: null,
  postedAt: null, platformPostId: null, platformPostUrl: null,
  createdAt: now, updatedAt: now,
});

const added = [makeEntry("instagram"), makeEntry("facebook")];
const next = [...current, ...added];

const r = await put("social-queue.json", JSON.stringify(next, null, 2), {
  access: "public", contentType: "application/json",
  addRandomSuffix: false, allowOverwrite: true,
});
console.log(`wrote ${next.length} entries (${added.length} new) to ${r.url}`);
console.log(`IG id: ${added[0].id}`);
console.log(`FB id: ${added[1].id}`);
