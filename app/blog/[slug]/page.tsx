import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import {
  getArticleBySlug,
  getAllArticles,
  getRelatedArticles,
  formatDate,
  categoryLabels,
} from "@/lib/articles";
import { SITE_URL } from "@/lib/site";
import { brand } from "@/lib/brand";
import CategoryBadge from "@/components/CategoryBadge";
import ArticleCard from "@/components/ArticleCard";
import AffiliateProductCard from "@/components/AffiliateProductCard";
import ComparisonTable from "@/components/ComparisonTable";
import NewsletterCTA from "@/components/NewsletterCTA";
import ReadingProgress from "@/components/ReadingProgress";
import TableOfContents, { type TocHeading } from "@/components/TableOfContents";
import FaqSection from "@/components/FaqSection";
import AuthorCard from "@/components/AuthorCard";
import Breadcrumb from "@/components/Breadcrumb";
import { buildProductListSchema } from "@/lib/product-schema";
import {
  buildLinkCandidates,
  injectContextualLinks,
} from "@/lib/contextual-links";

type MdxAnchorProps = { href?: string; children?: React.ReactNode };
function MdxAnchor({ href, children, ...rest }: MdxAnchorProps) {
  if (href && href.startsWith("/")) {
    return (
      <Link href={href} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}

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
  ComparisonTable,
  a: MdxAnchor,
};

const mdxOptions = {
  mdxOptions: {
    rehypePlugins: [rehypeSlug],
  },
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
      ? { "pinterest:image": article.imagePinterest }
      : undefined,
  };
}

function extractHeadings(content: string): TocHeading[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: TocHeading[] = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim().replace(/\*\*/g, "").replace(/`/g, "");
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    headings.push({ level, text, id });
  }
  return headings;
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const [related, allArticles] = await Promise.all([
    getRelatedArticles(slug, article.category),
    getAllArticles(),
  ]);
  const linkCandidates = buildLinkCandidates(allArticles, slug);
  const linkedContent = injectContextualLinks(article.content, linkCandidates);
  const heroImage = article.image || `/images/categories/${article.category}.svg`;
  const absoluteHeroImage = heroImage.startsWith("http")
    ? heroImage
    : `${SITE_URL}${heroImage.startsWith("/") ? "" : "/"}${heroImage}`;
  const pageUrl = `${SITE_URL}/blog/${article.slug}`;
  const publishedIso = new Date(article.date).toISOString();
  const headings = extractHeadings(article.content);

  const modifiedIso = article.updatedDate
    ? new Date(article.updatedDate).toISOString()
    : publishedIso;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: publishedIso,
    dateModified: modifiedIso,
    image: absoluteHeroImage,
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    author: brand.author.emitPersonSchema
      ? {
          "@type": "Person",
          "@id": `${SITE_URL}${brand.author.profileUrl}#author`,
          name: brand.author.name,
          url: `${SITE_URL}${brand.author.profileUrl}`,
          ...(brand.author.photoUrl
            ? {
                image: brand.author.photoUrl.startsWith("http")
                  ? brand.author.photoUrl
                  : `${SITE_URL}${brand.author.photoUrl}`,
              }
            : {}),
          ...(brand.author.credentials
            ? { jobTitle: brand.author.credentials }
            : {}),
          ...(brand.socials.length > 0
            ? { sameAs: brand.socials.map((s) => s.url) }
            : {}),
        }
      : {
          "@type": "Organization",
          name: brand.name,
          url: SITE_URL,
        },
    ...(brand.author.emitPersonSchema
      ? {
          reviewedBy: {
            "@type": "Person",
            "@id": `${SITE_URL}${brand.author.profileUrl}#author`,
            name: brand.author.name,
          },
        }
      : {}),
    publisher: {
      "@type": "Organization",
      name: brand.name,
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

  const productListSchema = buildProductListSchema(
    article.content,
    pageUrl,
    SITE_URL,
  );

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
      {productListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productListSchema) }}
        />
      )}
      <ReadingProgress />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Two-column layout on desktop */}
        <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-12 xl:grid-cols-[1fr_300px]">
          {/* Main content */}
          <div className="min-w-0">
            {/* Article header */}
            <div className="mb-8">
              <Breadcrumb
                items={[
                  { label: "Home", href: "/" },
                  { label: categoryLabels[article.category], href: `/category/${article.category}` },
                  { label: article.title },
                ]}
              />
              <div className="mb-4">
                <CategoryBadge category={article.category} />
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-[#0A0A0A] leading-[1.1] tracking-tight mb-5">
                {article.title}
              </h1>
              <p className="text-lg text-[#525252] leading-relaxed mb-6">
                {article.description}
              </p>
              <div className="flex items-center gap-4 text-sm text-[#A3A3A3] border-t border-b border-[#F5F5F5] py-3 flex-wrap">
                <Link
                  href={brand.author.profileUrl}
                  className="flex items-center gap-2 group"
                >
                  <span className="w-7 h-7 rounded-full bg-[#059669]/10 text-[#059669] text-[10px] font-bold flex items-center justify-center">
                    {brand.shortName}
                  </span>
                  <span className="text-[#525252] font-medium text-sm group-hover:text-[#059669] transition-colors">
                    {brand.author.name}
                  </span>
                </Link>
                <span>·</span>
                <span>Published {formatDate(article.date)}</span>
                {article.updatedDate && (
                  <>
                    <span>·</span>
                    <span className="text-[#059669] font-medium">Updated {formatDate(article.updatedDate)}</span>
                  </>
                )}
                <span>·</span>
                <span>{article.readTime} min read</span>
                {brand.author.emitPersonSchema && (
                  <>
                    <span>·</span>
                    <span className="text-xs text-[#A3A3A3]">
                      Reviewed by {brand.author.name}
                    </span>
                  </>
                )}
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

            {/* Mobile TOC */}
            {headings.length > 0 && (
              <div className="lg:hidden mb-8">
                <TableOfContents headings={headings} />
              </div>
            )}

            {/* Article content */}
            <div className="prose max-w-none">
              <MDXRemote source={linkedContent} components={mdxComponents} options={mdxOptions} />
            </div>

            {/* Affiliate disclosure */}
            <div className="mt-12 p-4 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl text-xs text-[#525252]">
              <strong className="text-[#0A0A0A]">Affiliate disclosure:</strong>{" "}
              Some links in this article are affiliate links. If you purchase
              through them, we may earn a small commission at no extra cost to
              you. We only recommend products we genuinely believe in.
            </div>

            {/* FAQ section (visible content required for FAQPage schema) */}
            {article.faq && article.faq.length > 0 && (
              <FaqSection items={article.faq} />
            )}

            {/* Author card — E-E-A-T signal */}
            {brand.author.emitPersonSchema && (
              <div className="mt-12">
                <AuthorCard variant="compact" linkToProfile />
              </div>
            )}
          </div>

          {/* Sticky sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              {headings.length > 0 && <TableOfContents headings={headings} />}

              {/* Quick info card */}
              <div className="bg-[#0f172a] rounded-xl p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
                  About this site
                </p>
                <p className="text-sm text-white/70 leading-relaxed mb-4">
                  {brand.author.bio}
                </p>
                <Link
                  href="/#newsletter"
                  className="block text-center text-sm font-semibold bg-[#059669] hover:bg-[#047857] text-white px-4 py-2.5 rounded-lg transition-colors"
                >
                  Get new articles →
                </Link>
              </div>
            </div>
          </aside>
        </div>

        {/* Related articles */}
        {related.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl font-bold text-[#0A0A0A] mb-7 tracking-tight">
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
