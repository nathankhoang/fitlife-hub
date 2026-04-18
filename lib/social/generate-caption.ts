// Per-platform caption generator. One LLM call per platform using
// Groq gpt-oss-120b (free tier) with structured output.
//
// Returns a ready-to-post caption. For Instagram we now keep a 4–6
// inline hashtag budget and have dropped the first-comment hashtag
// dump (first-comment hashtag bundles are deprecated for 2026 —
// peer brands in this niche do NOT use them).

import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { z } from "zod";
import { STRATEGIES, type Platform } from "./strategies";
import { BRAND_VOICE } from "./voice";

// Groq free tier: 30 req/min, generous daily quota. Using gpt-oss-120b
// because it natively supports JSON schema structured outputs (Llama 3.3
// on Groq does not).
const MODEL = "openai/gpt-oss-120b";

export type ArticleForCaption = {
  slug: string;
  title: string;
  description: string;
  category: string;
  categoryLabel: string;
  /** Optional: plain-text article body for extra context. Trim before passing. */
  body?: string;
};

export type CaptionResult = {
  platform: Platform;
  /** Ready-to-post caption, including any inline hashtags and the trailing link. */
  caption: string;
  /** IG only: the hashtag dump to post as a first comment right after publishing. */
  firstComment: string | null;
  /** The first line of the caption (used for preview / IG hook check). */
  hookLine: string;
};

const ResponseSchema = z.object({
  caption: z
    .string()
    .describe(
      "Final post text exactly as it will appear on the platform. Include any inline hashtags and the trailing link when required.",
    ),
  hookLine: z
    .string()
    .describe(
      "The first line of the caption, pulled out verbatim. Critical for Instagram and LinkedIn where only this line shows above the fold.",
    ),
});

function buildSystemPrompt(platform: Platform): string {
  const strategy = STRATEGIES[platform];
  const c = strategy.caption;
  const hashtagLine =
    c.hashtagCount[1] === 0
      ? `- NO hashtags on this platform.`
      : `- Include ${c.hashtagCount[0]}–${c.hashtagCount[1]} hashtags (placement: ${c.hashtagPlacement}). Hashtags must be niche-specific and directly relevant to the article content (e.g. "#CreatineMonohydrate" not "#FitnessMotivation"). Prefer fewer high-relevance tags over more generic ones.`;

  return [
    `You are writing a single social media post for LeanBodyEngine (https://leanbodyengine.com), a fitness, nutrition, and wellness blog.`,
    ``,
    `Brand voice:`,
    BRAND_VOICE,
    ``,
    `Platform: ${strategy.label}.`,
    `Rules for this platform:`,
    `- HARD character limit: the ENTIRE caption — body + hashtags + URL + line breaks — must be AT MOST ${c.maxChars} characters. Count carefully. If you are close, drop adjectives before you drop the link.`,
    hashtagLine,
    `- Emoji budget: ${c.emojiBudget[0]}–${c.emojiBudget[1]} total. Never use emoji as structural bullets on LinkedIn.`,
    `- Link placement: ${c.linkPlacement}.`,
    `- Style hint: ${c.styleHint}`,
    ``,
    `CRITICAL — hook philosophy:`,
    `- Lead with the ANSWER, not a tease. Open with the specific finding: a number, a dose, an effect size, or a contrarian fact. The reader should walk away from the post already informed — the link is for depth and citations, not for "finding out what we said".`,
    `- Platforms actively suppress outbound links in 2026. Readers who already got value from the post are far more likely to click through. Hiding the punchline kills click-through, not boosts it.`,
    `- BAD hook: "This changes everything about creatine." / "Most people get creatine wrong. Here's why."`,
    `- GOOD hook: "Creatine monohydrate adds ~15% training volume (meta-analysis, n=200+ trials)." / "3–5 g creatine/day, any time. No loading phase needed."`,
    ``,
    `Writing principles:`,
    `- Specificity over generality: "3 sets of 8" beats "moderate reps". "~15% volume increase" beats "significant gains".`,
    `- Write like a knowledgeable friend, not a corporate account.`,
    `- Never write "click the link to read more", "check out our blog", or "link below". Those phrases read as spam and reduce trust.`,
    `- Do not invent facts the article doesn't support. If the article gives a range, keep the range.`,
    `- No clickbait curiosity gaps ("you won't believe what X actually does"). They erode the evidence-based trust the brand depends on.`,
    ``,
    platform === "instagram"
      ? `Instagram specifics: The first line is the ONLY line visible above "...more", so it must do the whole work of earning a tap — lead with the single most compelling stat or dose. End the caption body with "Link in bio" on its own line. Then 4–6 niche-specific inline hashtags at the very end. DO NOT output any first-comment hashtag dump — that pattern is deprecated for 2026.`
      : platform === "facebook"
        ? `Facebook specifics: Put the article URL on its own line at the end — that's what triggers Facebook's link preview card. Do not embed the URL mid-sentence. Do NOT use hashtags; they don't help on Facebook in 2026.`
        : platform === "linkedin"
          ? `LinkedIn specifics: FIRST LINE of the caption must be a standalone compelling stat or finding — a single sentence. Blank line. Then 1–2 short paragraphs with mechanism/dosing/caveat, each on its own paragraph separated by a blank line. End with 2–4 hashtags on their own line, then the URL on the line after.`
          : `Twitter specifics: Single tweet. Aim under ${c.maxChars} characters. Lead with the specific finding. Put the URL on its own line at the end — Twitter auto-generates a card from it.`,
  ].join("\n");
}

function buildUserPrompt(article: ArticleForCaption): string {
  const url = `https://leanbodyengine.com/blog/${article.slug}`;
  const lines = [
    `Article to post about:`,
    `- Title: ${article.title}`,
    `- Category: ${article.categoryLabel}`,
    `- Summary: ${article.description}`,
    `- URL: ${url}`,
  ];
  if (article.body) {
    lines.push(``, `Full article body (for context; do not quote directly):`, article.body.slice(0, 4000));
  }
  lines.push(``, `Write the caption now.`);
  return lines.join("\n");
}

const MAX_RETRIES = 2;

export async function generateCaption({
  article,
  platform,
}: {
  article: ArticleForCaption;
  platform: Platform;
}): Promise<CaptionResult> {
  const strategy = STRATEGIES[platform];
  const limit = strategy.caption.maxChars;
  const system = buildSystemPrompt(platform);
  const basePrompt = buildUserPrompt(article);

  let prompt = basePrompt;
  let object: z.infer<typeof ResponseSchema> | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const result = await generateObject({
      model: groq(MODEL),
      schema: ResponseSchema,
      system,
      prompt,
      temperature: 0.7,
      // gpt-oss-120b uses reasoning tokens that count against the output
      // budget. Give enough headroom for the LinkedIn 1300-char caption
      // plus the JSON envelope plus reasoning scratch.
      maxOutputTokens: 4000,
      providerOptions: { groq: { reasoningEffort: "low" } },
    });
    object = result.object;
    const caption = object.caption.trim();
    if (caption.length <= limit) break;

    // Feed the overage back to the model on the next attempt.
    prompt = `${basePrompt}\n\nYour previous attempt was ${caption.length} characters but the limit is ${limit}. Trim ${caption.length - limit} characters by cutting adjectives and connective phrases, NOT by dropping the URL or hashtags. Preserve the hook line as-is if possible.`;
  }

  if (!object) throw new Error("generateCaption: no result");

  return {
    platform,
    caption: object.caption.trim(),
    hookLine: object.hookLine.trim(),
    firstComment: null,
  };
}
