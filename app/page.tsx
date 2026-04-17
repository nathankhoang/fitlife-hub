import Link from "next/link";
import { getAllArticles, getFeaturedArticles, categoryLabels, type Category } from "@/lib/articles";
import ArticleCard from "@/components/ArticleCard";
import NewsletterCTA from "@/components/NewsletterCTA";

export default async function HomePage() {
  const featured = await getFeaturedArticles();
  const recent = (await getAllArticles()).slice(0, 6);
  const categories = Object.entries(categoryLabels) as [Category, string][];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[#E5E5E5] bg-[#FAFAFA]">
        <div className="absolute inset-0 pointer-events-none opacity-50" aria-hidden>
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#10B981]/10 blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 py-24 md:py-32 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-white border border-[#E5E5E5] text-[#525252] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
            Honest fitness content. No fluff.
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold text-[#0A0A0A] leading-[1.05] mb-6 tracking-tight">
            Train smarter.
            <br />
            <span className="text-[#059669]">Live stronger.</span>
          </h1>
          <p className="text-lg md:text-xl text-[#525252] max-w-2xl mx-auto mb-10 leading-relaxed">
            Evidence-based guides on workouts, supplements, nutrition, and
            recovery — written for people who want results, not gimmicks.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/blog"
              className="bg-[#0A0A0A] hover:bg-[#262626] text-white font-semibold px-7 py-3.5 rounded-xl transition-colors text-sm"
            >
              Browse all articles
            </Link>
            <Link
              href="/category/supplements"
              className="bg-white hover:bg-[#FAFAFA] text-[#0A0A0A] font-semibold px-7 py-3.5 rounded-xl border border-[#E5E5E5] transition-colors text-sm"
            >
              Read supplement reviews →
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Strip */}
      <section className="border-b border-[#E5E5E5] bg-white py-5 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map(([slug, label]) => (
              <Link
                key={slug}
                href={`/category/${slug}`}
                className="text-[#525252] hover:text-[#0A0A0A] hover:bg-[#FAFAFA] text-sm font-medium px-3.5 py-1.5 rounded-full transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Featured Articles */}
        {featured.length > 0 && (
          <section className="mb-16">
            <div className="flex items-end justify-between mb-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#A3A3A3] mb-2">
                  Editor&apos;s picks
                </p>
                <h2 className="text-2xl font-semibold text-[#0A0A0A] tracking-tight">
                  Featured articles
                </h2>
              </div>
              <Link
                href="/blog"
                className="text-[#059669] hover:text-[#047857] text-sm font-medium"
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
        <section className="mb-16">
          <div className="flex items-end justify-between mb-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#A3A3A3] mb-2">
                Just published
              </p>
              <h2 className="text-2xl font-semibold text-[#0A0A0A] tracking-tight">
                Latest articles
              </h2>
            </div>
            <Link
              href="/blog"
              className="text-[#059669] hover:text-[#047857] text-sm font-medium"
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
