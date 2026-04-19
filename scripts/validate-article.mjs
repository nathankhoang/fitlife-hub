#!/usr/bin/env node
/**
 * validate-article.mjs
 *
 * Validates one or more MDX article files before publishing.
 * Run: node scripts/validate-article.mjs <slug1> [slug2 ...]
 *      node scripts/validate-article.mjs --all          (validate every file in content/articles/)
 *
 * Exits 0 if all articles pass. Exits 1 if any fail.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ARTICLES_DIR = path.join(ROOT, "content", "articles");
const PUBLIC_IMAGES_DIR = path.join(ROOT, "public", "images", "articles");
const QUEUE_PATH = path.join(ROOT, "data", "queue.json");

// ─── RULES ────────────────────────────────────────────────────────────────────

/**
 * The ONLY JSX components allowed inside MDX articles.
 * Any other capitalised tag is an error.
 */
const ALLOWED_COMPONENTS = new Set([
  "AffiliateProductCard",
  "ComparisonTable",
]);

/** Correct usage: <AffiliateProductCard productId="..." /> */
const AFFILIATE_CORRECT_RE = /<AffiliateProductCard\s+productId="[^"]+"\s*\/>/g;

/** Wrong variants that sub-agents have invented in the past */
const AFFILIATE_WRONG_PATTERNS = [
  { re: /<AffiliateCard\b/g,   fix: '<AffiliateProductCard productId="..." />' },
  { re: /<AffiliateProduct\b(?!Card)/g, fix: '<AffiliateProductCard productId="..." />' },
  { re: /productId={/g,        fix: 'productId="..." (string, not JSX expression)' },
  { re: / id="[^"]*"\s*\/>/g,  fix: 'productId="..." not id="..."' },
];

/** Required frontmatter fields */
const REQUIRED_FRONTMATTER = ["title", "description", "category", "date", "readTime", "image"];

/** Valid categories */
const VALID_CATEGORIES = new Set([
  "home-workouts", "supplements", "diet-nutrition",
  "weight-loss", "muscle-building", "wellness",
]);

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function parseFrontmatter(src) {
  const match = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const fm = {};
  for (const line of match[1].split(/\r?\n/)) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim().replace(/^["']|["']$/g, "");
    fm[key] = val;
  }
  return fm;
}

function getBody(src) {
  return src.replace(/^---[\s\S]*?---\r?\n/, "");
}

function isInsideCodeBlock(src, idx) {
  const before = src.slice(0, idx);
  const fenceCount = (before.match(/```/g) || []).length;
  return fenceCount % 2 !== 0;
}

// ─── VALIDATORS ───────────────────────────────────────────────────────────────

function validateFrontmatter(fm, slug, errors) {
  if (!fm) { errors.push("  ✗ Missing frontmatter block"); return; }

  for (const field of REQUIRED_FRONTMATTER) {
    if (!fm[field] || fm[field] === '""' || fm[field] === "''") {
      errors.push(`  ✗ Frontmatter missing or empty: ${field}`);
    }
  }

  if (fm.category && !VALID_CATEGORIES.has(fm.category)) {
    errors.push(`  ✗ Invalid category "${fm.category}". Must be one of: ${[...VALID_CATEGORIES].join(", ")}`);
  }

  if (fm.description && fm.description.length > 165) {
    errors.push(`  ✗ description is ${fm.description.length} chars (max 165)`);
  }

  if (fm.image && fm.image !== '""') {
    const imgPath = path.join(ROOT, "public", fm.image);
    if (!fs.existsSync(imgPath)) {
      errors.push(`  ✗ Hero image not found on disk: public${fm.image}`);
    }
  } else {
    errors.push(`  ✗ image frontmatter is empty — run ensure-images.mjs`);
  }
}

function validateComponents(body, errors) {
  // Find all JSX-like opening tags (capitalised)
  const tagRe = /<([A-Z][A-Za-z0-9]*)/g;
  let m;
  while ((m = tagRe.exec(body)) !== null) {
    if (isInsideCodeBlock(body, m.index)) continue;
    const tag = m[1];
    if (!ALLOWED_COMPONENTS.has(tag)) {
      errors.push(`  ✗ Unknown MDX component <${tag}> — only allowed: ${[...ALLOWED_COMPONENTS].join(", ")}`);
    }
  }

  // Check for wrong AffiliateProductCard usage patterns
  for (const { re, fix } of AFFILIATE_WRONG_PATTERNS) {
    re.lastIndex = 0;
    if (re.test(body)) {
      errors.push(`  ✗ Wrong affiliate component syntax — use: ${fix}`);
    }
  }
}

function validateMdxSyntax(body, errors) {
  const lines = body.split("\n");
  lines.forEach((line, i) => {
    // Inside a code block — skip
    // (simplified: full code-block detection is done in validateComponents)

    // Bare < or > followed by a digit in table cells — will be parsed as JSX tag
    if (/\|\s*<\d/.test(line)) {
      errors.push(`  ✗ Line ${i + 1}: bare "<${line.match(/<(\d)/)[1]}..." in table cell — escape as &lt;${line.match(/<(\d)/)[1]}...`);
    }
    if (/\|\s*>\d/.test(line)) {
      errors.push(`  ✗ Line ${i + 1}: bare ">digit" in table cell — escape as &gt;`);
    }

    // AffiliateProductCard without self-closing slash
    if (/<AffiliateProductCard[^/]*[^/]>/.test(line) && !/<AffiliateProductCard[^>]*\/>/.test(line)) {
      errors.push(`  ✗ Line ${i + 1}: <AffiliateProductCard> must be self-closing: <AffiliateProductCard productId="..." />`);
    }
  });
}

function validateNoDuplicateImage(slug, fm, errors) {
  if (!fm || !fm.image || fm.image === '""') return;

  // Check if this image file is referenced by any other article
  const imgBasename = path.basename(fm.image); // e.g. zone-2-cardio-performance-science.webp
  const expectedBasename = `${slug}.webp`;

  if (imgBasename !== expectedBasename) {
    // The image file name doesn't match the slug — it might be a duplicate from another article
    const otherSlug = imgBasename.replace(".webp", "");
    errors.push(`  ✗ Image filename "${imgBasename}" doesn't match slug "${slug}" — may be a duplicate of "${otherSlug}"`);
  }

}

function validateQueueEntry(slug, errors, warnings) {
  if (!fs.existsSync(QUEUE_PATH)) return;
  try {
    const queue = JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8"));
    const entry = queue.find((e) => e.slug === slug);
    if (!entry) {
      warnings.push(`  ⚠ Slug "${slug}" not found in data/queue.json — run queue reconciliation`);
    }
  } catch {
    // queue.json parse error — not our job here
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function validateSlug(slug) {
  const filePath = path.join(ARTICLES_DIR, `${slug}.mdx`);
  const errors = [];
  const warnings = [];

  if (!fs.existsSync(filePath)) {
    console.log(`\n❌ ${slug}`);
    console.log(`  ✗ File not found: content/articles/${slug}.mdx`);
    return false;
  }

  const src = fs.readFileSync(filePath, "utf8");
  const fm = parseFrontmatter(src);
  const body = getBody(src);

  validateFrontmatter(fm, slug, errors);
  validateComponents(body, errors);
  validateMdxSyntax(body, errors);
  validateQueueEntry(slug, errors, warnings);

  const ok = errors.length === 0;
  console.log(`\n${ok ? "✅" : "❌"} ${slug}`);
  for (const e of errors) console.log(e);
  for (const w of warnings) console.log(w);
  if (ok) console.log("  ✓ All checks passed");

  return ok;
}

const args = process.argv.slice(2);
let slugs;

if (args.includes("--all")) {
  slugs = fs.readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
} else if (args.length > 0) {
  slugs = args;
} else {
  console.error("Usage: node scripts/validate-article.mjs <slug1> [slug2 ...] | --all");
  process.exit(1);
}

console.log(`Validating ${slugs.length} article(s)...\n${"─".repeat(50)}`);

const results = await Promise.all(slugs.map(validateSlug));
const passed = results.filter(Boolean).length;
const failed = results.length - passed;

console.log(`\n${"─".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) process.exit(1);
