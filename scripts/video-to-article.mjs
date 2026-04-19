#!/usr/bin/env node
/**
 * video-to-article.mjs — turn an influencer's video into a ready-to-publish
 * MDX article draft, without them typing anything.
 *
 * Pipeline:
 *   1. Download audio (from YouTube / TikTok / IG URL via yt-dlp, or local file)
 *   2. Transcribe with OpenAI Whisper
 *   3. Optionally extract a hero keyframe with ffmpeg
 *   4. Structure into MDX with Claude, preserving the influencer's voice
 *   5. Write to content/drafts/<slug>.mdx for operator review
 *
 * External prerequisites (install once per workstation):
 *   - yt-dlp         https://github.com/yt-dlp/yt-dlp  (for URL input)
 *   - ffmpeg         https://ffmpeg.org                  (hero frame extraction — optional)
 *
 * Env vars:
 *   OPENAI_API_KEY     — required (Whisper transcription)
 *   ANTHROPIC_API_KEY  — required (article structuring)
 *
 * Usage:
 *   node --env-file=.env.local scripts/video-to-article.mjs \
 *     https://www.youtube.com/watch?v=XXXX \
 *     --category supplements \
 *     --slug creatine-loading-explained
 *
 *   node --env-file=.env.local scripts/video-to-article.mjs \
 *     ./my-video.mp4 \
 *     --category home-workouts
 *
 *   # Skip re-transcription if you already have transcript.txt:
 *   node --env-file=.env.local scripts/video-to-article.mjs \
 *     --transcript ./transcript.txt \
 *     --category supplements \
 *     --slug my-topic
 *
 * Output:
 *   content/drafts/<slug>.mdx   — ready for the admin queue to publish
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import url from "node:url";
import crypto from "node:crypto";
import { execSync, spawnSync } from "node:child_process";
import Anthropic from "@anthropic-ai/sdk";

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");

// ---------- CLI parse --------------------------------------------------

function parseArgs(argv) {
  const opts = {
    input: null,
    category: null,
    slug: null,
    transcript: null,
    output: path.join(root, "content", "drafts"),
    keepTemp: false,
    skipFrame: false,
    model: "claude-sonnet-4-6",
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--category") opts.category = argv[++i];
    else if (a === "--slug") opts.slug = argv[++i];
    else if (a === "--transcript") opts.transcript = argv[++i];
    else if (a === "--output") opts.output = argv[++i];
    else if (a === "--keep-temp") opts.keepTemp = true;
    else if (a === "--skip-frame") opts.skipFrame = true;
    else if (a === "--model") opts.model = argv[++i];
    else if (!a.startsWith("--") && !opts.input) opts.input = a;
  }
  return opts;
}

const ALLOWED_CATEGORIES = [
  "home-workouts",
  "supplements",
  "diet-nutrition",
  "weight-loss",
  "muscle-building",
  "wellness",
];

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

function which(bin) {
  try {
    const cmd = process.platform === "win32" ? "where" : "which";
    execSync(`${cmd} ${bin}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
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

// ---------- Download ---------------------------------------------------

function isUrl(s) {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

function downloadWithYtDlp(inputUrl, tmpDir) {
  if (!which("yt-dlp")) {
    fail(
      "yt-dlp not found. Install: https://github.com/yt-dlp/yt-dlp/wiki/Installation  (brew install yt-dlp / pip install yt-dlp / winget install yt-dlp)",
    );
  }
  const outTemplate = path.join(tmpDir, "%(id)s.%(ext)s");
  info(`Downloading audio via yt-dlp...`);
  // -x extracts audio, --audio-format m4a (widely supported), --restrict-filenames avoids spaces
  const res = spawnSync(
    "yt-dlp",
    [
      "-x",
      "--audio-format",
      "m4a",
      "--restrict-filenames",
      "-o",
      outTemplate,
      "--print",
      "after_move:filepath",
      "--print",
      "%(title)s",
      inputUrl,
    ],
    { stdio: ["ignore", "pipe", "inherit"] },
  );
  if (res.status !== 0) fail("yt-dlp failed — see error output above.");
  const lines = res.stdout.toString().trim().split(/\r?\n/);
  if (lines.length < 2) fail("yt-dlp did not return expected filepath + title");
  return { audioPath: lines[0], title: lines[1] };
}

// ---------- Transcribe (OpenAI Whisper via fetch) ----------------------

async function transcribeWithWhisper(audioPath) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) fail("OPENAI_API_KEY not set — add it to .env.local");

  info(`Transcribing ${path.basename(audioPath)}...`);
  const audioBlob = new Blob([fs.readFileSync(audioPath)]);
  const form = new FormData();
  form.append("file", audioBlob, path.basename(audioPath));
  form.append("model", "whisper-1");
  form.append("response_format", "text");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const errTxt = await res.text();
    fail(`Whisper API ${res.status}: ${errTxt.slice(0, 400)}`);
  }

  return (await res.text()).trim();
}

// ---------- Optional hero frame ---------------------------------------

function extractHeroFrame(videoPath, outPath) {
  if (!which("ffmpeg")) return null;
  info(`Extracting hero frame via ffmpeg...`);
  // Frame at 3 seconds (usually past any intro slate), scale to 1600w, quality 80
  const res = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-ss",
      "00:00:03",
      "-i",
      videoPath,
      "-vframes",
      "1",
      "-vf",
      "scale=1600:-1",
      "-q:v",
      "2",
      outPath,
    ],
    { stdio: ["ignore", "ignore", "ignore"] },
  );
  return res.status === 0 ? outPath : null;
}

// ---------- Structuring with Claude -----------------------------------

async function structureArticle({
  transcript,
  category,
  slug,
  originalTitle,
  model,
}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) fail("ANTHROPIC_API_KEY not set — add it to .env.local");

  // Load brand context for prompt grounding
  const brand = await loadBrand();
  const today = new Date().toISOString().slice(0, 10);

  const system = `You restructure raw transcripts from a fitness creator's video into publish-ready MDX articles. You are not a ghostwriter — you are a structural editor. Your single highest priority is preserving the creator's voice.

ABSOLUTE RULES:
1. Use the creator's phrasing, examples, analogies, and idioms verbatim whenever possible. Rearrange, don't rewrite.
2. Remove filler only: "um", "uh", false starts, throat-clears, repeated words, tangents that don't advance the main topic. Keep personality and side-notes that are part of their voice.
3. Never add claims, studies, numbers, or advice the creator didn't say. If the transcript doesn't support a point, don't make it.
4. Add structure (headings, intro, conclusion, FAQ) around their words — don't substitute for their words.
5. Write the frontmatter around the transcript's actual topic, not what you assume they meant.

OUTPUT SHAPE:
- Valid MDX with YAML frontmatter
- Frontmatter fields: title, description, category, date, readTime (estimate at 200 wpm), featured (false), image, imageOg, imagePinterest (all pointing at /images/articles/<slug>.webp), faq (array of {question, answer})
- Body: 1-3 sentence hook paragraph, then 3-5 H2 sections, optional H3 subsections, closing takeaway paragraph
- 4-6 FAQ entries derived from questions the transcript addresses (explicitly or implicitly via the content covered)
- No em dashes if the creator doesn't use them; match their punctuation habits

BRAND CONTEXT (for tone alignment, not content):
- Site: ${brand.name}
- Tagline: ${brand.tagline}
- Author: ${brand.author.name}${brand.author.credentials ? ` (${brand.author.credentials})` : ""}

RETURN ONLY THE MDX DOCUMENT. No preamble, no postscript, no fenced code block wrappers — just the raw --- frontmatter --- followed by the body.`;

  const userPayload = `CATEGORY: ${category}
DATE: ${today}
TARGET SLUG: ${slug}
${originalTitle ? `ORIGINAL VIDEO TITLE: ${originalTitle}` : ""}

TRANSCRIPT (from creator's video):

${transcript}`;

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

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
  if (!text.trim().startsWith("---")) {
    fail(
      "Claude response did not start with MDX frontmatter. First 200 chars:\n" +
        text.slice(0, 200),
    );
  }
  return text;
}

async function loadBrand() {
  // Import brand via ESM dynamic import — the .ts file won't load directly,
  // so we parse it as plain text and extract the object literal.
  // Simpler: just pull the known fields.
  try {
    const src = fs.readFileSync(path.join(root, "lib", "brand.ts"), "utf8");
    const name = src.match(/\bname:\s*"([^"]+)"/)?.[1] ?? "LeanBodyEngine";
    const tagline = src.match(/\btagline:\s*\n?\s*"([^"]+)"/)?.[1] ?? "";
    const authorName =
      src.match(/author:\s*\{[^}]*name:\s*"([^"]+)"/m)?.[1] ?? "Editorial";
    const credentials = src.match(/credentials:\s*"([^"]+)"/)?.[1];
    return { name, tagline, author: { name: authorName, credentials } };
  } catch {
    return {
      name: "the site",
      tagline: "",
      author: { name: "Editorial", credentials: undefined },
    };
  }
}

// ---------- Main -------------------------------------------------------

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (!opts.category) {
    fail("Missing --category. One of: " + ALLOWED_CATEGORIES.join(", "));
  }
  if (!ALLOWED_CATEGORIES.includes(opts.category)) {
    fail(
      `Unknown category "${opts.category}". Allowed: ${ALLOWED_CATEGORIES.join(", ")}`,
    );
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "v2a-"));
  info(`Temp directory: ${tmpDir}`);

  let transcript;
  let videoPath = null;
  let originalTitle = null;

  try {
    if (opts.transcript) {
      // Provided transcript — skip download + transcription
      if (!fs.existsSync(opts.transcript)) {
        fail(`Transcript file not found: ${opts.transcript}`);
      }
      transcript = fs.readFileSync(opts.transcript, "utf8").trim();
      ok(`Loaded transcript (${transcript.split(/\s+/).length} words)`);
    } else {
      if (!opts.input) {
        fail(
          "No input. Pass a YouTube/TikTok/IG URL or a local video path, OR --transcript <path>.",
        );
      }

      // Get audio
      if (isUrl(opts.input)) {
        const dl = downloadWithYtDlp(opts.input, tmpDir);
        videoPath = dl.audioPath; // audio file in this case
        originalTitle = dl.title;
        ok(`Downloaded: ${path.basename(videoPath)} ("${originalTitle}")`);
      } else {
        if (!fs.existsSync(opts.input)) fail(`File not found: ${opts.input}`);
        videoPath = path.resolve(opts.input);
        ok(`Using local file: ${videoPath}`);
      }

      // Transcribe
      transcript = await transcribeWithWhisper(videoPath);
      ok(`Transcribed (${transcript.split(/\s+/).length} words)`);
      // Save a copy next to the temp so operator can inspect
      const transcriptCopy = path.join(tmpDir, "transcript.txt");
      fs.writeFileSync(transcriptCopy, transcript, "utf8");
      info(`Transcript saved to ${transcriptCopy}`);
    }

    // Derive slug if not provided
    const slug =
      opts.slug ??
      (originalTitle
        ? slugify(originalTitle)
        : `video-article-${crypto.randomBytes(3).toString("hex")}`);
    info(`Output slug: ${slug}`);

    // Optional hero frame
    if (videoPath && !opts.skipFrame) {
      const heroOut = path.join(
        root,
        "public",
        "images",
        "articles",
        `${slug}.webp`,
      );
      const madeFrame = extractHeroFrame(videoPath, heroOut);
      if (madeFrame) ok(`Hero frame written to public/images/articles/${slug}.webp`);
      else
        info(
          "Hero frame not extracted (ffmpeg missing, or input was not a video). " +
            "Add one manually at public/images/articles/" +
            slug +
            ".webp",
        );
    }

    // Structure with Claude
    const mdx = await structureArticle({
      transcript,
      category: opts.category,
      slug,
      originalTitle,
      model: opts.model,
    });

    // Write MDX
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
    console.log("  2. Commit + push (or upload via admin queue) to publish");
    console.log(
      `  3. Ensure public/images/articles/${slug}.webp exists (hero frame or replacement)`,
    );
  } finally {
    if (!opts.keepTemp) {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup failures
      }
    } else {
      info(`Temp dir retained at ${tmpDir}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
