#!/usr/bin/env node
/**
 * affiliate-audit.mjs — static analysis of the affiliate catalog.
 *
 * Tells the operator which products are pulling weight vs. sitting idle.
 * Surfaces:
 *   - Products referenced in 0 articles  → candidates for rotation
 *   - Products still using seed placeholders (priceRange "$0-$0",
 *     rating 4.5 default, imageUrl with "placeholder.svg")
 *   - References in MDX that point to product IDs missing from the
 *     catalog (broken links — would render nothing)
 *   - Top-referenced products (what's already working)
 *
 * Usage:
 *   node scripts/affiliate-audit.mjs              # human-readable table
 *   node scripts/affiliate-audit.mjs --json       # JSON, for scripting
 *
 * Works on both template and client repos (no template-guard — it's
 * purely read-only).
 */

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const AFFILIATES_PATH = path.join(root, "lib", "affiliates.ts");
const ARTICLES_DIR = path.join(root, "content", "articles");
const DRAFTS_DIR = path.join(root, "content", "drafts");
const JSON_OUTPUT = process.argv.includes("--json");

function fail(msg) {
  console.error(`\u2717 ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(AFFILIATES_PATH)) fail(`Missing ${AFFILIATES_PATH}`);

// ─── Parse the catalog ──────────────────────────────────────────────────────

const affiliatesSrc = fs.readFileSync(AFFILIATES_PATH, "utf8");

// Extract product IDs + metadata. We don't fully parse TS — we just find
// each `"<id>": {` opener, walk forward with a brace counter until the
// matching `}`, and sniff the fields out of that slice. Regex-only
// approaches fail on entries with nested arrays (pros, cons) because the
// non-greedy match stops at the first `}` it sees inside the array.
const catalog = new Map();
const OPENER_RE = /"([a-z0-9-]+)":\s*\{/g;
let opener;
while ((opener = OPENER_RE.exec(affiliatesSrc)) !== null) {
  const id = opener[1];
  let depth = 1;
  let i = opener.index + opener[0].length;
  while (i < affiliatesSrc.length && depth > 0) {
    const ch = affiliatesSrc[i];
    // Skip over string literals so braces inside strings don't confuse us.
    if (ch === '"') {
      i++;
      while (i < affiliatesSrc.length && affiliatesSrc[i] !== '"') {
        if (affiliatesSrc[i] === "\\") i++;
        i++;
      }
    } else if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
    }
    i++;
  }
  const body = affiliatesSrc.slice(opener.index + opener[0].length, i - 1);
  const name = (body.match(/\bname:\s*"([^"]+)"/) || [])[1] || id;
  const priceRange = (body.match(/\bpriceRange:\s*"([^"]+)"/) || [])[1] || "";
  const rating = Number((body.match(/\brating:\s*([\d.]+)/) || [])[1] || 0);
  const imageUrl = (body.match(/\bimageUrl:\s*"([^"]+)"/) || [])[1] || "";
  catalog.set(id, { id, name, priceRange, rating, imageUrl });
}

if (catalog.size === 0) {
  fail("Could not parse any entries from lib/affiliates.ts — format may have changed.");
}

// ─── Scan MDX for references ────────────────────────────────────────────────

function collectMdx(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => path.join(dir, f));
}

const mdxFiles = [...collectMdx(ARTICLES_DIR), ...collectMdx(DRAFTS_DIR)];
const referenceCounts = new Map();
const referencesInMissing = new Map();

const REF_RE = /\bid=(?:"([a-z0-9-]+)"|\{"([a-z0-9-]+)"\}|'([a-z0-9-]+)')/g;

for (const file of mdxFiles) {
  const src = fs.readFileSync(file, "utf8");
  let r;
  while ((r = REF_RE.exec(src)) !== null) {
    const id = r[1] || r[2] || r[3];
    if (!id) continue;
    // Only count ids that look like product IDs (present in catalog OR
    // distinctly affiliate-shaped — but we can't tell from attribute alone,
    // so we count against the catalog only; orphans tracked separately if
    // the MDX explicitly imports AffiliateProductCard and references an id
    // not in the catalog).
    if (catalog.has(id)) {
      referenceCounts.set(id, (referenceCounts.get(id) || 0) + 1);
    } else {
      // Track as potential orphan — but only if the surrounding context
      // looks like an AffiliateProductCard reference.
      const tagContext = src.slice(Math.max(0, r.index - 80), r.index);
      if (/AffiliateProduct(Card)?/i.test(tagContext)) {
        referencesInMissing.set(
          id,
          (referencesInMissing.get(id) || 0) + 1,
        );
      }
    }
  }
}

// ─── Classify ───────────────────────────────────────────────────────────────

const rows = Array.from(catalog.values()).map((p) => {
  const refs = referenceCounts.get(p.id) || 0;
  const placeholder =
    p.priceRange === "$0-$0" ||
    (p.rating === 4.5 && p.imageUrl.includes("placeholder.svg"));
  return { ...p, refs, placeholder };
});

rows.sort((a, b) => a.refs - b.refs || a.name.localeCompare(b.name));

const unreferenced = rows.filter((r) => r.refs === 0);
const placeholders = rows.filter((r) => r.placeholder);
const topReferenced = [...rows]
  .sort((a, b) => b.refs - a.refs)
  .filter((r) => r.refs > 0)
  .slice(0, 10);
const orphans = Array.from(referencesInMissing.entries()).map(([id, count]) => ({
  id,
  count,
}));

// ─── Output ─────────────────────────────────────────────────────────────────

if (JSON_OUTPUT) {
  console.log(
    JSON.stringify(
      {
        total: catalog.size,
        mdxFilesScanned: mdxFiles.length,
        unreferenced,
        placeholders,
        topReferenced,
        orphans,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

function pad(s, n) {
  s = String(s);
  return s.length >= n ? s.slice(0, n - 1) + "…" : s + " ".repeat(n - s.length);
}

console.log();
console.log(
  `Affiliate catalog audit — ${catalog.size} products, ${mdxFiles.length} MDX files scanned\n`,
);

console.log("── Top referenced (what's working) ──");
if (topReferenced.length === 0) {
  console.log("  (no products are referenced in any article yet)");
} else {
  for (const r of topReferenced) {
    console.log(`  ${pad(r.refs, 4)}  ${pad(r.id, 36)}  ${r.name}`);
  }
}
console.log();

console.log(
  `── Unreferenced (${unreferenced.length}) — rotation candidates ──`,
);
if (unreferenced.length === 0) {
  console.log("  (every product is cited somewhere)");
} else {
  for (const r of unreferenced.slice(0, 20)) {
    const pl = r.placeholder ? "  [placeholder]" : "";
    console.log(`  ${pad(r.id, 40)}  ${r.name}${pl}`);
  }
  if (unreferenced.length > 20) {
    console.log(`  ... and ${unreferenced.length - 20} more`);
  }
}
console.log();

if (placeholders.length > 0) {
  console.log(
    `── Placeholder data (${placeholders.length}) — fill in priceRange, rating, image ──`,
  );
  for (const r of placeholders.slice(0, 20)) {
    console.log(`  ${pad(r.id, 40)}  priceRange="${r.priceRange}" rating=${r.rating}`);
  }
  if (placeholders.length > 20) {
    console.log(`  ... and ${placeholders.length - 20} more`);
  }
  console.log();
}

if (orphans.length > 0) {
  console.log(
    `── Orphan references (${orphans.length}) — MDX cites product IDs not in the catalog ──`,
  );
  for (const o of orphans) {
    console.log(`  ${pad(o.id, 40)}  ${o.count} reference(s)`);
  }
  console.log();
}

console.log("Next steps:");
console.log(
  "  - Unreferenced products for >60 days are candidates to swap for newer / higher-commission alternatives.",
);
console.log(
  "  - Placeholder entries block the affiliate card from rendering useful info — prioritize filling these in.",
);
console.log(
  "  - Orphan references render no card at all — either add the product or remove the reference.",
);
