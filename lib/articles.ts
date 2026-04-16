import fs from "fs";
import path from "path";
import matter from "gray-matter";

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
  content: string;
};

const articlesDir = path.join(process.cwd(), "content", "articles");

export function getAllArticles(): Article[] {
  const files = fs.readdirSync(articlesDir).filter((f) => f.endsWith(".mdx"));

  const articles = files.map((filename) => {
    const slug = filename.replace(".mdx", "");
    const raw = fs.readFileSync(path.join(articlesDir, filename), "utf8");
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
      content,
    };
  });

  return articles.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getArticleBySlug(slug: string): Article | null {
  const filePath = path.join(articlesDir, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf8");
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
    content,
  };
}

export function getArticlesByCategory(category: Category): Article[] {
  return getAllArticles().filter((a) => a.category === category);
}

export function getFeaturedArticles(): Article[] {
  return getAllArticles().filter((a) => a.featured).slice(0, 3);
}

export function getRelatedArticles(slug: string, category: Category): Article[] {
  return getAllArticles()
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
