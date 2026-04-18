#!/usr/bin/env node
// Usage: node --env-file=.env.local scripts/push-one-mdx.mjs <slug>
// Pushes content/articles/<slug>.mdx to Vercel Blob at articles/<slug>.mdx.
// Surgical alternative to seed:blob when only one MDX has changed.

import fs from "node:fs";
import path from "node:path";
import { put } from "@vercel/blob";

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node --env-file=.env.local scripts/push-one-mdx.mjs <slug>");
  process.exit(1);
}

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error("BLOB_READ_WRITE_TOKEN not set. Run `vercel env pull .env.local` first.");
  process.exit(1);
}

const localPath = path.join(process.cwd(), "content", "articles", `${slug}.mdx`);
if (!fs.existsSync(localPath)) {
  console.error(`Not found: ${localPath}`);
  process.exit(1);
}

const body = fs.readFileSync(localPath);
const result = await put(`articles/${slug}.mdx`, body, {
  access: "public",
  addRandomSuffix: false,
  allowOverwrite: true,
  contentType: "text/markdown; charset=utf-8",
});
console.log(`Uploaded ${slug}.mdx → ${result.url}`);
