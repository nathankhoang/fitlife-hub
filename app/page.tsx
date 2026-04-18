import Link from "next/link";
import Image from "next/image";
import { getAllArticles, getFeaturedArticles, categoryLabels, type Category } from "@/lib/articles";
import { affiliateProducts } from "@/lib/affiliates";
import ArticleCard from "@/components/ArticleCard";
import NewsletterCTA from "@/components/NewsletterCTA";

const topPickIds = [
  "optimum-nutrition-gold-standard",
  "creatine-monohydrate-bulk",
  "cellucor-c4-preworkout",
  "foam-roller",
];

const promisePillars = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    title: "Evidence-Based",
    text: "Every claim is grounded in peer-reviewed research. No broscience, no sponsored talking points.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
    title: "No Sponsored Posts",
    text: "We don't accept payment for editorial coverage. Every opinion is independently formed.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Transparent Affiliates",
    text: "We earn commissions via Amazon Associates links — always clearly disclosed and never influence ratings.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: "Always Free",
    text: "No paywalls. No subscriptions. No premium tiers. Every guide is free to read, forever.",
  },
];

export default async function HomePage() {
  const featured = await getFeaturedArticles();
  const allArticles = await getAllArticles();
  const recent = allArticles.slice(0, 6);
  const articleCount = allArticles.length;
  const categories = Object.entries(categoryLabels) as [Category, string][];
  const topPicks = topPickIds.map((id) => affiliateProducts[id]).filter(Boolean);

  return (
    <div>
      {/* Hero – dark navy */}
      <section className="relative overflow-hidden bg-[#0f172a]">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute -top-32 right-0 w-[700px] h-[700px] rounded-full bg-[#059669]/10 blur-[140px]" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-[#F97316]/6 blur-[120px]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 py-24 md:py-36 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-medium px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/70 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            Evidence-based · No fluff
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-6 tracking-tight">
            Train smarter.
            <br />
            <span className="text-[#10B981]">Live stronger.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            Evidence-based guides on workouts, supplements, nutrition, and
            recovery — written for people who want real results, not gimmicks.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/blog"
              className="bg-[#059669] hover:bg-[#047857] text-white font-semibold px-7 py-3.5 rounded-xl transition-colors text-sm"
            >
              Browse all guides
            </Link>
            <Link
              href="/category/supplements"
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-7 py-3.5 rounded-xl border border-white/20 transition-colors text-sm"
            >
              Supplement reviews →
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-white/10 bg-white/5">
          <div className="max-w-3xl mx-auto px-4 py-7">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl md:text-3xl font-bold text-white">{articleCount}+</p>
                <p className="text-sm text-white/50 mt-1">guides published</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-white">6</p>
                <p className="text-sm text-white/50 mt-1">topics covered</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-white">100%</p>
                <p className="text-sm text-white/50 mt-1">free to read</p>
              </div>
            </div>
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
                className="text-[#525252] hover:text-[#0A0A0A] hover:bg-[#FAFAFA] text-sm font-medium px-3.5 py-1.5 rounded-full transition-colors border border-transparent hover:border-[#E5E5E5]"
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
                <h2 className="text-2xl font-bold text-[#0A0A0A] tracking-tight">
                  Featured guides
                </h2>
              </div>
              <Link href="/blog" className="text-[#059669] hover:text-[#047857] text-sm font-medium">
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

        {/* Our Promise */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#A3A3A3] mb-2">
              Our standards
            </p>
            <h2 className="text-2xl font-bold text-[#0A0A0A] tracking-tight">
              What we stand for
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {promisePillars.map((pillar) => (
              <div
                key={pillar.title}
                className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-2xl p-6 hover:border-[#059669]/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-[#059669]/10 text-[#059669] flex items-center justify-center mb-4">
                  {pillar.icon}
                </div>
                <h3 className="font-bold text-[#0A0A0A] mb-2 text-base">{pillar.title}</h3>
                <p className="text-[#525252] text-sm leading-relaxed">{pillar.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Top Supplement Picks */}
        <section className="mb-16">
          <div className="flex items-end justify-between mb-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#A3A3A3] mb-2">
                Top picks
              </p>
              <h2 className="text-2xl font-bold text-[#0A0A0A] tracking-tight">
                Our top-rated products
              </h2>
            </div>
            <Link
              href="/category/supplements"
              className="text-[#059669] hover:text-[#047857] text-sm font-medium"
            >
              All reviews →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {topPicks.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden hover:border-[#A3A3A3] hover:shadow-[0_4px_20px_rgba(0,0,0,0.07)] transition-all duration-200 flex flex-col"
              >
                <div className="bg-[#FAFAFA] aspect-square flex items-center justify-center p-6 border-b border-[#E5E5E5]">
                  <Image
                    src={product.imageUrl!}
                    alt={product.name}
                    width={160}
                    height={160}
                    className="object-contain w-full h-full"
                  />
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <p className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider mb-1.5">
                    Amazon · Affiliate
                  </p>
                  <h3 className="font-bold text-[#0A0A0A] text-sm leading-snug mb-2 tracking-tight flex-1">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#F5F5F5]">
                    <span className="text-sm font-semibold text-[#0A0A0A]">{product.priceRange}</span>
                    <a
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow sponsored"
                      className="inline-flex items-center gap-1 bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      View →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-[#A3A3A3] mt-4">
            Affiliate links — we earn a small commission at no extra cost to you.
          </p>
        </section>

        {/* Recent Articles */}
        <section className="mb-16">
          <div className="flex items-end justify-between mb-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#A3A3A3] mb-2">
                Just published
              </p>
              <h2 className="text-2xl font-bold text-[#0A0A0A] tracking-tight">
                Latest articles
              </h2>
            </div>
            <Link href="/blog" className="text-[#059669] hover:text-[#047857] text-sm font-medium">
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
