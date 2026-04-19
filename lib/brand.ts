/**
 * Single source of truth for per-client branding.
 *
 * Everything here is intended to be customizable when the template is cloned
 * for a new fitness influencer. Avoid hardcoding any of these values elsewhere
 * in the codebase — import from this module instead.
 *
 * When adding a new brandable field:
 *   1. Add it here with a sensible default.
 *   2. Reference it wherever it would otherwise be hardcoded.
 *   3. Document it in docs/CLIENT_SETUP.md (if that exists yet).
 *
 * The site URL is deliberately NOT here — it comes from lib/site.ts which
 * resolves it from the deployment environment (NEXT_PUBLIC_SITE_URL or Vercel).
 */

export type SocialLink = {
  platform: "instagram" | "youtube" | "tiktok" | "x" | "threads" | "facebook";
  handle: string;
  url: string;
};

export type BrandAuthor = {
  /** Name used in bylines, schema.org Person.name, and metadata. */
  name: string;
  /** Short title shown under the name (e.g., "CSCS, RD"). Optional. */
  credentials?: string;
  /** 1–3 sentence bio used on the about page and article cards. */
  bio: string;
  /** Public URL for a square author photo, or null to hide. */
  photoUrl: string | null;
  /** URL to the author's canonical profile page on this site. */
  profileUrl: string;
  /**
   * When true, articles render Person (influencer) as the schema.org author.
   * When false, Organization (the site) is the author — fallback for sites
   * that don't yet have a named human.
   */
  emitPersonSchema: boolean;
};

export type BrandAffiliates = {
  /** Amazon Associates tracking ID. All amazon.com product links use this tag. */
  amazonTag: string;
  /** ClickBank nickname — set null if the client doesn't use ClickBank. */
  clickbankId: string | null;
  /** ShareASale affiliate ID — set null if the client doesn't use it. */
  shareasaleId: string | null;
};

export type BrandContact = {
  /** Public contact email shown in Footer and used for legal/about. */
  email: string;
};

export type Brand = {
  /** Full site name used in metadata, schema, nav wordmark, and copy. */
  name: string;
  /** 2–4 letter badge used in the nav/footer logo tile. */
  shortName: string;
  /** One-liner tagline — shown on the homepage hero and in OG descriptions. */
  tagline: string;
  /** Default site description used in Metadata and Organization schema. */
  description: string;
  /** Legal name used in copyright notices and T&Cs. Usually matches `name`. */
  legalName: string;
  author: BrandAuthor;
  contact: BrandContact;
  affiliates: BrandAffiliates;
  socials: SocialLink[];
};

export const brand: Brand = {
  name: "LeanBodyEngine",
  shortName: "LBE",
  tagline:
    "Honest, evidence-based fitness advice — built for people who want results without the BS.",
  description:
    "Evidence-based fitness articles, tools, and supplement reviews. No fluff, no miracle promises.",
  legalName: "LeanBodyEngine",

  author: {
    name: "Nathan K Hoang",
    bio: "LeanBodyEngine publishes evidence-based fitness guides — free to read, with no sponsored content or supplement shilling.",
    photoUrl: null,
    profileUrl: "/about",
    emitPersonSchema: true,
  },

  contact: {
    email: "hello@leanbodyengine.com",
  },

  affiliates: {
    amazonTag: "leanbodyengin-20",
    clickbankId: null,
    shareasaleId: null,
  },

  socials: [
    {
      platform: "facebook",
      handle: "LeanBodyEngine",
      url: "https://www.facebook.com/LeanBodyEngine",
    },
    {
      platform: "instagram",
      handle: "leanbodyengine",
      url: "https://www.instagram.com/leanbodyengine/",
    },
  ],
};
