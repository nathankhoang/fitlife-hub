// Drains pending SocialPostEntry rows by generating an image + caption
// for each and moving them to status = "awaiting_approval".
//
// Invoked by:
//   - app/api/cron/generate-social (bearer-authed Vercel Cron)
//   - ad-hoc scripts / admin tools
//
// Design notes:
//   - Each entry is processed independently; one failure doesn't block the rest.
//   - We mark the entry "generating" before work begins to discourage double-runs
//     if two workers race. We re-check status before writing terminal state.
//   - Each run is capped (default 20 entries) to stay well under the 300s function
//     timeout even if an entry hits the LLM retry path.

import path from "node:path";
import { put } from "@vercel/blob";
import { getArticleBySlug } from "../articles";
import { generateSocialImage } from "./generate-image";
import { generateCaption } from "./generate-caption";
import { extractHeroStat } from "./extract-stat";
import { STRATEGIES } from "./strategies";
import {
  getPendingSocialEntries,
  getSocialQueue,
  updateSocialEntry,
} from "./queue";
import { notifyGenerationFailure } from "./notify";
import {
  SOCIAL_GEN_MAX_ATTEMPTS,
  SOCIAL_IMAGES_PREFIX,
  type SocialPostEntry,
} from "./types";

const DEFAULT_BATCH = 20;

export type WorkerResult = {
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
};

function resolveHeroImage(articleImage: string, slug: string): string {
  if (/^https?:\/\//.test(articleImage)) return articleImage;
  // Local static path like "/images/articles/<slug>.webp" — resolve to public/.
  const clean = articleImage.replace(/^\/+/, "");
  const full = path.join(process.cwd(), "public", clean);
  return full.includes("images") ? full : path.join(process.cwd(), "public", "images", "articles", `${slug}.webp`);
}

async function processEntry(entry: SocialPostEntry): Promise<"ok" | "failed"> {
  // Mark "generating" first so concurrent workers skip this row.
  await updateSocialEntry(entry.id, { status: "generating", attempts: entry.attempts + 1 });

  const article = await getArticleBySlug(entry.articleSlug);
  if (!article) {
    await recordFailure(entry, `Article not found in store: ${entry.articleSlug}`);
    return "failed";
  }

  const heroImage = resolveHeroImage(article.image, entry.articleSlug);
  const variant = STRATEGIES[entry.platform].defaultImageVariant;

  try {
    // For stat-callout, we need a stat before rendering. Extract in parallel
    // with caption generation, then render.
    const statPromise =
      variant === "stat-callout"
        ? extractHeroStat({
            title: article.title,
            description: article.description,
            body: article.content,
          })
        : Promise.resolve(null);

    const [stat, caption] = await Promise.all([
      statPromise,
      generateCaption({
        article: {
          slug: article.slug,
          title: article.title,
          description: article.description,
          category: article.category,
          categoryLabel: entry.articleCategoryLabel,
          body: article.content,
        },
        platform: entry.platform,
      }),
    ]);

    const imageBuf = await generateSocialImage({
      title: article.title,
      categoryLabel: entry.articleCategoryLabel,
      heroImage: variant === "hero-photo" ? heroImage : undefined,
      statValue: stat?.value,
      statContext: stat?.context,
      platform: entry.platform,
      variant,
    });

    const imgKey = `${SOCIAL_IMAGES_PREFIX}/${entry.id}.webp`;
    const uploaded = await put(imgKey, imageBuf, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "image/webp",
    });

    await updateSocialEntry(entry.id, {
      status: "awaiting_approval",
      imageBlobUrl: uploaded.url,
      caption: caption.caption,
      hookLine: caption.hookLine,
      firstComment: caption.firstComment,
      lastError: null,
    });
    return "ok";
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await recordFailure(entry, message);
    return "failed";
  }
}

async function recordFailure(entry: SocialPostEntry, error: string): Promise<void> {
  // Use the attempt count we wrote above ("generating" + attempts+1).
  const nextAttempts = entry.attempts + 1;
  const terminal = nextAttempts >= SOCIAL_GEN_MAX_ATTEMPTS;
  const updated = await updateSocialEntry(entry.id, {
    status: terminal ? "failed" : "pending",
    lastError: error,
  });
  console.error(
    `[social/worker] ${entry.platform} ${entry.articleSlug} ${terminal ? "FAILED (terminal)" : "retry"}: ${error}`,
  );
  if (terminal) await notifyGenerationFailure(updated);
}

/** Process a single entry by id. Used by the admin UI's "Regenerate" action. */
export async function processEntryById(id: string): Promise<SocialPostEntry> {
  const entries = await getSocialQueue();
  const entry = entries.find((e) => e.id === id);
  if (!entry) throw new Error(`Social entry not found: ${id}`);
  await processEntry(entry);
  const refreshed = (await getSocialQueue()).find((e) => e.id === id);
  if (!refreshed) throw new Error(`Social entry vanished during processing: ${id}`);
  return refreshed;
}

export async function processSocialQueue(opts?: { batch?: number }): Promise<WorkerResult> {
  const batch = opts?.batch ?? DEFAULT_BATCH;
  const pending = await getPendingSocialEntries(batch);
  const result: WorkerResult = { processed: 0, succeeded: 0, failed: 0, skipped: 0 };

  for (const entry of pending) {
    result.processed += 1;
    try {
      const outcome = await processEntry(entry);
      if (outcome === "ok") result.succeeded += 1;
      else result.failed += 1;
    } catch (err) {
      result.failed += 1;
      console.error(`[social/worker] unexpected error on ${entry.id}:`, err);
    }
  }

  return result;
}
