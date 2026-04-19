// Blob-backed CRUD for social-queue.json. Mirrors the patterns in
// lib/queue.ts (cached reads via next/cache tag, mutations via @vercel/blob
// put + revalidateTag).

import fs from "node:fs";
import path from "node:path";
import { put } from "@vercel/blob";
import { revalidateTag } from "next/cache";
import { SOCIAL_QUEUE_PATH, type SocialPostEntry } from "./types";

const CACHE_TAG = "social-queue";
const LOCAL_FILE = path.join(process.cwd(), "data", SOCIAL_QUEUE_PATH);

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

export function socialQueueUrl(): string {
  return `${blobBase()}/${SOCIAL_QUEUE_PATH}`;
}

function readLocal(): SocialPostEntry[] {
  if (!fs.existsSync(LOCAL_FILE)) return [];
  return JSON.parse(fs.readFileSync(LOCAL_FILE, "utf8")) as SocialPostEntry[];
}

function writeLocal(entries: SocialPostEntry[]): void {
  fs.mkdirSync(path.dirname(LOCAL_FILE), { recursive: true });
  fs.writeFileSync(LOCAL_FILE, JSON.stringify(entries, null, 2), "utf8");
}

/** Cached read for render paths. Invalidated by revalidateTag("social-queue"). */
export async function getSocialQueue(): Promise<SocialPostEntry[]> {
  if (!hasBlob()) return readLocal();
  const res = await fetch(socialQueueUrl(), {
    cache: "force-cache",
    next: { tags: [CACHE_TAG] },
  });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`Failed to fetch social queue: ${res.status}`);
  return (await res.json()) as SocialPostEntry[];
}

/** Uncached read for mutators. */
async function getSocialQueueFresh(): Promise<SocialPostEntry[]> {
  if (!hasBlob()) return readLocal();
  const res = await fetch(socialQueueUrl(), { cache: "no-store" });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`Failed to fetch social queue: ${res.status}`);
  return (await res.json()) as SocialPostEntry[];
}

async function writeSocialQueue(entries: SocialPostEntry[]): Promise<void> {
  if (!hasBlob()) {
    writeLocal(entries);
    return;
  }
  await put(SOCIAL_QUEUE_PATH, JSON.stringify(entries, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json; charset=utf-8",
  });
  // revalidateTag throws outside a Next.js request context (e.g. in CLI scripts).
  // Downgrade to a warning so ad-hoc worker runs aren't blocked; in-request
  // callers still get the cache invalidation.
  try {
    revalidateTag(CACHE_TAG, "max");
  } catch (err) {
    console.warn(`[social/queue] revalidateTag skipped: ${(err as Error).message}`);
  }
}

export async function addSocialEntries(newEntries: SocialPostEntry[]): Promise<void> {
  const entries = await getSocialQueueFresh();
  entries.push(...newEntries);
  await writeSocialQueue(entries);
}

export async function updateSocialEntry(
  id: string,
  patch: Partial<SocialPostEntry>,
): Promise<SocialPostEntry> {
  const entries = await getSocialQueueFresh();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error(`Social queue entry not found: ${id}`);
  const updated = { ...entries[idx], ...patch, updatedAt: new Date().toISOString() };
  entries[idx] = updated;
  await writeSocialQueue(entries);
  return updated;
}

export async function removeSocialEntry(id: string): Promise<void> {
  const entries = (await getSocialQueueFresh()).filter((e) => e.id !== id);
  await writeSocialQueue(entries);
}

/** Returns entries that a generation worker should pick up. */
export async function getPendingSocialEntries(limit?: number): Promise<SocialPostEntry[]> {
  const entries = await getSocialQueueFresh();
  const pending = entries.filter((e) => e.status === "pending");
  return limit ? pending.slice(0, limit) : pending;
}
