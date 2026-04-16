import Link from "next/link";
import { getAllArticles, getFeaturedArticles, categoryLabels, type Category } from "@/lib/articles";
import ArticleCard from "@/components/ArticleCard";
import NewsletterCTA from "@/components/NewsletterCTA";

const categoryEmojis: Record<Category, string> = {
  "home-workouts": "🏋️",
  supplements: "💊",
  "diet-nutrition": "🥗",
  "weight-loss": "⚖️",
  "muscle-building": "💪",
  wellness: "🧘",
};

export default function HomePage() {
  const featured = getFeaturedArticles();
  const recent = getAllArticles().slice(0, 6);
  const categories = Object.entries(categoryLabels) as [Category, string][];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#F8FAFC] to-[#DCFCE7] py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-[#16A34A]/10 text-[#16A34A] text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Fitness · Supplements · Nutrition
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#111827] leading-tight mb-6">
            Build a Stronger,{" "}
            <span className="text-[#16A34A]">Healthier You</span>
          </h1>
          <p className="text-lg md:text-xl text-[#6B7280] max-w-2xl mx-auto mb-8 leading-relaxed">
            Expert-written guides on workouts, supplements, diet, and wellness.
            Real advice backed by science — no fluff, no gimmicks.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/blog"
              className="bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold px-8 py-3.5 rounded-xl transition-colors text-sm"
            >
              Browse All Articles →
            </Link>
            <Link
              href="/category/supplements"
              className="bg-white hover:bg-[#F8FAFC] text-[#111827] font-semibold px-8 py-3.5 rounded-xl border border-[#E5E7EB] transition-colors text-sm"
            >
              Supplement Reviews
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Strip */}
      <section className="border-b border-[#E5E7EB] bg-white py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map(([slug, label]) => (
              <Link
                key={slug}
                href={`/category/${slug}`}
                className="flex items-center gap-2 bg-[#F8FAFC] hover:bg-[#DCFCE7] hover:text-[#16A34A] border border-[#E5E7EB] hover:border-[#16A34A]/30 text-[#374151] text-sm font-medium px-4 py-2 rounded-full transition-all"
              >
                <span>{categoryEmojis[slug]}</span>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {/* Featured Articles */}
        {featured.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#111827]">
                ⭐ Featured Articles
              </h2>
              <Link
                href="/blog"
                className="text-[#16A34A] hover:underline text-sm font-medium"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((article) => (
                <ArticleCard key={article.slug} article={article} featured />
              ))}
            </div>
          </section>
        )}

        {/* Recent Articles */}
        <section className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#111827]">
              Latest Articles
            </h2>
            <Link
              href="/blog"
              className="text-[#16A34A] hover:underline text-sm font-medium"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recent.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </section>

        {/* Newsletter */}
        <NewsletterCTA />
      </div>
    </div>
  );
}
