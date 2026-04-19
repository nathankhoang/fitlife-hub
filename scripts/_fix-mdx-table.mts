// Fixes MDX parse error in fat-loss-cardio-programming-advanced.mdx where
// `<10%` / `>90%` in a markdown table are parsed as JSX tags. Wraps the
// affected values in backticks so MDX treats them as literal text.

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { put } from "@vercel/blob";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.loadEnvFile(path.join(ROOT, ".env.local"));
const base = process.env.BLOB_PUBLIC_BASE;
if (!base) throw new Error("BLOB_PUBLIC_BASE not set");
if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN not set");

const slug = "fat-loss-cardio-programming-advanced";
const blobPath = `articles/${slug}.mdx`;
const res = await fetch(`${base}/${blobPath}?ts=${Date.now()}`);
if (!res.ok) throw new Error(`fetch ${blobPath}: ${res.status}`);
const before = await res.text();

// Wrap `<NN%` and `>NN%` (with optional decimals) inside markdown table cells.
// Only inside table rows (lines starting with `|`). Do not touch non-table
// content so we don't accidentally mangle actual JSX elsewhere.
const after = before
  .split("\n")
  .map((line) => {
    if (!line.trim().startsWith("|")) return line;
    return line.replace(/(^|[^`])([<>])(\d+(?:\.\d+)?%?)/g, "$1`$2$3`");
  })
  .join("\n");

if (after === before) {
  console.log("No changes needed.");
  process.exit(0);
}

const diffLines = after.split("\n").map((l, i) => {
  const orig = before.split("\n")[i];
  return orig !== l ? `L${i + 1}: ${orig}\n    → ${l}` : null;
}).filter(Boolean);
console.log("Changes:\n" + diffLines.join("\n"));

const put1 = await put(blobPath, after, {
  access: "public",
  contentType: "text/markdown; charset=utf-8",
  addRandomSuffix: false,
  allowOverwrite: true,
});
console.log(`\nUploaded: ${put1.url}`);
