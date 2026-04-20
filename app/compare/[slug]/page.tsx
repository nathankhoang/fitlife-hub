import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  comparisons,
  getComparison,
  getProduct,
  type ComparisonSide,
} from "@/lib/comparisons";
import type { AffiliateProduct } from "@/lib/affiliates";
import FaqSection from "@/components/FaqSection";
import { SITE_URL } from "@/lib/site";
import { brand } from "@/lib/brand";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return comparisons.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = getComparison(slug);
  if (!c) return {};
  return {
    title: c.metaTitle,
    description: c.metaDescription,
    alternates: { canonical: `/compare/${c.slug}` },
    openGraph: {
      title: c.metaTitle,
      description: c.metaDescription,
      type: "article",
      url: `/compare/${c.slug}`,
      images: ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title: c.metaTitle,
      description: c.metaDescription,
    },
  };
}

function parsePriceRange(priceRange: string): { low: number; high: number } | null {
  const normalized = priceRange.replace(/[–—]/g, "-");
  const match = normalized.match(/\$(\d+(?:\.\d+)?)\s*-\s*\$?(\d+(?:\.\d+)?)/);
  if (!match) return null;
  return { low: Number(match[1]), high: Number(match[2]) };
}

export default async function ComparisonPage({ params }: Props) {
  const { slug } = await params;
  const c = getComparison(slug);
  if (!c) notFound();

  const a = getProduct(c.a.productId);
  const b = getProduct(c.b.productId);
  if (!a || !b) notFound();

  const pageUrl = `${SITE_URL}/compare/${c.slug}`;

  const productLd = (p: AffiliateProduct) => {
    const image = p.imageUrl
      ? p.imageUrl.startsWith("http")
        ? p.imageUrl
        : `${SITE_URL}${p.imageUrl}`
      : undefined;
    const price = parsePriceRange(p.priceRange);
    return {
      "@type": "Product",
      name: p.name,
      description: p.description,
      ...(image ? { image } : {}),
      review: {
        "@type": "Review",
        reviewRating: {
          "@type": "Rating",
          ratingValue: p.rating.toFixed(1),
          bestRating: "5",
        },
        author: {
          "@type": "Organization",
          name: brand.name,
          url: SITE_URL,
        },
      },
      offers: price
        ? {
            "@type": "AggregateOffer",
            priceCurrency: "USD",
            lowPrice: price.low.toFixed(2),
            highPrice: price.high.toFixed(2),
            url: p.url,
          }
        : {
            "@type": "Offer",
            priceCurrency: "USD",
            url: p.url,
            availability: "https://schema.org/InStock",
          },
    };
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    url: pageUrl,
    numberOfItems: 2,
    itemListElement: [
      { "@type": "ListItem", position: 1, item: productLd(a) },
      { "@type": "ListItem", position: 2, item: productLd(b) },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faq.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Compare",
        item: `${SITE_URL}/compare`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: c.title,
        item: pageUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {/* Header */}
        <div className="mb-8 md:mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)] mb-3">
            {c.category} · Head-to-head
          </p>
          <h1 className="text-3xl md:text-5xl font-bold text-[#0A0A0A] leading-[1.1] tracking-tight mb-4">
            {c.title}
          </h1>
          <p className="text-lg text-[#525252] leading-relaxed max-w-2xl">
            {c.intro}
          </p>
        </div>

        {/* Side-by-side cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          <SideCard side={c.a} product={a} />
          <SideCard side={c.b} product={b} />
        </div>

        {/* Picks */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0A0A0A] tracking-tight mb-5">
            Which one wins, by use case
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {c.picks.map((pick, i) => {
              const p = getProduct(pick.productId);
              if (!p) return null;
              return (
                <div
                  key={i}
                  className="rounded-xl border border-[#E5E5E5] bg-white p-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)] mb-1.5">
                    {pick.label}
                  </p>
                  <p className="text-[#0A0A0A] font-bold text-[15px] leading-snug mb-2">
                    {p.name}
                  </p>
                  <p className="text-[#525252] text-sm leading-relaxed">
                    {pick.reason}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Verdict */}
        <section className="mb-12 rounded-2xl border border-[#E5E5E5] bg-[#0f172a] text-white p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/60 mb-3">
            The verdict
          </p>
          <p className="text-[17px] leading-relaxed text-white/90">
            {c.verdict}
          </p>
        </section>

        {/* Quick compare table */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0A0A0A] tracking-tight mb-5">
            Quick compare
          </h2>
          <div className="rounded-xl border border-[#E5E5E5] bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#FAFAFA] text-[#525252]">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-[0.1em]">
                    Spec
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-[0.1em]">
                    {a.name}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-[0.1em]">
                    {b.name}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F5] text-[#0A0A0A]">
                <SpecRow label="Rating" av={`${a.rating.toFixed(1)} / 5`} bv={`${b.rating.toFixed(1)} / 5`} />
                <SpecRow label="Price range" av={a.priceRange} bv={b.priceRange} />
                <SpecRow label="Source" av={a.source === "amazon" ? "Amazon" : a.source} bv={b.source === "amazon" ? "Amazon" : b.source} />
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <FaqSection items={c.faq} />

        {/* CTAs to other comparisons */}
        <section className="mt-12 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-[#0A0A0A] tracking-tight mb-3">
            More comparisons
          </h2>
          <ul className="space-y-2 text-[15px]">
            {comparisons
              .filter((other) => other.slug !== c.slug)
              .slice(0, 5)
              .map((other) => (
                <li key={other.slug}>
                  <Link
                    href={`/compare/${other.slug}`}
                    className="font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]"
                  >
                    {other.title} →
                  </Link>
                </li>
              ))}
          </ul>
        </section>

        {/* Disclosure */}
        <section className="mt-12 pt-8 border-t border-[#E5E5E5] text-sm text-[#A3A3A3]">
          <p>
            Affiliate disclosure: Some links in this comparison are affiliate
            links. If you buy through them we may earn a commission at no cost
            to you. We only recommend products we genuinely believe in, and
            price/rating data reflects the most recent update.
          </p>
        </section>
      </div>
    </>
  );
}

function SideCard({
  side,
  product,
}: {
  side: ComparisonSide;
  product: AffiliateProduct;
}) {
  const imageUrl = product.imageUrl ?? "/images/products/placeholder.svg";
  const ctaLabel =
    product.source === "amazon" ? "Check price on Amazon" : "View deal";

  return (
    <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 flex flex-col">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)] mb-3">
        {side.heading}
      </p>

      <div className="flex items-start gap-4 mb-4">
        <div className="relative w-20 h-20 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] flex-shrink-0 overflow-hidden">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="80px"
            className="object-contain"
          />
        </div>
        <div className="min-w-0">
          <h3 className="text-[#0A0A0A] font-bold text-base leading-snug mb-1">
            {product.name}
          </h3>
          <div className="flex items-baseline gap-3 text-sm">
            <span className="text-[#0A0A0A] font-semibold">
              {product.rating.toFixed(1)}{" "}
              <span className="text-[#A3A3A3] font-normal">/ 5</span>
            </span>
            <span className="text-[#525252]">{product.priceRange}</span>
          </div>
        </div>
      </div>

      <p className="text-[#525252] text-[15px] leading-relaxed mb-5">
        {side.summary}
      </p>

      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)] mb-2">
          Pros
        </p>
        <ul className="space-y-1.5">
          {side.pros.map((pro, i) => (
            <li key={i} className="flex gap-2 text-sm text-[#0A0A0A]">
              <span className="text-[var(--color-primary)] font-bold flex-shrink-0" aria-hidden>
                +
              </span>
              <span className="leading-snug">{pro}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#DC2626] mb-2">
          Cons
        </p>
        <ul className="space-y-1.5">
          {side.cons.map((con, i) => (
            <li key={i} className="flex gap-2 text-sm text-[#525252]">
              <span className="text-[#DC2626] font-bold flex-shrink-0" aria-hidden>
                −
              </span>
              <span className="leading-snug">{con}</span>
            </li>
          ))}
        </ul>
      </div>

      <a
        href={product.url}
        target="_blank"
        rel="noopener noreferrer nofollow sponsored"
        className="mt-auto inline-flex items-center justify-center gap-1.5 bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
      >
        {ctaLabel}
        <span aria-hidden>→</span>
      </a>
    </div>
  );
}

function SpecRow({ label, av, bv }: { label: string; av: string; bv: string }) {
  return (
    <tr>
      <td className="px-4 py-3 text-[#525252] font-semibold text-xs uppercase tracking-[0.1em]">
        {label}
      </td>
      <td className="px-4 py-3 font-semibold">{av}</td>
      <td className="px-4 py-3 font-semibold">{bv}</td>
    </tr>
  );
}
