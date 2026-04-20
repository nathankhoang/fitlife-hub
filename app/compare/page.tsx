import type { Metadata } from "next";
import Link from "next/link";
import { comparisons, getProduct } from "@/lib/comparisons";
import { SITE_URL } from "@/lib/site";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Fitness Supplement Comparisons — ${brand.name}`,
  description:
    "Head-to-head fitness supplement comparisons — whey vs isolate, whey vs plant, stim vs non-stim pre-workouts, and more. Honest verdicts, no hype.",
  alternates: { canonical: "/compare" },
  openGraph: {
    title: `Fitness Supplement Comparisons — ${brand.name}`,
    description:
      "Whey vs plant, stim vs non-stim, concentrate vs isolate — head-to-head supplement comparisons with real verdicts.",
    type: "website",
    url: "/compare",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: `Fitness Supplement Comparisons — ${brand.name}`,
    description:
      "Head-to-head supplement comparisons with honest verdicts.",
  },
};

export default function CompareIndexPage() {
  const pageUrl = `${SITE_URL}/compare`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Compare", item: pageUrl },
    ],
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": pageUrl,
    url: pageUrl,
    name: "Fitness Supplement Comparisons",
    description:
      "Head-to-head supplement comparisons with evidence-backed verdicts.",
    isPartOf: {
      "@type": "WebSite",
      name: brand.name,
      url: SITE_URL,
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: comparisons.length,
      itemListElement: comparisons.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/compare/${c.slug}`,
        name: c.title,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="mb-10 md:mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)] mb-3">
            Head-to-head
          </p>
          <h1 className="text-3xl md:text-5xl font-bold text-[#0A0A0A] leading-[1.1] tracking-tight mb-4">
            Supplement comparisons
          </h1>
          <p className="text-lg text-[#525252] leading-relaxed max-w-2xl">
            Side-by-side comparisons of the supplements people actually ask
            about. Each page answers the real question — not &ldquo;which is
            better&rdquo; but &ldquo;which is better for what you&apos;re
            doing.&rdquo;
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {comparisons.map((c) => {
            const a = getProduct(c.a.productId);
            const b = getProduct(c.b.productId);
            return (
              <Link
                key={c.slug}
                href={`/compare/${c.slug}`}
                className="group rounded-2xl border border-[#E5E5E5] bg-white p-6 hover:border-[#A3A3A3] transition-colors"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#A3A3A3] mb-2">
                  {c.category}
                </p>
                <h2 className="text-xl font-bold text-[#0A0A0A] tracking-tight mb-3 group-hover:text-[var(--color-primary)] transition-colors">
                  {c.title}
                </h2>
                <div className="text-[#525252] text-[15px] leading-relaxed mb-4">
                  {a && b ? (
                    <>
                      <span className="font-semibold text-[#0A0A0A]">{a.name}</span>{" "}
                      vs{" "}
                      <span className="font-semibold text-[#0A0A0A]">{b.name}</span>
                    </>
                  ) : null}
                </div>
                <p className="text-sm font-semibold text-[var(--color-primary)] group-hover:text-[var(--color-primary-dark)] transition-colors">
                  See the comparison →
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
