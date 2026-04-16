import type { Metadata } from "next";
import { getAllArticles, categoryLabels, type Category } from "@/lib/articles";
import ArticleCard from "@/components/ArticleCard";

export const metadata: Metadata = {
  title: "All Articles",
  description:
    "Browse all fitness, supplement, diet, and wellness articles on FitLife Hub.",
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const allArticles = getAllArticles();

  const filtered =
    category && category in categoryLabels
      ? allArticles.filter((a) => a.category === category)
      : allArticles;

  const categories = Object.entries(categoryLabels) as [Category, string][];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#111827] mb-2">
          All Articles
        </h1>
        <p className="text-[#6B7280]">
          {filtered.length} article{filtered.length !== 1 ? "s" : ""} on
          fitness, supplements, diet, and wellness
        </p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <a
          href="/blog"
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
            !category
              ? "bg-[#16A34A] text-white border-[#16A34A]"
              : "bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#16A34A] hover:text-[#16A34A]"
          }`}
        >
          All
        </a>
        {categories.map(([slug, label]) => (
          <a
            key={slug}
            href={`/blog?category=${slug}`}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
              category === slug
                ? "bg-[#16A34A] text-white border-[#16A34A]"
                : "bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#16A34A] hover:text-[#16A34A]"
            }`}
          >
            {label}
          </a>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-[#6B7280] text-center py-20">No articles found.</p>
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
