import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import {
  getArticleBySlug,
  getAllArticles,
  getRelatedArticles,
  formatDate,
  categoryLabels,
} from "@/lib/articles";
import { SITE_URL } from "@/lib/site";
import CategoryBadge from "@/components/CategoryBadge";
import ArticleCard from "@/components/ArticleCard";
import AffiliateProductCard from "@/components/AffiliateProductCard";
import NewsletterCTA from "@/components/NewsletterCTA";

const mdxComponents = {
  AffiliateProductCard,
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
  const absoluteHeroImage = heroImage.startsWith("http")
    ? heroImage
    : `${SITE_URL}${heroImage.startsWith("/") ? "" : "/"}${heroImage}`;
  const pageUrl = `${SITE_URL}/blog/${article.slug}`;
  const publishedIso = new Date(article.date).toISOString();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: publishedIso,
    dateModified: publishedIso,
    image: absoluteHeroImage,
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    author: {
      "@type": "Organization",
      name: "LeanBodyEngine",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "LeanBodyEngine",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/opengraph-image`,
      },
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: categoryLabels[article.category],
        item: `${SITE_URL}/category/${article.category}`,
      },
      { "@type": "ListItem", position: 3, name: article.title },
    ],
  };

  const faqSchema = article.faq && article.faq.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: article.faq.map(({ question, answer }) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      }
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

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
          <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-[#F5F5F5] mb-10 border border-[#E5E5E5]">
            <Image
              src={heroImage}
              alt={article.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
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
