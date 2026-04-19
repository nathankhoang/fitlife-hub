#!/usr/bin/env node
/**
 * seed-affiliates-from-form.mjs
 *
 * Parses the client's starter-products answer from client.config.json and
 * appends AffiliateProduct entries to lib/affiliates.ts. One per line,
 * expected format:
 *
 *   Product name · Amazon URL · one-sentence reason
 *
 * Also accepts `|` or tab as separators. Blank lines and lines that don't
 * match are reported and skipped.
 *
 * The script is idempotent-ish: it won't append a product whose derived id
 * is already in the catalog. Safe to re-run after the operator tweaks the
 * form.
 *
 * Usage:
 *   node scripts/onboarding/seed-affiliates-from-form.mjs          # preview
 *   node scripts/onboarding/seed-affiliates-from-form.mjs --apply  # write
 */

import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { assertNotTemplateRepo } from "../_template-guard.mjs";

const root = path.resolve(
  path.dirname(url.fileURLToPath(import.meta.url)),
  "..",
  "..",
);
const CONFIG_PATH = path.join(root, "client.config.json");
const AFFILIATES_PATH = path.join(root, "lib", "affiliates.ts");

const APPLY =
  process.argv.includes("--apply") || process.argv.includes("--yes");

assertNotTemplateRepo({
  cwd: root,
  argv: process.argv,
  scriptName: "seed-affiliates-from-form",
});

function fail(msg) {
  console.error(`\u2717 ${msg}`);
  process.exit(1);
}
function ok(msg) {
  console.log(`\u2713 ${msg}`);
}
function info(msg) {
  console.log(`  ${msg}`);
}

if (!fs.existsSync(CONFIG_PATH)) fail(`Missing ${CONFIG_PATH}`);
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));

const starter = config?._operator?.starterProducts ?? "";
if (!starter.trim()) {
  ok("No starter products on the form — nothing to seed.");
  process.exit(0);
}

// -- Parse ----------------------------------------------------------------

const SEPARATORS = /\s*[·•|\t]+\s*/;

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function extractAmazonAsin(u) {
  try {
    const parsed = new URL(u);
    if (!/amazon\./i.test(parsed.hostname)) return null;
    const dpMatch = parsed.pathname.match(/\/dp\/([A-Z0-9]{10})/i);
    if (dpMatch) return dpMatch[1].toUpperCase();
    const gpMatch = parsed.pathname.match(/\/gp\/product\/([A-Z0-9]{10})/i);
    if (gpMatch) return gpMatch[1].toUpperCase();
    return null;
  } catch {
    return null;
  }
}

const lines = starter
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l.length > 0);

const parsed = [];
const skipped = [];

for (const line of lines) {
  const parts = line.split(SEPARATORS).map((p) => p.trim());
  if (parts.length < 2) {
    skipped.push({ line, reason: "fewer than 2 separators" });
    continue;
  }
  const [name, urlStr, ...rest] = parts;
  const description = rest.join(" · ").trim();
  if (!name || !urlStr) {
    skipped.push({ line, reason: "missing name or URL" });
    continue;
  }
  const asin = extractAmazonAsin(urlStr);
  const id = slugify(name);
  if (!id) {
    skipped.push({ line, reason: "couldn't derive id from name" });
    continue;
  }
  parsed.push({
    id,
    name,
    description: description || name,
    url: urlStr,
    asin,
    source: asin ? "amazon" : "amazon",
  });
}

// -- Read existing catalog to skip duplicates -----------------------------

const affiliatesSrc = fs.readFileSync(AFFILIATES_PATH, "utf8");
const existingIds = new Set(
  Array.from(affiliatesSrc.matchAll(/"([a-z0-9-]+)":\s*\{/g)).map((m) => m[1]),
);

const toAdd = parsed.filter((p) => !existingIds.has(p.id));
const duplicates = parsed.filter((p) => existingIds.has(p.id));

// -- Report ---------------------------------------------------------------

console.log("Parsed starter products:");
for (const p of parsed) {
  const marker = existingIds.has(p.id) ? "=" : "+";
  info(`  ${marker} ${p.id}  (${p.name})${p.asin ? `  [ASIN ${p.asin}]` : "  [manual URL]"}`);
}
if (skipped.length > 0) {
  console.log("\nSkipped:");
  for (const s of skipped) info(`  ! ${s.reason}: ${s.line.slice(0, 80)}`);
}
if (duplicates.length > 0) {
  info(`\n${duplicates.length} already in catalog (will not duplicate)`);
}

if (toAdd.length === 0) {
  ok("\nNothing new to add.");
  process.exit(0);
}

// -- Build the insertion block -------------------------------------------

function buildEntry(p) {
  const idStr = JSON.stringify(p.id);
  const nameStr = JSON.stringify(p.name);
  const descStr = JSON.stringify(p.description);
  const amzCall = p.asin
    ? `amz(${JSON.stringify(p.asin)})`
    : JSON.stringify(p.url);
  // No image guessed — operator adds later; placeholder.svg will render.
  return `  ${idStr}: {
    id: ${idStr},
    name: ${nameStr},
    description: ${descStr},
    rating: 4.5,
    priceRange: "$0-$0",
    url: ${amzCall},
    source: "amazon",
    imageUrl: "/images/products/placeholder.svg",
  },
`;
}

const block = toAdd.map(buildEntry).join("");

// -- Apply ----------------------------------------------------------------

if (!APPLY) {
  console.log("\nPreview only. Re-run with --apply to write to lib/affiliates.ts.");
  console.log("\nEntries that WOULD be added:");
  console.log(block);
  process.exit(0);
}

// Locate the closing brace of `export const affiliateProducts = { ... };`
// and insert the new block before it.
const anchor = /export const affiliateProducts:\s*Record<string,\s*AffiliateProduct>\s*=\s*\{/;
const match = affiliatesSrc.match(anchor);
if (!match) {
  fail(
    `Couldn't locate affiliateProducts declaration in ${path.relative(root, AFFILIATES_PATH)}. Edit manually.`,
  );
}

// Find the matching closing brace. Track depth from the declaration.
const start = match.index + match[0].length;
let depth = 1;
let end = -1;
for (let i = start; i < affiliatesSrc.length; i++) {
  const ch = affiliatesSrc[i];
  if (ch === "{") depth++;
  else if (ch === "}") {
    depth--;
    if (depth === 0) {
      end = i;
      break;
    }
  }
}
if (end === -1) fail("Malformed affiliateProducts declaration — no closing brace found.");

// Decide whether to prefix with \n based on what's before the closing brace.
const before = affiliatesSrc.slice(0, end);
const after = affiliatesSrc.slice(end);
const trimmedBefore = before.trimEnd();
const needsLeadingNewline = !trimmedBefore.endsWith("{") && !trimmedBefore.endsWith(",");
const prefix = needsLeadingNewline ? ",\n" : "\n";
const patched = trimmedBefore + prefix + block + after;

fs.writeFileSync(AFFILIATES_PATH, patched, "utf8");

ok(`Added ${toAdd.length} product(s) to ${path.relative(root, AFFILIATES_PATH)}`);
console.log();
console.log("Follow-ups the operator needs to do manually:");
console.log("  1. Add product images at public/images/products/<id>.webp");
console.log("  2. Fill in realistic priceRange (currently '$0-$0')");
console.log("  3. Verify rating (defaulted to 4.5)");
console.log("  4. Optionally add bestFor/pros/cons for richer cards");
