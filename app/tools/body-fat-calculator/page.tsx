import type { Metadata } from "next";
import Link from "next/link";
import BodyFatCalculator from "@/components/BodyFatCalculator";
import FaqSection from "@/components/FaqSection";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Body Fat Calculator — US Navy Method",
  description:
    "Free body fat percentage calculator using the US Navy tape-measure method. No calipers needed — just a tape measure. Imperial or metric, with lean mass breakdown.",
  alternates: { canonical: "/tools/body-fat-calculator" },
  openGraph: {
    title: "Body Fat Calculator — US Navy Method",
    description:
      "Estimate body fat with a tape measure — no calipers needed. US Navy formula, imperial or metric, plus lean mass breakdown.",
    type: "website",
    url: "/tools/body-fat-calculator",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Body Fat Calculator — US Navy Method",
    description:
      "Tape-measure body fat % — no calipers needed. Imperial or metric.",
  },
};

const faq = [
  {
    question: "How accurate is the Navy body fat method?",
    answer:
      "For a measurement you can do at home with a $5 tape measure, it's remarkably good — typically within 3–4% of a DEXA scan for most adults. Accuracy is best in the middle of the body-fat range (roughly 12–30%) and drops at the extremes, where waist, neck, and hip circumferences don't capture body composition as cleanly. It's not as precise as DEXA or hydrostatic weighing, but it's the most accurate no-equipment method available.",
  },
  {
    question: "Why does this use a tape measure instead of calipers?",
    answer:
      "Calipers require practice to use consistently — most people can't replicate their own measurements within 2–3% site-to-site. A tape measure is unambiguous: wrap it at the specified location, read the number. The Navy formula was specifically designed to work with circumferences because the military needed a field-deployable method that any instructor could apply with consistent results.",
  },
  {
    question: "Where exactly do I measure?",
    answer:
      "Neck: just below the larynx (Adam's apple), tape angled slightly downward, standing relaxed — don't flex. Waist: men measure at the navel level; women measure at the narrowest point, usually just above the navel. Hip (women only): the largest circumference around the hips and glutes, feet together. Keep the tape snug but not compressing the skin, and take each measurement twice — if they differ by more than half an inch, measure again.",
  },
  {
    question: "What's a healthy body fat percentage?",
    answer:
      "Men: 6–17% is the athletic/fitness range, 18–24% is average, 25%+ is classified as obese. Women: 14–24% is athletic/fitness, 25–31% is average, 32%+ is obese. Essential fat (minimum for health) is 2–5% for men, 10–13% for women — don't target levels that low without medical supervision.",
  },
  {
    question: "Why is the formula different for men and women?",
    answer:
      "Women carry a higher baseline of essential fat (around breasts, hips, thighs) for hormonal and reproductive function, so the same waist-to-neck ratio reflects different total body fat. The women's formula adds hip circumference to capture that distribution. Applying the men's formula to a woman would underestimate by roughly 6–10%.",
  },
  {
    question: "Should I care about body fat percentage or just bodyweight?",
    answer:
      "Bodyweight is fine for rough progress tracking, but body fat percentage is what actually tells you whether you're losing fat vs. muscle. Two people at identical weight and height can look completely different: one at 25% body fat is soft, one at 12% is athletic. If your scale weight is stuck but your waist is shrinking, you're recomping — body fat dropping, muscle mass holding or growing.",
  },
  {
    question: "My result seems way off — what should I check?",
    answer:
      "Ninety percent of the time it's a measurement issue. Re-measure your waist standing relaxed (not flexed, not sucking in) and at the correct anatomical point. Double-check you're reading the tape at the same level all the way around — a tape that rides up in the back inflates the number. If two independent measurements still give the same surprising result, the formula's probably right and the result just disagrees with what you expected.",
  },
  {
    question: "How often should I re-measure?",
    answer:
      "Every 2–4 weeks is enough. Measuring more often just adds noise — day-to-day variation from sodium, water, and food volume can shift your waist by half an inch either direction without any change in body fat. Take measurements first thing in the morning, after using the bathroom, before eating or drinking, for the most consistent read.",
  },
];

export default function BodyFatCalculatorPage() {
  const pageUrl = `${SITE_URL}/tools/body-fat-calculator`;

  const appSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "LeanBodyEngine Body Fat Calculator",
    url: pageUrl,
    applicationCategory: "HealthApplication",
    operatingSystem: "Web",
    description:
      "Free body fat percentage calculator using the US Navy tape-measure method. Estimates body fat from height, neck, waist (and hip for women) in imperial or metric, with category classification and lean mass breakdown.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    publisher: {
      "@type": "Organization",
      name: "LeanBodyEngine",
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
        name: "Body Fat Calculator",
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
            Body Fat Calculator
          </h1>
          <p className="text-lg text-[#525252] leading-relaxed max-w-2xl">
            Estimate your body fat percentage using the US Navy tape-measure
            method — no calipers or scales with hand sensors required. Just a
            soft tape measure and a mirror.
          </p>
        </div>

        <BodyFatCalculator />

        <section className="mt-14 md:mt-16">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#059669] mb-3">
            Under the hood
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-[#0A0A0A] tracking-tight mb-5">
            How this calculator works
          </h2>
          <div className="prose max-w-none text-[#525252] leading-relaxed">
            <p>
              The US Navy developed this formula in the 1980s as a
              field-deployable method to assess body composition without
              calipers, hydrostatic tanks, or DEXA scans. It uses log-linear
              regression on simple circumference measurements:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[15px]">
              <li>
                <strong>Men:</strong> BF% = 495 / (1.0324 − 0.19077 × log10(waist − neck) + 0.15456 × log10(height)) − 450
              </li>
              <li>
                <strong>Women:</strong> BF% = 495 / (1.29579 − 0.35004 × log10(waist + hip − neck) + 0.22100 × log10(height)) − 450
              </li>
            </ul>
            <p>
              All measurements are in centimeters for the formulas above (the
              calculator handles unit conversion automatically). The women&apos;s
              formula includes hip circumference because the distribution of
              essential body fat differs — applying the men&apos;s formula to a
              woman would underestimate by roughly 6–10%.
            </p>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0A0A0A] tracking-tight mb-5">
            How to measure accurately
          </h2>
          <div className="space-y-4">
            <MeasurementTip
              title="Neck"
              text="Tape just below the larynx (Adam's apple), angled slightly downward at the back. Stand relaxed — don't flex the neck or shrug the shoulders. Keep the tape snug but not compressing."
            />
            <MeasurementTip
              title="Waist (men)"
              text="Measure at the level of the navel, standing relaxed. Don't suck in. Don't flex abs. Breathe normally and take the measurement at the end of a relaxed exhale."
            />
            <MeasurementTip
              title="Waist (women)"
              text="Measure at the narrowest point of the torso, usually just above the navel. If you can't find a clear narrow point, use the navel level. Stand relaxed, breathe normally, take at the end of an exhale."
            />
            <MeasurementTip
              title="Hip (women only)"
              text="Stand with feet together. Measure at the largest circumference around the hips and glutes — this is usually around the tops of the hip bones, not at the waist. Keep the tape level front to back."
            />
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0A0A0A] tracking-tight mb-5">
            Body fat reference ranges (ACE)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <RangeCard
              title="Men"
              rows={[
                ["Essential fat", "2–5%", "#DC2626"],
                ["Athletes", "6–13%", "#059669"],
                ["Fitness", "14–17%", "#059669"],
                ["Average", "18–24%", "#F59E0B"],
                ["Obese", "25%+", "#DC2626"],
              ]}
            />
            <RangeCard
              title="Women"
              rows={[
                ["Essential fat", "10–13%", "#DC2626"],
                ["Athletes", "14–20%", "#059669"],
                ["Fitness", "21–24%", "#059669"],
                ["Average", "25–31%", "#F59E0B"],
                ["Obese", "32%+", "#DC2626"],
              ]}
            />
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-[#0A0A0A] tracking-tight mb-3">
            Related tools & reads
          </h2>
          <p className="text-[#525252] leading-relaxed mb-5">
            Dialed in your body fat? These help you move it in the direction
            you want:
          </p>
          <ul className="space-y-2 text-[15px]">
            <li>
              <Link
                href="/tools/macro-calculator"
                className="font-semibold text-[#059669] hover:text-[#047857]"
              >
                Macro calculator →
              </Link>{" "}
              <span className="text-[#A3A3A3]">
                set calories + macros for your goal
              </span>
            </li>
            <li>
              <Link
                href="/blog/fat-loss-vs-weight-loss-difference"
                className="font-semibold text-[#059669] hover:text-[#047857]"
              >
                Fat loss vs. weight loss →
              </Link>{" "}
              <span className="text-[#A3A3A3]">
                why the scale alone lies
              </span>
            </li>
            <li>
              <Link
                href="/blog/how-to-break-weight-loss-plateau"
                className="font-semibold text-[#059669] hover:text-[#047857]"
              >
                Breaking a weight-loss plateau →
              </Link>{" "}
              <span className="text-[#A3A3A3]">
                what to adjust when progress stalls
              </span>
            </li>
          </ul>
        </section>

        <FaqSection items={faq} />

        <section className="mt-12 pt-8 border-t border-[#E5E5E5] text-sm text-[#A3A3A3]">
          <p>
            Body fat estimates are for general tracking, not medical
            diagnosis. DEXA scans remain the practical gold standard for
            precise body composition, and no tape-measure method is appropriate
            for clinical decisions. If you&apos;re using body fat to track
            progress under a medical condition, work with your physician or a
            registered dietitian.
          </p>
        </section>
      </div>
    </>
  );
}

function MeasurementTip({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-[#E5E5E5] bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#059669] mb-1.5">
        {title}
      </p>
      <p className="text-[#525252] leading-relaxed text-[15px]">{text}</p>
    </div>
  );
}

function RangeCard({
  title,
  rows,
}: {
  title: string;
  rows: [string, string, string][];
}) {
  return (
    <div className="rounded-xl border border-[#E5E5E5] bg-white overflow-hidden">
      <div className="px-5 py-3 bg-[#FAFAFA] border-b border-[#E5E5E5]">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#525252]">
          {title}
        </p>
      </div>
      <ul className="divide-y divide-[#F5F5F5]">
        {rows.map(([label, range, color]) => (
          <li
            key={label}
            className="flex items-center justify-between px-5 py-3 text-sm"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
                aria-hidden
              />
              <span className="font-semibold text-[#0A0A0A]">{label}</span>
            </div>
            <span className="text-[#525252]">{range}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
