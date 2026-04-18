import { put, del } from "@vercel/blob";
import { revalidateTag } from "next/cache";
import { getQueue, updateQueueEntry } from "./queue";

function blobBase(): string {
  const base = process.env.BLOB_PUBLIC_BASE;
  if (!base) {
    throw new Error(
      "BLOB_PUBLIC_BASE is not set. Run `vercel env pull .env.local` after creating the Blob store.",
    );
  }
  return base.replace(/\/$/, "");
}

export async function publishSlug(slug: string): Promise<void> {
  const draftUrl = `${blobBase()}/drafts/${slug}.mdx`;
  const res = await fetch(draftUrl, { cache: "no-store" });
  if (res.status === 404) {
    throw new Error(`Draft not found in Blob: drafts/${slug}.mdx`);
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch draft ${slug}: ${res.status}`);
  }
  const body = await res.text();

  await put(`articles/${slug}.mdx`, body, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "text/markdown; charset=utf-8",
  });

  await del(`drafts/${slug}.mdx`);

  await updateQueueEntry(slug, {
    status: "published",
    publishedDate: new Date().toISOString(),
  });

  revalidateTag(`article:v2:${slug}`, "max");
  revalidateTag(`draft:v2:${slug}`, "max");
}

export async function processExpiredScheduled(): Promise<string[]> {
  const now = Date.now();
  const queue = await getQueue();
  const expired = queue.filter(
    (e) =>
      e.status === "scheduled" &&
      e.scheduledDate !== null &&
      new Date(e.scheduledDate).getTime() <= now,
  );

  const publishedSlugs: string[] = [];
  for (const entry of expired) {
    try {
      await publishSlug(entry.slug);
      publishedSlugs.push(entry.slug);
      console.log(`[scheduler] auto-published ${entry.slug}`);
    } catch (err) {
      console.error(`[scheduler] failed to auto-publish ${entry.slug}:`, err);
    }
  }

  return publishedSlugs;
}
