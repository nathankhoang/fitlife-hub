"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { updateQueueEntry, removeFromQueue } from "@/lib/queue";
import { publishSlug } from "@/lib/scheduler";

export async function publishPost(slug: string): Promise<void> {
  await publishSlug(slug);
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
