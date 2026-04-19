// Per-platform configuration shared by the image renderer and the caption
// generator. Treat this as the single source of truth for anything that
// varies by platform (dimensions, caption rules, hashtag counts, link
// placement, etc.).

export type Platform = "instagram" | "facebook";

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
  hashtagPlacement: "inline" | "trailing" | "first-comment-plus-trailing" | "none";
  linkPlacement: "inline" | "trailing" | "bio";
  emojiBudget: [min: number, max: number];
  /** Short style hint fed to the caption prompt */
  styleHint: string;
};

/**
 * Which image template the runtime worker should emit for this platform.
 * "stat-callout" is typography-forward (big number, no photo) and matches
 * evidence-based peer brands. "hero-photo" is photo-led with a title overlay.
 */
export type DefaultImageVariant = "hero-photo" | "stat-callout";

export type PlatformStrategy = {
  platform: Platform;
  label: string;
  image: ImageSpec;
  caption: CaptionSpec;
  defaultImageVariant: DefaultImageVariant;
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
  instagram: {
    platform: "instagram",
    label: "Instagram",
    image: { width: 1080, height: 1350, ...PORTRAIT_IMAGE },
    // Evidence-based peers have largely abandoned hero-photo on IG; stat
    // callouts stop the scroll with a number instead of a gym scene.
    defaultImageVariant: "stat-callout",
    caption: {
      maxChars: 2000,
      hashtagCount: [4, 6],
      hashtagPlacement: "trailing",
      linkPlacement: "bio",
      emojiBudget: [1, 3],
      styleHint:
        "First line is the hook (only thing visible above 'more') — make it a specific stat or claim, not a tease. 3–4 short lines in the body with the actionable takeaways. End with 'Link in bio' on its own line. 4–6 relevant niche hashtags at the very end. Do NOT produce a first-comment hashtag dump — that's deprecated in 2026.",
    },
  },
  facebook: {
    platform: "facebook",
    label: "Facebook",
    image: { width: 1200, height: 630, ...LANDSCAPE_IMAGE },
    // FB auto-generates a link preview card from the URL, so the post image
    // is competing with the article's own hero — a photo is the stronger bet.
    defaultImageVariant: "hero-photo",
    caption: {
      maxChars: 600,
      hashtagCount: [0, 0],
      hashtagPlacement: "none",
      linkPlacement: "trailing",
      emojiBudget: [0, 1],
      styleHint:
        "Conversational single paragraph. Open with the specific answer/stat. URL on its own line at the end to trigger the link preview card. No hashtags — they don't help on Facebook in 2026.",
    },
  },
};

export const PLATFORMS: Platform[] = ["instagram", "facebook"];
