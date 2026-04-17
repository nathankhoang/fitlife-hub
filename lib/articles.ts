import fs from "fs";
import nodePath from "path";
import matter from "gray-matter";
import { getQueue } from "./queue";

export type Category =
  | "home-workouts"
  | "supplements"
  | "diet-nutrition"
  | "weight-loss"
  | "muscle-building"
  | "wellness";

export const categoryLabels: Record<Category, string> = {
  "home-workouts": "Home Workouts",
  supplements: "Supplement Reviews",
  "diet-nutrition": "Diet & Nutrition",
  "weight-loss": "Weight Loss",
  "muscle-building": "Muscle Building",
  wellness: "Wellness & Recovery",
};

export type Article = {
  slug: string;
  title: string;
  description: string;
  category: Category;
  date: string;
  readTime: number;
  featured: boolean;
  image: string;
  imageOg: string;
  imagePinterest: string;
  content: string;
};

const LOCAL_ARTICLES_DIR = nodePath.join(process.cwd(), "content", "articles");
const LOCAL_DRAFTS_DIR = nodePath.join(process.cwd(), "content", "drafts");

function hasBlob(): boolean {
  return !!process.env.BLOB_PUBLIC_BASE;
}

function blobBase(): string {
  const base = process.env.BLOB_PUBLIC_BASE;
  if (!base) {
    throw new Error(
      "BLOB_PUBLIC_BASE is not set. Run `vercel env pull .env.local` after creating the Blob store.",
    );
  }
  return base.replace(/\/$/, "");
}

function readLocalMdx(dir: string, slug: string): string | null {
  const p = nodePath.join(dir, `${slug}.mdx`);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, "utf8");
}

function parseMdx(slug: string, raw: string): Article {
  const { data, content } = matter(raw);
  return {
    slug,
    title: data.title as string,
    description: data.description as string,
    category: data.category as Category,
    date: data.date as string,
    readTime: data.readTime as number,
    featured: (data.featured as boolean) ?? false,
    image: (data.image as string) ?? "",
    imageOg: (data.imageOg as string) ?? "",
    imagePinterest: (data.imagePinterest as string) ?? "",
    content,
  };
}

async function fetchMdx(
  blobPath: string,
  tag: string,
): Promise<string | null> {
  const res = await fetch(`${blobBase()}/${blobPath}`, {
    cache: "force-cache",
    next: { tags: [tag] },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch ${blobPath}: ${res.status}`);
  return res.text();
}

export async function getAllArticles(): Promise<Article[]> {
  if (!hasBlob()) {
    if (!fs.existsSync(LOCAL_ARTICLES_DIR)) return [];
    const files = fs
      .readdirSync(LOCAL_ARTICLES_DIR)
      .filter((f) => f.endsWith(".mdx"));
    return files
      .map((f) => {
        const slug = f.replace(/\.mdx$/, "");
        const raw = fs.readFileSync(nodePath.join(LOCAL_ARTICLES_DIR, f), "utf8");
        return parseMdx(slug, raw);
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  const queue = await getQueue();
  const slugs = queue
    .filter((e) => e.status === "published")
    .map((e) => e.slug);

  const results = await Promise.all(
    slugs.map(async (slug) => {
      const raw = await fetchMdx(`articles/${slug}.mdx`, `article:${slug}`);
      return raw ? parseMdx(slug, raw) : null;
    }),
  );

  return results
    .filter((a): a is Article => a !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  if (!hasBlob()) {
    const raw = readLocalMdx(LOCAL_ARTICLES_DIR, slug);
    return raw ? parseMdx(slug, raw) : null;
  }
  const raw = await fetchMdx(`articles/${slug}.mdx`, `article:${slug}`);
  return raw ? parseMdx(slug, raw) : null;
}

export async function getDraftBySlug(slug: string): Promise<Article | null> {
  if (!hasBlob()) {
    const raw = readLocalMdx(LOCAL_DRAFTS_DIR, slug);
    return raw ? parseMdx(slug, raw) : null;
  }
  const raw = await fetchMdx(`drafts/${slug}.mdx`, `draft:${slug}`);
  return raw ? parseMdx(slug, raw) : null;
}

export async function getArticlesByCategory(
  category: Category,
): Promise<Article[]> {
  return (await getAllArticles()).filter((a) => a.category === category);
}

export async function getFeaturedArticles(): Promise<Article[]> {
  return (await getAllArticles()).filter((a) => a.featured).slice(0, 3);
}

export async function getRelatedArticles(
  slug: string,
  category: Category,
): Promise<Article[]> {
  return (await getAllArticles())
    .filter((a) => a.slug !== slug && a.category === category)
    .slice(0, 3);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
