"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import {
  getSocialQueue,
  removeSocialEntry,
  updateSocialEntry,
} from "@/lib/social/queue";
import { processEntryById } from "@/lib/social/worker";
import { SOCIAL_REGENERATE_CAP, type SocialPostEntry } from "@/lib/social/types";
import { articleUrlFor, postToPlatform } from "@/lib/social/adapters";

const PAGE_PATH = "/admin/social-queue";

// Background-safe: runs inside `after()`, so errors must never reach the
// response. Updates status to posted/failed so the UI can reflect the final
// state on the next page refresh.
async function postInBackground(entry: SocialPostEntry): Promise<void> {
  try {
    const result = await postToPlatform({
      entry,
      imageUrl: entry.imageBlobUrl!,
      articleUrl: articleUrlFor(entry.articleSlug),
    });
    await updateSocialEntry(entry.id, {
      status: "posted",
      platformPostId: result.platformPostId,
      platformPostUrl: result.platformPostUrl,
      postedAt: new Date().toISOString(),
      lastError: null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await updateSocialEntry(entry.id, {
      status: "failed",
      lastError: `Post to ${entry.platform} failed: ${message}`,
    });
    console.error(`[social] post to ${entry.platform} failed:`, err);
  }
}

export async function approvePostAction(id: string): Promise<void> {
  const entries = await getSocialQueue();
  const entry = entries.find((e) => e.id === id);
  if (!entry) throw new Error(`Entry not found: ${id}`);
  if (entry.status !== "awaiting_approval" && entry.status !== "failed") {
    throw new Error(`Entry ${id} is in status ${entry.status}, cannot approve`);
  }
  if (!entry.imageBlobUrl) throw new Error(`No image URL on entry ${entry.id}`);

  // Flip to "posting" synchronously so the card reflects the in-flight state
  // immediately, then kick off the actual platform post in the background so
  // the button returns without waiting on IG's ~10-30s polling loop.
  await updateSocialEntry(id, { status: "posting" });
  after(() => postInBackground(entry));
  revalidatePath(PAGE_PATH);
}

export async function approveAllForArticleAction(articleSlug: string): Promise<void> {
  const entries = await getSocialQueue();
  const targets = entries.filter(
    (e) => e.articleSlug === articleSlug && e.status === "awaiting_approval" && e.imageBlobUrl,
  );
  for (const entry of targets) {
    await updateSocialEntry(entry.id, { status: "posting" });
  }
  // Posts run sequentially in the background so one platform failure can't
  // abort the rest and so we don't hammer Meta's API with parallel calls on
  // the same token.
  after(async () => {
    for (const entry of targets) {
      await postInBackground(entry);
    }
  });
  revalidatePath(PAGE_PATH);
}

export async function regenerateAction(id: string): Promise<void> {
  const entries = await getSocialQueue();
  const entry = entries.find((e) => e.id === id);
  if (!entry) throw new Error(`Entry not found: ${id}`);
  if (entry.regenerateCount >= SOCIAL_REGENERATE_CAP) {
    throw new Error(`Regenerate cap reached (${SOCIAL_REGENERATE_CAP}) for entry ${id}`);
  }
  // Reset back to pending so the worker reprocesses. Bump the user-initiated
  // regenerate counter; the worker's own attempt counter is independent.
  await updateSocialEntry(id, {
    status: "pending",
    regenerateCount: entry.regenerateCount + 1,
    attempts: 0,
    lastError: null,
    caption: null,
    hookLine: null,
    firstComment: null,
    imageBlobUrl: null,
  });
  await processEntryById(id);
  revalidatePath(PAGE_PATH);
}

export async function rejectAction(id: string): Promise<void> {
  await removeSocialEntry(id);
  revalidatePath(PAGE_PATH);
}
