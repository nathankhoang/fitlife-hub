import fs from "fs";
import path from "path";
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

const queuePath = path.join(process.cwd(), "data", "queue.json");

export function getQueue(): QueueEntry[] {
  const raw = fs.readFileSync(queuePath, "utf8");
  return JSON.parse(raw) as QueueEntry[];
}

function writeQueue(entries: QueueEntry[]): void {
  fs.writeFileSync(queuePath, JSON.stringify(entries, null, 2), "utf8");
}

export function addToQueue(entry: QueueEntry): void {
  const entries = getQueue();
  entries.push(entry);
  writeQueue(entries);
}

export function updateQueueEntry(slug: string, patch: Partial<QueueEntry>): void {
  const entries = getQueue();
  const idx = entries.findIndex((e) => e.slug === slug);
  if (idx === -1) throw new Error(`Queue entry not found: ${slug}`);
  entries[idx] = { ...entries[idx], ...patch };
  writeQueue(entries);
}

export function removeFromQueue(slug: string): void {
  const entries = getQueue().filter((e) => e.slug !== slug);
  writeQueue(entries);
}
