import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.loadEnvFile(path.join(ROOT, ".env.local"));
const { getSocialQueue, updateSocialEntry } = await import("../lib/social/queue.ts");
const { processEntryById } = await import("../lib/social/worker.ts");

const q = await getSocialQueue();
const stuck = q.filter((x) => x.status === "generating" || x.status === "pending");
for (const e of stuck) {
  console.log(`  unsticking ${e.platform} ${e.id}`);
  await updateSocialEntry(e.id, {
    status: "pending",
    attempts: 0,
    lastError: null,
    imageBlobUrl: null,
    caption: null,
    hookLine: null,
  });
  await processEntryById(e.id);
}

const after = await getSocialQueue();
for (const e of after) {
  console.log(`  ${e.platform.padEnd(10)} ${e.status.padEnd(20)}`);
}
