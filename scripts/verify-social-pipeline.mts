#!/usr/bin/env node
// End-to-end smoke test for the Phase 3 social pipeline.
//
// What it does:
//   1. Picks a real published article (first one in the queue unless a slug is passed)
//   2. Enqueues 4 pending social entries for it (simulating what publishSlug does)
//   3. Runs processSocialQueue to drain those entries
//   4. Prints the resulting queue rows
//
// Side effects: writes to Vercel Blob (social-queue.json, social-images/<id>.webp).
// Safe to re-run — entries are additive and identified by uuid.
//
// Run: npx tsx scripts/verify-social-pipeline.mts [slug]

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Env must be loaded BEFORE importing modules that init Blob / AI clients.
process.loadEnvFile(path.join(ROOT, ".env.local"));
// The worker checks SOCIAL_AUTOPOST_ENABLED only for enqueueSocialPosts; the
// verification script calls enqueue explicitly, so we force-enable here.
process.env.SOCIAL_AUTOPOST_ENABLED ??= "true";

const { getQueue } = await import("../lib/queue.ts");
const { enqueueSocialPosts } = await import("../lib/social/enqueue.ts");
const { getSocialQueue } = await import("../lib/social/queue.ts");
const { processSocialQueue } = await import("../lib/social/worker.ts");

function banner(label: string) {
  const line = "━".repeat(78);
  return `\n${line}\n  ${label}\n${line}`;
}

async function main() {
  const slugArg = process.argv[2];
  const articles = await getQueue();
  const published = articles.filter((a) => a.status === "published");
  if (published.length === 0) throw new Error("No published articles in queue");

  const target = slugArg ? published.find((a) => a.slug === slugArg) : published[0];
  if (!target) throw new Error(`Article not found (or not published): ${slugArg}`);

  console.log(banner(`1) ARTICLE`));
  console.log(`  slug:     ${target.slug}`);
  console.log(`  title:    ${target.title}`);
  console.log(`  category: ${target.category}`);

  console.log(banner(`2) ENQUEUE 4 PENDING ENTRIES`));
  const enqueued = await enqueueSocialPosts({
    slug: target.slug,
    title: target.title,
    description: target.description,
    category: target.category,
  });
  console.log(`  enqueued ${enqueued.length} entries:`);
  for (const e of enqueued) console.log(`    ${e.platform.padEnd(10)} id=${e.id}`);

  console.log(banner(`3) DRAIN PENDING → AWAITING_APPROVAL`));
  const started = Date.now();
  const result = await processSocialQueue({ batch: 10 });
  const ms = Date.now() - started;
  console.log(`  processed=${result.processed} succeeded=${result.succeeded} failed=${result.failed} (${ms}ms)`);

  console.log(banner(`4) RESULTING ENTRIES`));
  const queue = await getSocialQueue();
  const ours = queue.filter((e) => enqueued.some((x) => x.id === e.id));
  for (const e of ours) {
    console.log(`  ${e.platform.padEnd(10)} ${e.status.padEnd(20)} image=${e.imageBlobUrl ? "✓" : "✗"} caption=${e.caption ? e.caption.length + "c" : "✗"}`);
    if (e.lastError) console.log(`    lastError: ${e.lastError}`);
  }
}

main().catch((err) => {
  console.error("[verify] failed:", err);
  process.exit(1);
});
