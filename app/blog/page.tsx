import type { Metadata } from "next";
import Link from "next/link";
import { getAllArticles, categoryLabels, type Category } from "@/lib/articles";
import ArticleCard from "@/components/ArticleCard";

const blogTitle = "All Articles";
const blogDescription =
  "Browse all fitness, supplement, diet, and wellness articles on LeanBodyEngine.";

export const metadata: Metadata = {
  title: blogTitle,
  description: blogDescription,
  openGraph: {
    title: blogTitle,
    description: blogDescription,
    url: "/blog",
    type: "website",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: blogTitle,
    description: blogDescription,
  },
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const allArticles = await getAllArticles();

  const filtered =
    category && category in categoryLabels
      ? allArticles.filter((a) => a.category === category)
      : allArticles;

  const categories = Object.entries(categoryLabels) as [Category, string][];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#A3A3A3] mb-2">
          Library
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold text-[#0A0A0A] mb-2 tracking-tight">
          All articles
        </h1>
        <p className="text-[#525252]">
          {filtered.length} article{filtered.length !== 1 ? "s" : ""} on
          fitness, supplements, diet, and wellness.
        </p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-10">
        <Link
          href="/blog"
          className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors border ${
            !category
              ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
              : "bg-white text-[#525252] border-[#E5E5E5] hover:border-[#0A0A0A] hover:text-[#0A0A0A]"
          }`}
        >
          All
        </Link>
        {categories.map(([slug, label]) => (
          <Link
            key={slug}
            href={`/blog?category=${slug}`}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              category === slug
                ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                : "bg-white text-[#525252] border-[#E5E5E5] hover:border-[#0A0A0A] hover:text-[#0A0A0A]"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-[#525252] text-center py-20">No articles found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
