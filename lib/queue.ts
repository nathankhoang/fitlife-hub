import fs from "fs";
import path from "path";
import { put } from "@vercel/blob";
import { revalidateTag } from "next/cache";
import { Category } from "./articles";

export type QueueEntry = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: Category;
  status: "draft" | "scheduled" | "published";
  scheduledDate: string | null;
  publishedDate: string | null;
  createdAt: string;
  featured: boolean;
  readTime: number;
  affiliateProductIds: string[];
};

const QUEUE_PATH = "queue.json";
const LOCAL_QUEUE = path.join(process.cwd(), "data", "queue.json");

function hasBlob(): boolean {
  return !!process.env.BLOB_PUBLIC_BASE;
}

function blobBase(): string {
  const base = process.env.BLOB_PUBLIC_BASE;
  if (!base) {
    throw new Error(
      "BLOB_PUBLIC_BASE is not set. Run `vercel env pull .env.local` after creating the Blob store.",
    );
  }
  return base.replace(/\/$/, "");
}

export function queueUrl(): string {
  return `${blobBase()}/${QUEUE_PATH}`;
}

function readLocalQueue(): QueueEntry[] {
  if (!fs.existsSync(LOCAL_QUEUE)) return [];
  return JSON.parse(fs.readFileSync(LOCAL_QUEUE, "utf8")) as QueueEntry[];
}

export async function getQueue(): Promise<QueueEntry[]> {
  if (!hasBlob()) return readLocalQueue();
  const res = await fetch(queueUrl(), { cache: "no-store" });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`Failed to fetch queue: ${res.status}`);
  return (await res.json()) as QueueEntry[];
}

// Uncached read, for mutators that must not read stale state.
async function getQueueFresh(): Promise<QueueEntry[]> {
  if (!hasBlob()) return readLocalQueue();
  const res = await fetch(queueUrl(), { cache: "no-store" });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`Failed to fetch queue: ${res.status}`);
  return (await res.json()) as QueueEntry[];
}

async function writeQueue(entries: QueueEntry[]): Promise<void> {
  if (!hasBlob()) {
    throw new Error(
      "Queue writes require Vercel Blob. Run `vercel env pull .env.local` after creating the Blob store.",
    );
  }
  await put(QUEUE_PATH, JSON.stringify(entries, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json; charset=utf-8",
  });
  revalidateTag("queue", "max");
}

export async function addToQueue(entry: QueueEntry): Promise<void> {
  const entries = await getQueueFresh();
  entries.push(entry);
  await writeQueue(entries);
}

export async function updateQueueEntry(
  slug: string,
  patch: Partial<QueueEntry>,
): Promise<void> {
  const entries = await getQueueFresh();
  const idx = entries.findIndex((e) => e.slug === slug);
  if (idx === -1) throw new Error(`Queue entry not found: ${slug}`);
  entries[idx] = { ...entries[idx], ...patch };
  await writeQueue(entries);
}

export async function removeFromQueue(slug: string): Promise<void> {
  const entries = (await getQueueFresh()).filter((e) => e.slug !== slug);
  await writeQueue(entries);
}
