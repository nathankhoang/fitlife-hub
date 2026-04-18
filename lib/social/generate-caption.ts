// Per-platform caption generator. One LLM call per platform using
// Gemini 2.5 Flash (free tier) with structured output.
//
// Returns a ready-to-post caption + (for Instagram only) a first-comment
// hashtag dump.

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
      "The first line of the caption, pulled out verbatim. Critical for Instagram where only this line shows above the 'more' fold.",
    ),
  firstCommentHashtags: z
    .array(z.string())
    .describe(
      "Instagram only: 11-16 additional relevant hashtags (without the # prefix) to post as a first comment for hashtag-engagement. For other platforms return an empty array.",
    ),
});

function buildSystemPrompt(platform: Platform): string {
  const strategy = STRATEGIES[platform];
  const c = strategy.caption;
  return [
    `You are writing a single social media post for LeanBodyEngine (https://leanbodyengine.com), a fitness, nutrition, and wellness blog.`,
    ``,
    `Brand voice:`,
    BRAND_VOICE,
    ``,
    `Platform: ${strategy.label}.`,
    `Rules for this platform:`,
    `- HARD character limit: the ENTIRE caption — body + hashtags + URL + line breaks — must be AT MOST ${c.maxChars} characters. Count carefully. If you are close, drop adjectives before you drop the link.`,
    `- Include ${c.hashtagCount[0]}–${c.hashtagCount[1]} hashtags (placement: ${c.hashtagPlacement}). Hashtags must be directly relevant to the article content, not generic (e.g. use "#CreatineMonohydrate" not "#FitnessMotivation" for a creatine article).`,
    `- Emoji budget: ${c.emojiBudget[0]}–${c.emojiBudget[1]} total.`,
    `- Link placement: ${c.linkPlacement}.`,
    `- Style hint: ${c.styleHint}`,
    ``,
    `Writing principles:`,
    `- Hook the reader in the first line — a specific claim, stat, or contrarian take. Never open with a question unless it's pointed.`,
    `- Specificity over generality: "3 sets of 8" beats "moderate reps".`,
    `- Write like a knowledgeable friend, not a corporate account.`,
    `- Never write "click the link to read more" or "check out our blog"; give the reader a real insight, then let the link do its job.`,
    `- Do not invent facts the article doesn't support.`,
    ``,
    platform === "instagram"
      ? `Instagram specifics: The first line is the ONLY line visible before the "... more" fold, so it must do the whole work of earning a tap. End the caption body with "Link in bio" (no URL). Inline hashtags (2–4) go at the end of the caption AFTER "Link in bio". The remaining 11–16 relevant hashtags go into firstCommentHashtags, without the # prefix.`
      : platform === "facebook"
        ? `Facebook specifics: Put the article URL on its own line at the end — that's what triggers Facebook's link preview card. Do not embed the URL mid-sentence.`
        : platform === "linkedin"
          ? `LinkedIn specifics: Short paragraphs separated by blank lines; feels professional but personal. End with 2-4 hashtags on their own line, then the URL on the line after that.`
          : `Twitter specifics: Single tweet. Aim under ${c.maxChars} characters. Put the URL on its own line at the end — Twitter auto-generates a card from it, so you don't need to mention "link below".`,
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
    });
    object = result.object;
    const caption = object.caption.trim();
    if (caption.length <= limit) break;

    // Feed the overage back to the model on the next attempt.
    prompt = `${basePrompt}\n\nYour previous attempt was ${caption.length} characters but the limit is ${limit}. Trim ${caption.length - limit} characters by cutting adjectives and connective phrases, NOT by dropping the URL or hashtags. Preserve the hook line as-is if possible.`;
  }

  if (!object) throw new Error("generateCaption: no result");

  const firstComment =
    platform === "instagram" && object.firstCommentHashtags.length > 0
      ? object.firstCommentHashtags.map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ")
      : null;

  return {
    platform,
    caption: object.caption.trim(),
    hookLine: object.hookLine.trim(),
    firstComment,
  };
}
