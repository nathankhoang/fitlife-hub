import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import {
  getArticleBySlug,
  getAllArticles,
  getRelatedArticles,
  formatDate,
} from "@/lib/articles";
import CategoryBadge from "@/components/CategoryBadge";
import ArticleCard from "@/components/ArticleCard";
import AffiliateProductCard from "@/components/AffiliateProductCard";
import NewsletterCTA from "@/components/NewsletterCTA";

const mdxComponents = {
  AffiliateProductCard,
};

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};

  return {
    title: article.title,
    description: article.description,
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      publishedTime: article.date,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const related = getRelatedArticles(slug, article.category);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    publisher: {
      "@type": "Organization",
      name: "FitLife Hub",
      url: "http://localhost:3000",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-3xl mx-auto">
          {/* Article header */}
          <div className="mb-8">
            <div className="mb-3">
              <CategoryBadge category={article.category} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#111827] leading-tight mb-4">
              {article.title}
            </h1>
            <p className="text-lg text-[#6B7280] leading-relaxed mb-4">
              {article.description}
            </p>
            <div className="flex items-center gap-4 text-sm text-[#9CA3AF] border-t border-b border-[#F3F4F6] py-3">
              <span>{formatDate(article.date)}</span>
              <span>·</span>
              <span>{article.readTime} min read</span>
            </div>
          </div>

          {/* Article content */}
          <div className="prose max-w-none">
            <MDXRemote source={article.content} components={mdxComponents} />
          </div>

          {/* Affiliate disclosure */}
          <div className="mt-10 p-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg text-xs text-[#6B7280]">
            <strong>Affiliate Disclosure:</strong> Some links in this article
            are affiliate links. If you purchase through them, we may earn a
            small commission at no extra cost to you. We only recommend products
            we genuinely believe in.
          </div>
        </div>

        {/* Related articles */}
        {related.length > 0 && (
          <div className="max-w-7xl mx-auto mt-16">
            <h2 className="text-2xl font-bold text-[#111827] mb-6">
              Related Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          </div>
        )}

        {/* Newsletter */}
        <div className="max-w-3xl mx-auto mt-14">
          <NewsletterCTA />
        </div>
      </div>
    </>
  );
}
