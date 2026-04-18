import type { Article } from "./articles";

const YEAR_RE = /-\d{4}$/;
const TRAIL_RE = /-(review|guide|2024|2025|2026)$/;
const GENERIC_WORDS = new Set([
  "a",
  "an",
  "the",
  "best",
  "top",
  "and",
  "or",
  "to",
  "for",
  "in",
  "of",
  "with",
]);

export type LinkCandidate = {
  slug: string;
  keywords: string[];
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function deriveKeywords(slug: string): string[] {
  let s = slug.toLowerCase();
  s = s.replace(YEAR_RE, "");
  s = s.replace(TRAIL_RE, "");
  const phrase = s.replace(/-/g, " ").trim();
  const variants = new Set<string>([phrase]);
  if (phrase.startsWith("best ")) variants.add(phrase.slice(5));
  return Array.from(variants);
}

export function buildLinkCandidates(
  allArticles: Pick<Article, "slug">[],
  currentSlug: string,
): LinkCandidate[] {
  const candidates: LinkCandidate[] = [];
  for (const a of allArticles) {
    if (a.slug === currentSlug) continue;
    const keywords = deriveKeywords(a.slug).filter((kw) => {
      const meaningful = kw.split(/\s+/).filter((w) => !GENERIC_WORDS.has(w));
      return meaningful.length >= 2;
    });
    if (keywords.length === 0) continue;
    candidates.push({ slug: a.slug, keywords });
  }
  candidates.sort((a, b) => {
    const aMax = Math.max(...a.keywords.map((k) => k.length));
    const bMax = Math.max(...b.keywords.map((k) => k.length));
    return bMax - aMax;
  });
  return candidates;
}

const SKIP_LINE = /^\s*(#|>|```|<[A-Za-z])/;
const HAS_LINK = /\[[^\]]+\]\([^)]+\)|<a\s|<\/a>/i;
const CODE_FENCE = /^\s*```/;

export function injectContextualLinks(
  content: string,
  candidates: LinkCandidate[],
  maxLinks = 3,
): string {
  if (candidates.length === 0) return content;

  const lines = content.split("\n");
  let inCode = false;
  let linked = 0;
  const usedSlugs = new Set<string>();

  for (let i = 0; i < lines.length && linked < maxLinks; i++) {
    const line = lines[i];
    if (CODE_FENCE.test(line)) {
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;
    if (SKIP_LINE.test(line)) continue;
    if (HAS_LINK.test(line)) continue;

    for (const { slug, keywords } of candidates) {
      if (usedSlugs.has(slug)) continue;
      if (linked >= maxLinks) break;
      let matched = false;
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b(${escapeRegex(keyword)})\\b`, "i");
        if (!regex.test(line)) continue;
        lines[i] = line.replace(regex, `[$1](/blog/${slug})`);
        usedSlugs.add(slug);
        linked++;
        matched = true;
        break;
      }
      if (matched) break;
    }
  }

  return lines.join("\n");
}
