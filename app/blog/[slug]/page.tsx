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

function Callout({ type, children }: { type?: string; children: React.ReactNode }) {
  const styles: Record<string, string> = {
    info: "bg-blue-50 border-blue-200 text-blue-900",
    warning: "bg-amber-50 border-amber-200 text-amber-900",
    success: "bg-emerald-50 border-emerald-200 text-emerald-900",
  };
  const cls = styles[type ?? "info"] ?? styles.info;
  return (
    <div className={`my-6 border-l-4 rounded-r-md px-4 py-3 ${cls}`}>
      {children}
    </div>
  );
}

const mdxComponents = {
  AffiliateProductCard,
  AffiliateCard: AffiliateProductCard,
  AffiliateProduct: AffiliateProductCard,
  Callout,
};

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = true;

export async function generateStaticParams() {
  const articles = await getAllArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};

  const ogImage =
    article.imageOg ||
    article.image ||
    `/images/categories/${article.category}.svg`;

  return {
    title: article.title,
    description: article.description,
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      publishedTime: article.date,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
      images: [ogImage],
    },
    other: article.imagePinterest
      ? {
          "pinterest:image": article.imagePinterest,
        }
      : undefined,
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const related = await getRelatedArticles(slug, article.category);
  const heroImage = article.image || `/images/categories/${article.category}.svg`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    image: heroImage,
    publisher: {
      "@type": "Organization",
      name: "LeanBodyEngine",
      url: "https://fitbodyengine.com",
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
            <div className="mb-4">
              <CategoryBadge category={article.category} />
            </div>
            <h1 className="text-3xl md:text-5xl font-semibold text-[#0A0A0A] leading-[1.1] tracking-tight mb-5">
              {article.title}
            </h1>
            <p className="text-lg text-[#525252] leading-relaxed mb-6">
              {article.description}
            </p>
            <div className="flex items-center gap-4 text-sm text-[#A3A3A3] border-t border-b border-[#F5F5F5] py-3">
              <span>{formatDate(article.date)}</span>
              <span>·</span>
              <span>{article.readTime} min read</span>
            </div>
          </div>

          {/* Hero image */}
          <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-[#F5F5F5] mb-10 border border-[#E5E5E5]">
            <img
              src={heroImage}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>

          {/* Article content */}
          <div className="prose max-w-none">
            <MDXRemote source={article.content} components={mdxComponents} />
          </div>

          {/* Affiliate disclosure */}
          <div className="mt-12 p-4 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl text-xs text-[#525252]">
            <strong className="text-[#0A0A0A]">Affiliate disclosure:</strong>{" "}
            Some links in this article are affiliate links. If you purchase
            through them, we may earn a small commission at no extra cost to
            you. We only recommend products we genuinely believe in.
          </div>
        </div>

        {/* Related articles */}
        {related.length > 0 && (
          <div className="max-w-7xl mx-auto mt-20">
            <h2 className="text-2xl font-semibold text-[#0A0A0A] mb-7 tracking-tight">
              Related articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          </div>
        )}

        {/* Newsletter */}
        <div className="max-w-3xl mx-auto mt-16">
          <NewsletterCTA />
        </div>
      </div>
    </>
  );
}
