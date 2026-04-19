#!/usr/bin/env node
// Usage: node --env-file=.env.local scripts/sync-batch-to-blob.mjs [slug1 slug2 ...]
//
// Uploads the specified article MDX files (or all articles if no slugs given)
// plus data/queue.json to Vercel Blob, then calls /api/revalidate so the Next.js
// cache is flushed and the home page "guides published" count updates immediately.
//
// If BLOB_READ_WRITE_TOKEN is not set, exits 0 — local-only mode already reads
// from the filesystem so no sync is needed.

import fs from "node:fs";
import path from "node:path";
import { put } from "@vercel/blob";

const ROOT = process.cwd();
const ARTICLES_DIR = path.join(ROOT, "content", "articles");
const QUEUE_JSON = path.join(ROOT, "data", "queue.json");
const SITE_URL = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.log("BLOB_READ_WRITE_TOKEN not set — skipping Blob sync (filesystem mode).");
  process.exit(0);
}

const slugArgs = process.argv.slice(2);

async function putFile(localPath, remotePath, contentType) {
  const body = fs.readFileSync(localPath);
  const result = await put(remotePath, body, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType,
  });
  console.log(`  ✓ ${remotePath}`);
  return result.url;
}

async function main() {
  const slugs =
    slugArgs.length > 0
      ? slugArgs
      : fs.existsSync(ARTICLES_DIR)
        ? fs
            .readdirSync(ARTICLES_DIR)
            .filter((f) => f.endsWith(".mdx"))
            .map((f) => f.replace(/\.mdx$/, ""))
        : [];

  if (slugs.length > 0) {
    console.log(`Uploading ${slugs.length} article(s) to Blob...`);
    await Promise.all(
      slugs.map((slug) => {
        const localPath = path.join(ARTICLES_DIR, `${slug}.mdx`);
        if (!fs.existsSync(localPath)) {
          console.log(`  (skip) ${slug}.mdx not found locally`);
          return Promise.resolve();
        }
        return putFile(localPath, `articles/${slug}.mdx`, "text/markdown; charset=utf-8");
      }),
    );
  }

  if (fs.existsSync(QUEUE_JSON)) {
    console.log("Uploading queue.json to Blob...");
    await putFile(QUEUE_JSON, "queue.json", "application/json; charset=utf-8");
  }

  console.log(`Revalidating cache at ${SITE_URL}/api/revalidate...`);
  try {
    const res = await fetch(`${SITE_URL}/api/revalidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: process.env.REVALIDATE_SECRET }),
    });
    const data = await res.json().catch(() => ({}));
    console.log(`  ${res.ok ? "✓" : "✗"} revalidate: ${JSON.stringify(data)}`);
  } catch (err) {
    console.log(`  (skip) revalidation call failed: ${err.message}`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
