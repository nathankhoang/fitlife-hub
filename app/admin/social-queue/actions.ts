"use server";

import { revalidatePath } from "next/cache";
import {
  getSocialQueue,
  removeSocialEntry,
  updateSocialEntry,
} from "@/lib/social/queue";
import { processEntryById } from "@/lib/social/worker";
import { SOCIAL_REGENERATE_CAP, type SocialPostEntry } from "@/lib/social/types";
import { articleUrlFor, postToPlatform } from "@/lib/social/adapters";

const PAGE_PATH = "/admin/social-queue";

async function postApprovedEntry(entry: SocialPostEntry): Promise<void> {
  if (!entry.imageBlobUrl) throw new Error(`No image URL on entry ${entry.id}`);

  // Mark posting so the UI reflects the in-flight state; this also guards
  // against a double-click re-posting.
  await updateSocialEntry(entry.id, { status: "posting" });

  try {
    const result = await postToPlatform({
      entry,
      imageUrl: entry.imageBlobUrl,
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
    throw err;
  }
}

export async function approvePostAction(id: string): Promise<void> {
  const entries = await getSocialQueue();
  const entry = entries.find((e) => e.id === id);
  if (!entry) throw new Error(`Entry not found: ${id}`);
  if (entry.status !== "awaiting_approval" && entry.status !== "failed") {
    throw new Error(`Entry ${id} is in status ${entry.status}, cannot approve`);
  }
  await postApprovedEntry(entry);
  revalidatePath(PAGE_PATH);
}

export async function approveAllForArticleAction(articleSlug: string): Promise<void> {
  const entries = await getSocialQueue();
  const targets = entries.filter(
    (e) => e.articleSlug === articleSlug && e.status === "awaiting_approval",
  );
  // Post sequentially so one platform failure doesn't abort the rest, and so
  // we avoid hammering Meta's API with concurrent requests from the same token.
  for (const entry of targets) {
    try {
      await postApprovedEntry(entry);
    } catch (err) {
      console.error(`[social] batch approve: ${entry.platform} failed:`, err);
    }
  }
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
