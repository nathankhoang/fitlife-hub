#!/usr/bin/env node
// Usage: node --env-file=.env.local scripts/seed-blob.mjs
//
// One-shot uploader: pushes content/articles/*.mdx, content/drafts/*.mdx,
// and data/queue.json up to Vercel Blob. Idempotent via allowOverwrite: true.

import fs from "node:fs";
import path from "node:path";
import { put } from "@vercel/blob";

const ROOT = process.cwd();
const ARTICLES_DIR = path.join(ROOT, "content", "articles");
const DRAFTS_DIR = path.join(ROOT, "content", "drafts");
const QUEUE_JSON = path.join(ROOT, "data", "queue.json");

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error(
    "BLOB_READ_WRITE_TOKEN not set. Run `vercel env pull .env.local` then re-run with `node --env-file=.env.local scripts/seed-blob.mjs`.",
  );
  process.exit(1);
}

async function putFile(localPath, remotePath, contentType) {
  const body = fs.readFileSync(localPath);
  const result = await put(remotePath, body, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType,
  });
  console.log(`  ${remotePath}  →  ${result.url}`);
  return result.url;
}

async function seedDir(localDir, prefix) {
  if (!fs.existsSync(localDir)) {
    console.log(`(skip) ${localDir} does not exist`);
    return [];
  }
  const files = fs
    .readdirSync(localDir)
    .filter((f) => f.endsWith(".mdx"));
  const urls = [];
  for (const file of files) {
    const url = await putFile(
      path.join(localDir, file),
      `${prefix}/${file}`,
      "text/markdown; charset=utf-8",
    );
    urls.push(url);
  }
  return urls;
}

async function main() {
  console.log("Seeding Vercel Blob...\n");

  console.log("Articles:");
  const articleUrls = await seedDir(ARTICLES_DIR, "articles");

  console.log("\nDrafts:");
  await seedDir(DRAFTS_DIR, "drafts");

  console.log("\nQueue:");
  if (fs.existsSync(QUEUE_JSON)) {
    await putFile(QUEUE_JSON, "queue.json", "application/json; charset=utf-8");
  } else {
    console.log("  (skip) data/queue.json does not exist");
  }

  if (articleUrls.length > 0) {
    const sample = new URL(articleUrls[0]);
    const base = `${sample.protocol}//${sample.host}`;
    console.log(`\nDone. Blob public base: ${base}`);
    console.log(
      `\nSet this as BLOB_PUBLIC_BASE in Vercel env (Production, Preview, Development):`,
    );
    console.log(`  vercel env add BLOB_PUBLIC_BASE`);
    console.log(`  # paste: ${base}`);
  } else {
    console.log("\nDone (no articles uploaded — Blob base not captured).");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
