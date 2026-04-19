// Regenerate just one platform's queue entry (for quickly refreshing a
// stale image URL without touching the others).
// Usage: npx tsx scripts/_regen-platform.mts <platform>

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.loadEnvFile(path.join(ROOT, ".env.local"));

const { getSocialQueue, updateSocialEntry } = await import("../lib/social/queue.ts");
const { processEntryById } = await import("../lib/social/worker.ts");

const platform = process.argv[2];
if (!platform) { console.error("usage: npx tsx scripts/_regen-platform.mts <platform>"); process.exit(1); }

const queue = await getSocialQueue();
const entry = queue.find((e) => e.platform === platform);
if (!entry) { console.error(`no entry for platform=${platform}`); process.exit(1); }

console.log(`resetting ${entry.id}…`);
await updateSocialEntry(entry.id, {
  status: "pending", attempts: 0, lastError: null,
  imageBlobUrl: null, caption: null, hookLine: null, firstComment: null,
});
await new Promise((r) => setTimeout(r, 2000));
const result = await processEntryById(entry.id);
console.log(`${result.platform} ${result.status} image=${result.imageBlobUrl ?? "✗"} caption=${result.caption?.length ?? 0}c`);
if (result.lastError) console.log(`err: ${result.lastError}`);
