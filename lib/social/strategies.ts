// Per-platform configuration shared by the image renderer and the caption
// generator. Treat this as the single source of truth for anything that
// varies by platform (dimensions, caption rules, hashtag counts, link
// placement, etc.).

export type Platform = "twitter" | "linkedin" | "instagram" | "facebook";

export type ImageSpec = {
  width: number;
  height: number;
  orientation: "landscape" | "portrait";
  padding: number;
  titleSize: number;
  eyebrowSize: number;
  urlSize: number;
  monogramSize: number;
  monogramFont: number;
};

export type CaptionSpec = {
  maxChars: number;
  hashtagCount: [min: number, max: number];
  hashtagPlacement: "inline" | "trailing" | "first-comment-plus-trailing";
  linkPlacement: "inline" | "trailing" | "bio";
  emojiBudget: [min: number, max: number];
  /** Short style hint fed to the caption prompt */
  styleHint: string;
};

export type PlatformStrategy = {
  platform: Platform;
  label: string;
  image: ImageSpec;
  caption: CaptionSpec;
};

const LANDSCAPE_IMAGE: Omit<ImageSpec, "width" | "height"> = {
  orientation: "landscape",
  padding: 56,
  titleSize: 60,
  eyebrowSize: 18,
  urlSize: 20,
  monogramSize: 56,
  monogramFont: 19,
};

const PORTRAIT_IMAGE: Omit<ImageSpec, "width" | "height"> = {
  orientation: "portrait",
  padding: 64,
  titleSize: 76,
  eyebrowSize: 20,
  urlSize: 22,
  monogramSize: 64,
  monogramFont: 22,
};

export const STRATEGIES: Record<Platform, PlatformStrategy> = {
  twitter: {
    platform: "twitter",
    label: "Twitter/X",
    image: { width: 1600, height: 900, ...LANDSCAPE_IMAGE },
    caption: {
      maxChars: 270,
      hashtagCount: [0, 2],
      hashtagPlacement: "inline",
      linkPlacement: "trailing",
      emojiBudget: [0, 1],
      styleHint:
        "Punchy, single tweet. Open with a claim or stat. Drop the link on its own line at the end.",
    },
  },
  linkedin: {
    platform: "linkedin",
    label: "LinkedIn",
    image: { width: 1200, height: 627, ...LANDSCAPE_IMAGE },
    caption: {
      maxChars: 1300,
      hashtagCount: [2, 4],
      hashtagPlacement: "trailing",
      linkPlacement: "trailing",
      emojiBudget: [0, 2],
      styleHint:
        "2–3 short paragraphs, white space between them. First-person insight or contrarian take, not corporate. Hashtags on their own line at the bottom.",
    },
  },
  instagram: {
    platform: "instagram",
    label: "Instagram",
    image: { width: 1080, height: 1350, ...PORTRAIT_IMAGE },
    caption: {
      maxChars: 2000,
      hashtagCount: [15, 20],
      hashtagPlacement: "first-comment-plus-trailing",
      linkPlacement: "bio",
      emojiBudget: [2, 5],
      styleHint:
        "Hook in the first line (that's all that shows before 'more'). 3–4 short lines in the body. End with 'link in bio'. Include 2–4 inline trailing hashtags; the remaining 11–16 go as a first comment.",
    },
  },
  facebook: {
    platform: "facebook",
    label: "Facebook",
    image: { width: 1200, height: 630, ...LANDSCAPE_IMAGE },
    caption: {
      maxChars: 600,
      hashtagCount: [0, 2],
      hashtagPlacement: "inline",
      linkPlacement: "trailing",
      emojiBudget: [0, 2],
      styleHint:
        "Conversational single paragraph. The URL on its own line triggers Facebook's link preview card — don't embed it mid-sentence.",
    },
  },
};

export const PLATFORMS: Platform[] = ["twitter", "linkedin", "instagram", "facebook"];
