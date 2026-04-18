// One-shot worker run: drain whatever's currently pending in the social queue.
// Unlike verify-social-pipeline.mts, this does NOT enqueue new entries.
//
// Run: npx tsx scripts/_drain-social.mts

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.loadEnvFile(path.join(ROOT, ".env.local"));

const { processSocialQueue } = await import("../lib/social/worker.ts");
const { getSocialQueue } = await import("../lib/social/queue.ts");

const before = await getSocialQueue();
const pending = before.filter((e) => e.status === "pending");
console.log(`[drain] pending: ${pending.length}`);
if (pending.length === 0) {
  console.log("[drain] nothing to do");
  process.exit(0);
}

const started = Date.now();
const result = await processSocialQueue({ batch: 10 });
console.log(`[drain] ${JSON.stringify(result)} in ${Date.now() - started}ms`);

const after = await getSocialQueue();
for (const e of after) {
  const changed = before.find((b) => b.id === e.id);
  if (changed && changed.status !== e.status) {
    console.log(`  ${e.platform.padEnd(10)} ${changed.status} → ${e.status}${e.lastError ? "  (" + e.lastError.slice(0, 80) + ")" : ""}`);
  }
}
