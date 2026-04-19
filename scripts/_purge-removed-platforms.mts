// One-time cleanup: remove twitter/linkedin entries from social-queue.json
// after those platforms were dropped from the autoposting pipeline.

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { put } from "@vercel/blob";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.loadEnvFile(path.join(ROOT, ".env.local"));
const base = process.env.BLOB_PUBLIC_BASE;
if (!base) throw new Error("BLOB_PUBLIC_BASE not set");
if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN not set");

const res = await fetch(`${base}/social-queue.json?ts=${Date.now()}`);
const all = (await res.json()) as { id: string; platform: string }[];
const kept = all.filter((e) => e.platform === "instagram" || e.platform === "facebook");
const removed = all.length - kept.length;

if (removed === 0) {
  console.log("Nothing to purge.");
  process.exit(0);
}

const uploaded = await put("social-queue.json", JSON.stringify(kept, null, 2), {
  access: "public",
  contentType: "application/json",
  addRandomSuffix: false,
  allowOverwrite: true,
});
console.log(`Removed ${removed} entries. ${kept.length} remaining. ${uploaded.url}`);
