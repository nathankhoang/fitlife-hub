#!/usr/bin/env node
/**
 * text-to-article.mjs — structure a block of creator-provided text into
 * a publishable MDX draft.
 *
 * Companion to video-to-article.mjs. Same Claude-based voice-preserving
 * structuring step — no Whisper transcription, no yt-dlp. Use when the
 * client sent you raw text (captions, blog draft, email, newsletter,
 * whatever) and wants it shaped into a standard article.
 *
 * Input sources, in priority order:
 *   --text-file <path>  — read from a file
 *   --text "..."        — inline short text (escape quotes for the shell)
 *   stdin               — piped in (heredoc, cat file | ..., etc.)
 *
 * Env vars:
 *   ANTHROPIC_API_KEY  — required
 *
 * Usage:
 *   # File input
 *   node --env-file=.env.local scripts/text-to-article.mjs \
 *     --text-file ./draft.txt --category supplements --slug my-topic
 *
 *   # Heredoc via stdin
 *   cat <<'EOF' | npm run text:article -- --category home-workouts --slug stretching
 *   Here is the creator's raw text,
 *   multiple lines fine...
 *   EOF
 *
 *   # Inline (short text only; mind shell quoting)
 *   npm run text:article -- --text "Short note" --category wellness --slug my-topic
 */

import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import crypto from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");

const ALLOWED_CATEGORIES = [
  "home-workouts",
  "supplements",
  "diet-nutrition",
  "weight-loss",
  "muscle-building",
  "wellness",
];

function parseArgs(argv) {
  const o = {
    textFile: null,
    text: null,
    category: null,
    slug: null,
    output: path.join(root, "content", "drafts"),
    model: "claude-sonnet-4-6",
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--text-file") o.textFile = argv[++i];
    else if (a === "--text") o.text = argv[++i];
    else if (a === "--category") o.category = argv[++i];
    else if (a === "--slug") o.slug = argv[++i];
    else if (a === "--output") o.output = argv[++i];
    else if (a === "--model") o.model = argv[++i];
  }
  return o;
}

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

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function readStdin() {
  if (process.stdin.isTTY) return "";
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function loadBrandSummary() {
  try {
    const src = fs.readFileSync(path.join(root, "lib", "brand.ts"), "utf8");
    const name = src.match(/\bname:\s*"([^"]+)"/)?.[1] ?? "the site";
    const tagline = src.match(/\btagline:\s*\n?\s*"([^"]+)"/)?.[1] ?? "";
    const authorName =
      src.match(/author:\s*\{[^}]*name:\s*"([^"]+)"/m)?.[1] ?? "Editorial";
    const credentials = src.match(/credentials:\s*"([^"]+)"/)?.[1];
    return { name, tagline, author: { name: authorName, credentials } };
  } catch {
    return { name: "the site", tagline: "", author: { name: "Editorial" } };
  }
}

async function structureArticle({ text, category, slug, model }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) fail("ANTHROPIC_API_KEY not set — add it to .env.local");

  const brand = await loadBrandSummary();
  const today = new Date().toISOString().slice(0, 10);

  const system = `You restructure creator-provided raw text into publish-ready MDX articles. You are a structural editor — not a ghostwriter. Your #1 priority is preserving the creator's voice.

ABSOLUTE RULES:
1. Use the creator's phrasing, examples, analogies, and idioms verbatim where possible. Rearrange, don't rewrite.
2. Remove filler only (stray asides, repeated thoughts, throwaway lines) — keep personality and side notes that are part of their voice.
3. Never add claims, studies, numbers, or advice the creator didn't write. If the text doesn't support a point, don't invent it.
4. Add SEO structure (title, description, H2s, FAQ, frontmatter) around their words.
5. Match their punctuation habits.

OUTPUT SHAPE:
- Valid MDX with YAML frontmatter
- Frontmatter fields: title, description, category, date, readTime (at 200 wpm), featured (false), image, imageOg, imagePinterest (all pointing at /images/articles/<slug>.webp), faq (array of {question, answer})
- Body: 1-3 sentence hook, 3-5 H2 sections, optional H3s, closing takeaway
- 4-6 FAQ entries grounded in the source text
- No em dashes if the creator doesn't use them

BRAND CONTEXT (for tone alignment, not content):
- Site: ${brand.name}
- Tagline: ${brand.tagline}
- Author: ${brand.author.name}${brand.author.credentials ? ` (${brand.author.credentials})` : ""}

RETURN ONLY THE MDX DOCUMENT. No preamble, no postscript, no fenced code block wrappers.`;

  const userPayload = `CATEGORY: ${category}
DATE: ${today}
TARGET SLUG: ${slug}

CREATOR TEXT:

${text}`;

  info(`Structuring article with ${model}...`);
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model,
    max_tokens: 8000,
    system: [
      {
        type: "text",
        text: system,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userPayload }],
  });

  const out = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
  if (!out.trim().startsWith("---")) {
    fail(
      "Claude response did not start with MDX frontmatter. First 200 chars:\n" +
        out.slice(0, 200),
    );
  }
  return out;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (!opts.category) {
    fail("Missing --category. One of: " + ALLOWED_CATEGORIES.join(", "));
  }
  if (!ALLOWED_CATEGORIES.includes(opts.category)) {
    fail(`Unknown category "${opts.category}".`);
  }

  // Resolve text input
  let text = "";
  if (opts.textFile) {
    if (!fs.existsSync(opts.textFile)) fail(`File not found: ${opts.textFile}`);
    text = fs.readFileSync(opts.textFile, "utf8");
  } else if (opts.text) {
    text = opts.text;
  } else {
    text = await readStdin();
    if (!text.trim()) {
      fail(
        "No text provided. Pass --text-file <path>, --text \"...\", or pipe text via stdin.",
      );
    }
  }
  text = text.trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words < 50) {
    fail(
      `Only ${words} words of input — too short to structure meaningfully. Aim for 200+ words of creator content.`,
    );
  }
  ok(`Loaded text (${words} words)`);

  const slug =
    opts.slug ?? `draft-${crypto.randomBytes(3).toString("hex")}`;
  info(`Output slug: ${slug}`);

  const mdx = await structureArticle({
    text,
    category: opts.category,
    slug,
    model: opts.model,
  });

  fs.mkdirSync(opts.output, { recursive: true });
  const outPath = path.join(opts.output, `${slug}.mdx`);
  if (fs.existsSync(outPath)) {
    fail(
      `Draft already exists at ${outPath}. Pick a different --slug or delete the existing draft.`,
    );
  }
  fs.writeFileSync(outPath, mdx, "utf8");
  ok(`Wrote ${path.relative(root, outPath)}`);
  console.log();
  console.log("Next steps:");
  console.log("  1. Open the draft and review the frontmatter + structure");
  console.log(
    `  2. Add a hero image at public/images/articles/${slug}.webp`,
  );
  console.log("  3. Commit + push (or upload via admin queue) to publish");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
