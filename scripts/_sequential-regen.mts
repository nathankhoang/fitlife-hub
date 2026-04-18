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
for (const e of q) {
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
  // Let the Blob settle globally before the worker reads it back.
  await sleep(3000);

  try {
    const refreshed = await processEntryById(e.id);
    console.log(`  ${refreshed.status}  image=${refreshed.imageBlobUrl ? "✓" : "✗"}  caption=${refreshed.caption?.length ?? 0}c`);
    if (refreshed.lastError) console.log(`  err: ${refreshed.lastError.slice(0, 120)}`);
  } catch (err) {
    console.log(`  ERROR: ${(err as Error).message}`);
  }

  // Pause between entries: Groq TPM limit is 8000/min and we've seen bursts.
  await sleep(5000);
}
console.log("\nfinal:");
for (const e of await getSocialQueue()) {
  console.log(`  ${e.platform.padEnd(10)} ${e.status.padEnd(20)} image=${e.imageBlobUrl ? "✓" : "✗"}`);
}
