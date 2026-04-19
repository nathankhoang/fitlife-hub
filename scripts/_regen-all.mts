// Reset every awaiting_approval or failed entry back to "pending" and
// re-drain through the current worker pipeline. Used to refresh the
// admin-queue preview after upgrading the generator.

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.loadEnvFile(path.join(ROOT, ".env.local"));

const { getSocialQueue, updateSocialEntry } = await import("../lib/social/queue.ts");
const { processSocialQueue } = await import("../lib/social/worker.ts");

const queue = await getSocialQueue();
const resettable = queue.filter((e) => e.status === "awaiting_approval" || e.status === "failed" || e.status === "pending");
console.log(`[regen-all] resetting ${resettable.length} entries to pending`);

for (const e of resettable) {
  await updateSocialEntry(e.id, {
    status: "pending",
    attempts: 0,
    lastError: null,
    caption: null,
    hookLine: null,
    firstComment: null,
    imageBlobUrl: null,
  });
}

console.log(`[regen-all] draining…`);
const started = Date.now();
const result = await processSocialQueue({ batch: 20 });
console.log(`[regen-all] ${JSON.stringify(result)} in ${Date.now() - started}ms`);

const after = await getSocialQueue();
for (const e of after.filter((x) => resettable.find((r) => r.id === x.id))) {
  console.log(`  ${e.platform.padEnd(10)} ${e.status.padEnd(20)} image=${e.imageBlobUrl ? "✓" : "✗"}`);
}
