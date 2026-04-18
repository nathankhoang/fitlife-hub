"use server";

import { revalidatePath } from "next/cache";
import {
  getSocialQueue,
  removeSocialEntry,
  updateSocialEntry,
} from "@/lib/social/queue";
import { processEntryById } from "@/lib/social/worker";
import { SOCIAL_REGENERATE_CAP } from "@/lib/social/types";

const PAGE_PATH = "/admin/social-queue";

export async function approvePostAction(id: string): Promise<void> {
  await updateSocialEntry(id, { status: "approved" });
  revalidatePath(PAGE_PATH);
}

export async function approveAllForArticleAction(articleSlug: string): Promise<void> {
  const entries = await getSocialQueue();
  const targets = entries.filter(
    (e) => e.articleSlug === articleSlug && e.status === "awaiting_approval",
  );
  for (const entry of targets) {
    await updateSocialEntry(entry.id, { status: "approved" });
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
