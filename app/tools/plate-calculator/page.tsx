import type { Metadata } from "next";
import Link from "next/link";
import PlateCalculator from "@/components/PlateCalculator";
import FaqSection from "@/components/FaqSection";
import { SITE_URL } from "@/lib/site";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Barbell Plate Calculator — Load Any Weight",
  description:
    "Free barbell plate calculator. Enter a target weight and bar, get the plate stack per side — lb or kg, with a visual bar diagram. Supports custom available-plate sets.",
  alternates: { canonical: "/tools/plate-calculator" },
  openGraph: {
    title: "Barbell Plate Calculator — Load Any Weight",
    description:
      "Get the exact plate stack per side for any target weight, in lb or kg. Visual bar diagram and custom plate sets.",
    type: "website",
    url: "/tools/plate-calculator",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Barbell Plate Calculator — Load Any Weight",
    description:
      "Plate stack per side for any target weight, in lb or kg, with a visual bar diagram.",
  },
};

const faq = [
  {
    question: "How does a plate calculator work?",
    answer:
      "Subtract the bar weight from your target, divide by two (both sides load the same), then greedily pick the largest available plate that still fits — repeat until you're out of room. The calculator does this instantly and shows you exactly what to grab.",
  },
  {
    question: "What's the standard Olympic bar weight?",
    answer:
      "A men's Olympic barbell is 45 lb (20 kg). A women's Olympic barbell is 35 lb (15 kg) — it's shorter and thinner for easier grip. Technique bars are typically 25-33 lb (10-15 kg) with Olympic-spec sleeves for learning. If you're not sure what your gym uses, ask — most commercial gyms have both men's and women's bars on the floor.",
  },
  {
    question: "Do I need the same plates on both sides?",
    answer:
      "Yes, always — unbalanced loading causes the bar to tip and is a serious injury risk. Both sides should be mirror-image identical: same plate weights, loaded in the same order, with a collar locking them in place. The calculator assumes symmetric loading.",
  },
  {
    question: "Why doesn't my exact target load cleanly sometimes?",
    answer:
      "The smallest standard plate in most commercial gyms is 2.5 lb (or 1.25 kg), so any total that isn't a multiple of 5 lb / 2.5 kg above the bar weight can't be loaded exactly. Either round to the nearest multiple or bring fractional plates (1.25 lb in lb gyms, 0.5-1 kg in kg gyms) if you need micro-progression.",
  },
  {
    question: "What's the correct way to load plates?",
    answer:
      "Largest plates closest to the bar sleeve collar, smallest on the outside. This keeps the bar balanced front-to-back, distributes force through the heaviest plates first, and makes adding or removing weight faster. Always secure with a collar or spring clip before lifting.",
  },
  {
    question: "How do I convert between pounds and kilograms?",
    answer:
      "1 kg = 2.2046 lb, and 1 lb = 0.4536 kg. Most people round: a 20 kg bar is called 45 lb (actually 44.1 lb), and 100 kg is called 225 lb (actually 220.5 lb). In powerlifting meets, kg is the official unit. In most US commercial gyms, lb is standard. The calculator converts automatically when you toggle units.",
  },
  {
    question: "My gym only has a few plate sizes — can this still help?",
    answer:
      "Yes. Use the \"available plates\" toggles to exclude anything your gym doesn't stock. The calculator re-runs with just the remaining plates and tells you how close it can get to your target. If you can't hit the exact number, the result shows the gap so you know what to add (or what small plates to bring yourself for micro-loading).",
  },
  {
    question: "What plate colors mean what?",
    answer:
      "International Weightlifting Federation (IWF) and IPF powerlifting use a color-coded kg system: red 25 kg, blue 20 kg, yellow 15 kg, green 10 kg, white 5 kg. Fractional plates — 2.5 kg, 1.25 kg, 0.5 kg — are smaller and use red/white/green respectively. US commercial-gym lb plates don't follow a standard color system — colors vary by brand.",
  },
];

export default function PlateCalculatorPage() {
  const pageUrl = `${SITE_URL}/tools/plate-calculator`;

  const appSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${brand.name} Barbell Plate Calculator`,
    url: pageUrl,
    applicationCategory: "HealthApplication",
    operatingSystem: "Web",
    description:
      "Free barbell plate calculator. Input a target weight and bar; outputs the plate stack per side in lb or kg with a visual bar diagram. Supports excluding plate sizes your gym doesn't stock.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    publisher: {
      "@type": "Organization",
      name: brand.name,
      url: SITE_URL,
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(({ question, answer }) => ({
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
        name: "Tools",
        item: `${SITE_URL}/tools`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Plate Calculator",
        item: pageUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="mb-8 md:mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#059669] mb-3">
            Free tool
          </p>
          <h1 className="text-3xl md:text-5xl font-bold text-[#0A0A0A] leading-[1.1] tracking-tight mb-4">
            Barbell Plate Calculator
          </h1>
          <p className="text-lg text-[#525252] leading-relaxed max-w-2xl">
            Enter a target weight and bar — get the exact plate stack per side,
            visualized on a bar. lb or kg, with a toggle for excluding plates
            your gym doesn&apos;t stock.
          </p>
        </div>

        <PlateCalculator />

        <section className="mt-14 md:mt-16">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#059669] mb-3">
            Under the hood
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-[#0A0A0A] tracking-tight mb-5">
            How this calculator works
          </h2>
          <div className="prose max-w-none text-[#525252] leading-relaxed">
            <p>
              The math is straightforward: target minus bar, divided by two,
              then greedy plate selection — largest first — until we run out
              of room.
            </p>
            <ol className="list-decimal pl-5 space-y-1.5 text-[15px]">
              <li>
                <strong>Per-side weight</strong> = (target − bar) ÷ 2
              </li>
              <li>
                Starting from the largest plate, take as many as fit without
                going over
              </li>
              <li>Move to the next plate down, repeat</li>
              <li>
                If the remainder is non-zero at the end, your available plates
                can&apos;t reach the exact target — the tool tells you how
                close it got
              </li>
            </ol>
            <p>
              The &ldquo;available plates&rdquo; toggles let you constrain the
              search to what your gym actually stocks, so the result is always
              usable, not theoretical.
            </p>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0A0A0A] tracking-tight mb-4">
            Standard plate sets
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-xl border border-[#E5E5E5] bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#525252] mb-3">
                Imperial (lb)
              </p>
              <ul className="space-y-1 text-sm text-[#0A0A0A]">
                <li>45 lb — full-size plate</li>
                <li>35 lb — full-size or &ldquo;change&rdquo; plate</li>
                <li>25 lb — smaller diameter</li>
                <li>10 lb — change plate</li>
                <li>5 lb — change plate</li>
                <li>2.5 lb — fractional plate</li>
              </ul>
            </div>
            <div className="rounded-xl border border-[#E5E5E5] bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#525252] mb-3">
                Metric (kg)
              </p>
              <ul className="space-y-1 text-sm text-[#0A0A0A]">
                <li>25 kg — red, full-size</li>
                <li>20 kg — blue, full-size</li>
                <li>15 kg — yellow, full-size</li>
                <li>10 kg — green, change plate</li>
                <li>5 kg — white, change plate</li>
                <li>2.5 kg — red, fractional</li>
                <li>1.25 kg — chrome, fractional</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-[#0A0A0A] tracking-tight mb-3">
            Related tools & reads
          </h2>
          <p className="text-[#525252] leading-relaxed mb-5">
            Load the bar, then use these to program the session:
          </p>
          <ul className="space-y-2 text-[15px]">
            <li>
              <Link
                href="/tools/1rm-calculator"
                className="font-semibold text-[#059669] hover:text-[#047857]"
              >
                1RM calculator →
              </Link>{" "}
              <span className="text-[#A3A3A3]">
                find target weights for any percentage
              </span>
            </li>
            <li>
              <Link
                href="/blog/progressive-overload-guide-muscle-building"
                className="font-semibold text-[#059669] hover:text-[#047857]"
              >
                Progressive overload guide →
              </Link>{" "}
              <span className="text-[#A3A3A3]">
                how to add weight intelligently
              </span>
            </li>
            <li>
              <Link
                href="/blog/compound-vs-isolation-exercises"
                className="font-semibold text-[#059669] hover:text-[#047857]"
              >
                Compound vs isolation exercises →
              </Link>{" "}
              <span className="text-[#A3A3A3]">
                what to prioritize for strength
              </span>
            </li>
          </ul>
        </section>

        <FaqSection items={faq} />

        <section className="mt-12 pt-8 border-t border-[#E5E5E5] text-sm text-[#A3A3A3]">
          <p>
            Always lift with collars or spring clips in place — an unsecured
            plate can slide mid-rep and tip the bar. Match plate weights on
            both sides. If a weight feels wrong once the bar is loaded, check
            your stack before pulling.
          </p>
        </section>
      </div>
    </>
  );
}
