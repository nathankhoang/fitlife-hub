import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.loadEnvFile(path.join(ROOT, ".env.local"));
const { getSocialQueue, updateSocialEntry } = await import("../lib/social/queue.ts");
const { processEntryById } = await import("../lib/social/worker.ts");

const q = await getSocialQueue();
console.log(`forcing regen on ${q.length} entries`);
for (const e of q) {
  console.log(`\n→ ${e.platform} ${e.id}`);
  try {
    await updateSocialEntry(e.id, {
      status: "pending",
      attempts: 0,
      lastError: null,
      imageBlobUrl: null,
      caption: null,
      hookLine: null,
      firstComment: null,
    });
    const refreshed = await processEntryById(e.id);
    console.log(`  ${refreshed.status}  image=${refreshed.imageBlobUrl ? "✓" : "✗"}  caption=${refreshed.caption?.length ?? 0}c`);
  } catch (err) {
    console.log(`  ERROR: ${(err as Error).message}`);
  }
}
