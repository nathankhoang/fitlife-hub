// Sequential regen with pauses to avoid Blob eventual-consistency races.
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.loadEnvFile(path.join(ROOT, ".env.local"));
const { getSocialQueue, updateSocialEntry } = await import("../lib/social/queue.ts");
const { processEntryById } = await import("../lib/social/worker.ts");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const q = await getSocialQueue();
// Only regen entries that need it — don't clobber awaiting_approval ones.
const pending = q.filter((e) => e.status === "pending" || e.status === "generating" || e.status === "failed");
for (const e of pending) {
  console.log(`→ ${e.platform}`);
  await updateSocialEntry(e.id, {
    status: "pending",
    attempts: 0,
    lastError: null,
    imageBlobUrl: null,
    caption: null,
    hookLine: null,
    firstComment: null,
  });
  await sleep(3000);

  try {
    const refreshed = await processEntryById(e.id);
    console.log(`  ${refreshed.status}  image=${refreshed.imageBlobUrl ? "✓" : "✗"}  caption=${refreshed.caption?.length ?? 0}c`);
    if (refreshed.lastError) console.log(`  err: ${refreshed.lastError.slice(0, 120)}`);
  } catch (err) {
    console.log(`  ERROR: ${(err as Error).message}`);
  }

  // 45s pause: Groq TPM is 8000/min. A stat-callout entry uses ~4000 tokens
  // (extract-stat + generate-caption both use reasoning mode). 45s keeps us
  // well under the burst limit.
  await sleep(45000);
}
console.log("\nfinal:");
for (const e of await getSocialQueue()) {
  console.log(`  ${e.platform.padEnd(10)} ${e.status.padEnd(20)} image=${e.imageBlobUrl ? "✓" : "✗"}`);
}
