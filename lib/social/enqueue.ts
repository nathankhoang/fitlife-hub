// Creates 4 pending SocialPostEntry rows — one per platform — for a
// just-published article. Feature-flagged via SOCIAL_AUTOPOST_ENABLED so
// it's safe to ship before platform adapters exist.

import { randomUUID } from "node:crypto";
import { addSocialEntries } from "./queue";
import { PLATFORMS, type Platform } from "./strategies";
import type { SocialPostEntry } from "./types";

const CATEGORY_LABELS: Record<string, string> = {
  "home-workouts": "Home Workouts",
  supplements: "Supplement Reviews",
  "diet-nutrition": "Diet & Nutrition",
  "weight-loss": "Weight Loss",
  "muscle-building": "Muscle Building",
  wellness: "Wellness & Recovery",
};

export type EnqueueContext = {
  slug: string;
  title: string;
  description: string;
  category: string;
};

function isEnabled(): boolean {
  return process.env.SOCIAL_AUTOPOST_ENABLED === "true";
}

function newEntry(ctx: EnqueueContext, platform: Platform): SocialPostEntry {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    articleSlug: ctx.slug,
    articleTitle: ctx.title,
    articleDescription: ctx.description,
    articleCategory: ctx.category,
    articleCategoryLabel: CATEGORY_LABELS[ctx.category] ?? ctx.category,
    platform,
    status: "pending",
    caption: null,
    hookLine: null,
    firstComment: null,
    imageBlobUrl: null,
    attempts: 0,
    regenerateCount: 0,
    lastError: null,
    postedAt: null,
    platformPostId: null,
    platformPostUrl: null,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Enqueue 4 pending social post entries (one per platform) for a published article.
 * Silent no-op when SOCIAL_AUTOPOST_ENABLED !== "true".
 */
export async function enqueueSocialPosts(ctx: EnqueueContext): Promise<SocialPostEntry[]> {
  if (!isEnabled()) return [];
  const entries = PLATFORMS.map((p) => newEntry(ctx, p));
  await addSocialEntries(entries);
  return entries;
}
