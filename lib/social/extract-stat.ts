// Pulls the single most compelling stat from an article for the stat-callout
// image template. Returns a big "value" (the number/effect) and a short
// "context" line (what it's the number of).

import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { z } from "zod";

const MODEL = "openai/gpt-oss-120b";

export type HeroStat = {
  /** The big number, e.g. "~15%", "3–5 g", "200+", "45 min", "$0.15". Keep it short enough to fit huge on an image (≤10 chars). */
  value: string;
  /** Very short context line explaining what the number is about, e.g. "more training volume", "creatine per day". Target ≤48 chars. */
  context: string;
};

const ResponseSchema = z.object({
  value: z
    .string()
    .describe(
      "The headline number or measurement. Keep short (≤10 chars) so it fits huge on an image. Examples: '~15%', '3–5 g', '200+', '45 min', '$0.15'. Include units or symbols inline.",
    ),
  context: z
    .string()
    .describe(
      "Very short context line (≤48 chars) explaining what the value is. Examples: 'more training volume per workout', 'daily dose, any time', 'controlled trials in the meta-analysis'.",
    ),
});

export type ArticleForStat = {
  title: string;
  description: string;
  body?: string;
};

export async function extractHeroStat(article: ArticleForStat): Promise<HeroStat> {
  const prompt = [
    `Pick the SINGLE most compelling number from this article to feature as a stat-callout image.`,
    ``,
    `Article title: ${article.title}`,
    `Summary: ${article.description}`,
    ``,
    article.body ? `Article body (trimmed):\n${article.body.slice(0, 3500)}` : "",
    ``,
    `Pick a stat that is:`,
    `- Specific and attention-grabbing (an effect size, dose, cost, time, sample size, %, ratio).`,
    `- Supported by the article — do not invent.`,
    `- Self-contained — someone seeing only the value + context should understand it without additional text.`,
    ``,
    `Avoid: vague % claims the article doesn't actually state, marketing language, ranges too wide to fit visually.`,
    `Prefer: the single most cited figure, the protocol dose, or the effect size from the most-cited study.`,
  ].join("\n");

  const { object } = await generateObject({
    model: groq(MODEL),
    schema: ResponseSchema,
    prompt,
    temperature: 0.4,
  });

  return { value: object.value.trim(), context: object.context.trim() };
}
