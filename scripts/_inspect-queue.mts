import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.loadEnvFile(path.join(ROOT, ".env.local"));
const { getSocialQueue } = await import("../lib/social/queue.ts");
const q = await getSocialQueue();
const slug = process.argv[2] ?? "creatine-monohydrate-review-2026";
const target = q.filter((e) => e.articleSlug === slug).slice(-4);
console.log(`Total social queue entries: ${q.length}`);
console.log(`Most recent 4 for ${slug}:`);
for (const e of target) {
  const imgMark = e.imageBlobUrl ? "✓" : "✗";
  const capMark = e.caption ? `${e.caption.length}c` : "✗";
  console.log(`  ${e.platform.padEnd(10)} ${e.status.padEnd(20)} image=${imgMark} caption=${capMark}`);
  if (e.imageBlobUrl) console.log(`    img: ${e.imageBlobUrl}`);
  if (e.lastError) console.log(`    err: ${e.lastError.slice(0, 140)}`);
}
