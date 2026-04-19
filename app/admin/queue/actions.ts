"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getQueue, updateQueueEntry, removeFromQueue } from "@/lib/queue";
import { publishSlug } from "@/lib/scheduler";
import { createBroadcast } from "@/lib/beehiiv";
import { SITE_URL } from "@/lib/site";

export async function publishPost(slug: string): Promise<void> {
  const queue = await getQueue();
  const entry = queue.find((e) => e.slug === slug);

  await publishSlug(slug);

  if (entry && !entry.broadcastId) {
    const broadcastId = await createBroadcast({
      title: entry.title,
      description: entry.description,
      slug,
      siteUrl: SITE_URL,
    });
    if (broadcastId) {
      await updateQueueEntry(slug, { broadcastId });
    }
  }

  revalidatePath("/admin/queue");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/");
}

export async function schedulePost(
  slug: string,
  formData: FormData,
): Promise<void> {
  const raw = formData.get("scheduledDate");
  if (typeof raw !== "string" || raw === "") {
    throw new Error("scheduledDate is required");
  }
  const isoDate = new Date(raw).toISOString();
  await updateQueueEntry(slug, {
    status: "scheduled",
    scheduledDate: isoDate,
  });
  revalidatePath("/admin/queue");
}

export async function unschedulePost(slug: string): Promise<void> {
  await updateQueueEntry(slug, {
    status: "draft",
    scheduledDate: null,
  });
  revalidatePath("/admin/queue");
}

export async function deleteFromQueue(slug: string): Promise<void> {
  await removeFromQueue(slug);
  revalidateTag(`article:v2:${slug}`, "max");
  revalidateTag(`draft:v2:${slug}`, "max");
  revalidatePath("/admin/queue");
  revalidatePath("/blog");
  revalidatePath("/");
}

export async function sendNewsletter(slug: string): Promise<void> {
  const queue = await getQueue();
  const entry = queue.find((e) => e.slug === slug);
  if (!entry) throw new Error(`Queue entry not found: ${slug}`);
  if (entry.broadcastId) return;

  const broadcastId = await createBroadcast({
    title: entry.title,
    description: entry.description,
    slug,
    siteUrl: SITE_URL,
  });
  if (broadcastId) {
    await updateQueueEntry(slug, { broadcastId });
  }
  revalidatePath("/admin/queue");
}
