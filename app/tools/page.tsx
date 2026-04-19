import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Free Fitness Tools & Calculators — ${brand.name}`,
  description:
    "Free evidence-based fitness calculators and tools. TDEE, macros, and more — no email required, no paywall.",
  alternates: { canonical: "/tools" },
  openGraph: {
    title: `Free Fitness Tools & Calculators — ${brand.name}`,
    description:
      "Evidence-based fitness calculators — TDEE, macros, and more. Free, no email, no paywall.",
    type: "website",
    url: "/tools",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: `Free Fitness Tools & Calculators — ${brand.name}`,
    description:
      "Evidence-based fitness calculators — TDEE, macros, and more.",
  },
};

type Tool = {
  slug: string;
  title: string;
  description: string;
  inputs: string;
  formulas: string;
  accent: string;
};

const tools: Tool[] = [
  {
    slug: "macro-calculator",
    title: "Macro Calculator",
    description:
      "Your TDEE, daily calorie target, and protein / carb / fat grams for cutting, maintenance, or bulking.",
    inputs: "Sex, age, height, weight, activity, goal · body fat % optional",
    formulas: "Mifflin-St Jeor · Katch-McArdle",
    accent: "#059669",
  },
  {
    slug: "1rm-calculator",
    title: "1RM Calculator",
    description:
      "Estimate your one-rep max from any rep set, plus a full training load table from 67% to 100%.",
    inputs: "Weight lifted, reps completed · exercise optional",
    formulas: "Epley · Brzycki · Lombardi · O'Conner",
    accent: "#059669",
  },
  {
    slug: "plate-calculator",
    title: "Plate Calculator",
    description:
      "Target weight in, plate stack per side out. Visual bar diagram and custom plate sets for your gym.",
    inputs: "Target weight, bar weight · available plates optional",
    formulas: "Greedy plate selection · lb/kg conversion",
    accent: "#059669",
  },
  {
    slug: "body-fat-calculator",
    title: "Body Fat Calculator",
    description:
      "Estimate body fat percentage with a tape measure — no calipers needed. Includes category classification and lean mass.",
    inputs: "Sex, height, neck, waist · hip (women) · weight optional",
    formulas: "US Navy circumference method",
    accent: "#059669",
  },
];

export default function ToolsIndexPage() {
  const pageUrl = `${SITE_URL}/tools`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Tools", item: pageUrl },
    ],
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": pageUrl,
    url: pageUrl,
    name: "Free Fitness Tools & Calculators",
    description:
      "Evidence-based fitness calculators and tools — TDEE, macros, and more.",
    isPartOf: {
      "@type": "WebSite",
      name: brand.name,
      url: SITE_URL,
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: tools.length,
      itemListElement: tools.map((t, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/tools/${t.slug}`,
        name: t.title,
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
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#059669] mb-3">
            Free tools
          </p>
          <h1 className="text-3xl md:text-5xl font-bold text-[#0A0A0A] leading-[1.1] tracking-tight mb-4">
            Fitness calculators & tools
          </h1>
          <p className="text-lg text-[#525252] leading-relaxed max-w-2xl">
            Evidence-based calculators that show their work. Every formula used
            is documented on each tool&apos;s page — no black-box math, no
            email required, no paywall.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {tools.map((t) => (
            <Link
              key={t.slug}
              href={`/tools/${t.slug}`}
              className="group rounded-2xl border border-[#E5E5E5] bg-white p-6 hover:border-[#A3A3A3] transition-colors"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${t.accent}15` }}
                aria-hidden
              >
                <svg
                  className="w-5 h-5"
                  style={{ color: t.accent }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 17v-2a4 4 0 014-4h4m-4 4l-4 4m4-4l-4-4m10 10V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-[#0A0A0A] tracking-tight mb-2 group-hover:text-[#059669] transition-colors">
                {t.title}
              </h2>
              <p className="text-[#525252] leading-relaxed text-[15px] mb-4">
                {t.description}
              </p>
              <dl className="space-y-3 text-xs">
                <div>
                  <dt className="font-semibold text-[#A3A3A3] uppercase tracking-[0.1em] mb-1">
                    Inputs
                  </dt>
                  <dd className="text-[#525252] leading-relaxed">{t.inputs}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[#A3A3A3] uppercase tracking-[0.1em] mb-1">
                    Formulas
                  </dt>
                  <dd className="text-[#525252] leading-relaxed">{t.formulas}</dd>
                </div>
              </dl>
              <p className="mt-5 text-sm font-semibold text-[#059669] group-hover:text-[#047857] transition-colors">
                Open tool →
              </p>
            </Link>
          ))}

          {/* Coming-soon placeholder so the grid isn't lonely */}
          <div
            className="rounded-2xl border border-dashed border-[#E5E5E5] bg-[#FAFAFA] p-6 flex flex-col items-start justify-center"
            aria-hidden
          >
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#A3A3A3] mb-2">
              Coming soon
            </p>
            <p className="text-[#525252] leading-relaxed text-[15px]">
              Wilks/DOTS powerlifting calculator and FFMI calculator are
              next on deck. Subscribe to get notified when they ship.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
