#!/usr/bin/env node
/**
 * reset-content.mjs — clean-slate the editorial content for a new client.
 *
 * After `npm run rebrand`, the site still ships with LeanBodyEngine's
 * editorial choices — a full affiliate catalog, 8 supplement comparisons,
 * the existing publish queue. Most clients will want to start with an empty
 * slate and populate their own.
 *
 * This script:
 *   - Empties lib/affiliates.ts   (affiliateProducts → {})
 *   - Empties lib/comparisons.ts  (comparisons → [])
 *   - Empties data/queue.json     ([])
 *
 * It preserves types, helper functions, and the import surface so no
 * downstream code has to change. Tools, schema emitters, the comparison
 * framework itself — all untouched.
 *
 * Usage:
 *   node scripts/reset-content.mjs            # dry-run — shows what would happen
 *   node scripts/reset-content.mjs --yes      # actually write the files
 *
 * Safety:
 *   - Aborts if the worktree has uncommitted changes (so a mistake is
 *     recoverable via git checkout).
 *   - Does NOT touch content/articles/*.mdx or the Blob store; the
 *     client-session should clear those separately.
 */

import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { execSync } from "node:child_process";

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const AFFILIATES_PATH = path.join(root, "lib", "affiliates.ts");
const COMPARISONS_PATH = path.join(root, "lib", "comparisons.ts");
const QUEUE_PATH = path.join(root, "data", "queue.json");

const YES = process.argv.includes("--yes") || process.argv.includes("-y");

function ok(msg) {
  console.log(`\u2713 ${msg}`);
}
function info(msg) {
  console.log(`  ${msg}`);
}
function fail(msg) {
  console.error(`\u2717 ${msg}`);
  process.exit(1);
}

// Safety — require a clean worktree so the operator can `git checkout` on regret.
try {
  const status = execSync("git status --porcelain", { cwd: root }).toString().trim();
  if (status && YES) {
    fail(
      "Worktree has uncommitted changes. Commit or stash them first so this reset is recoverable via git.",
    );
  }
} catch {
  // Not in a git repo — allow but warn.
  console.warn("Not inside a git repository; skipping clean-worktree check.");
}

// ---- Target file templates --------------------------------------------------

const affiliatesOut = `import { brand } from "./brand";

export type AffiliateProduct = {
  id: string;
  name: string;
  description: string;
  rating: number;
  reviewCount?: number;
  priceRange: string;
  url: string;
  source: "amazon" | "clickbank" | "shareasale";
  imageUrl?: string;
  bestFor?: string;
  pros?: string[];
  cons?: string[];
  secondaryUrl?: string;
  secondaryLabel?: string;
};

/* eslint-disable @typescript-eslint/no-unused-vars */
const amz = (asin: string) =>
  \`https://www.amazon.com/dp/\${asin}?tag=\${brand.affiliates.amazonTag}\`;
const img = (id: string, ext: "webp" | "svg" = "webp") =>
  \`/images/products/\${id}.\${ext}\`;
/* eslint-enable @typescript-eslint/no-unused-vars */

/**
 * Clean slate: add products the client has curated and knows they'll stand
 * behind long-term. Every entry should have a real affiliate URL (via amz()
 * or the client's ClickBank / ShareASale IDs), a real image at
 * public/images/products/<id>.webp, and genuine editorial notes — the
 * honesty of this catalog is the entire trust proposition.
 *
 * Example:
 *
 *   "optimum-nutrition-gold-standard": {
 *     id: "optimum-nutrition-gold-standard",
 *     name: "Optimum Nutrition Gold Standard 100% Whey",
 *     description: "The world's best-selling whey...",
 *     rating: 4.8,
 *     priceRange: "$30-$60",
 *     url: amz("B000QSNYGI"),
 *     source: "amazon",
 *     imageUrl: img("optimum-nutrition-gold-standard"),
 *   },
 */
export const affiliateProducts: Record<string, AffiliateProduct> = {};
`;

const comparisonsOut = `import { affiliateProducts, type AffiliateProduct } from "./affiliates";

export type ComparisonPick = {
  label: string;
  productId: string;
  reason: string;
};

export type ComparisonSide = {
  productId: string;
  heading: string;
  summary: string;
  pros: string[];
  cons: string[];
};

export type Comparison = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  category: string;
  a: ComparisonSide;
  b: ComparisonSide;
  picks: ComparisonPick[];
  verdict: string;
  faq: { question: string; answer: string }[];
};

/**
 * Clean slate: each comparison is a dedicated SEO surface for an "X vs Y"
 * query the client cares about. Hand-curate them — templated or AI-generic
 * content won't rank here. Both productIds must exist in affiliateProducts.
 *
 * See docs/CLIENT_SETUP.md for content strategy guidance.
 */
export const comparisons: Comparison[] = [];

export function getComparison(slug: string): Comparison | null {
  return comparisons.find((c) => c.slug === slug) ?? null;
}

export function getProduct(productId: string): AffiliateProduct | null {
  return affiliateProducts[productId] ?? null;
}
`;

const queueOut = "[]\n";

// ---- Dry-run report ---------------------------------------------------------

const actions = [
  {
    path: AFFILIATES_PATH,
    label: "lib/affiliates.ts",
    before: fs.existsSync(AFFILIATES_PATH)
      ? fs.readFileSync(AFFILIATES_PATH, "utf8")
      : null,
    after: affiliatesOut,
  },
  {
    path: COMPARISONS_PATH,
    label: "lib/comparisons.ts",
    before: fs.existsSync(COMPARISONS_PATH)
      ? fs.readFileSync(COMPARISONS_PATH, "utf8")
      : null,
    after: comparisonsOut,
  },
  {
    path: QUEUE_PATH,
    label: "data/queue.json",
    before: fs.existsSync(QUEUE_PATH) ? fs.readFileSync(QUEUE_PATH, "utf8") : null,
    after: queueOut,
  },
];

console.log(YES ? "Resetting editorial content..." : "Dry run — nothing written. Pass --yes to apply.");
console.log();

for (const a of actions) {
  if (a.before === null) {
    info(`${a.label} — does not exist (skip)`);
    continue;
  }
  const beforeBytes = Buffer.byteLength(a.before, "utf8");
  const afterBytes = Buffer.byteLength(a.after, "utf8");
  const delta = beforeBytes - afterBytes;
  info(
    `${a.label} — ${beforeBytes.toLocaleString()} B → ${afterBytes.toLocaleString()} B (-${delta.toLocaleString()} B)`,
  );
}

if (!YES) {
  console.log();
  console.log("Review the plan above. Run again with --yes to apply.");
  process.exit(0);
}

// ---- Write --------------------------------------------------------------

for (const a of actions) {
  if (a.before === null) continue;
  fs.mkdirSync(path.dirname(a.path), { recursive: true });
  fs.writeFileSync(a.path, a.after, "utf8");
  ok(`Wrote ${a.label}`);
}

console.log();
console.log("Next steps:");
console.log("  1. Review git diff on the three files above");
console.log("  2. Add the client's own affiliate products to lib/affiliates.ts");
console.log("  3. Curate 3-5 comparison matchups in lib/comparisons.ts");
console.log("  4. Delete or replace content/articles/*.mdx seeds if desired");
console.log("  5. Clear published articles from the Blob store if this is a");
console.log("     fresh deploy (articles/ prefix) — see docs/CLIENT_SETUP.md");
console.log("  6. Commit: git add -A && git commit -m 'Clean editorial content for <client>'");
