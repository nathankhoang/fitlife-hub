"use server";

import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { getQueue, updateQueueEntry, removeFromQueue } from "@/lib/queue";

export async function publishPost(slug: string): Promise<void> {
  const draftsDir = path.join(process.cwd(), "content", "drafts");
  const articlesDir = path.join(process.cwd(), "content", "articles");
  const src = path.join(draftsDir, `${slug}.mdx`);
  const dest = path.join(articlesDir, `${slug}.mdx`);

  if (!fs.existsSync(src)) {
    throw new Error(`Draft not found: content/drafts/${slug}.mdx`);
  }

  fs.copyFileSync(src, dest);
  updateQueueEntry(slug, {
    status: "published",
    publishedDate: new Date().toISOString(),
  });

  revalidatePath("/admin/queue");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
}

export async function deleteFromQueue(slug: string): Promise<void> {
  removeFromQueue(slug);
  revalidatePath("/admin/queue");
}
