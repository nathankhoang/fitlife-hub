import type { Metadata } from "next";
import Link from "next/link";
import MacroCalculator from "@/components/MacroCalculator";
import FaqSection from "@/components/FaqSection";
import { SITE_URL } from "@/lib/site";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Macro Calculator — Free TDEE & Macronutrient Tool",
  description:
    "Free macro calculator: get your TDEE, calorie target, and protein/carb/fat split for cutting, maintenance, or bulking — based on Mifflin-St Jeor and Katch-McArdle.",
  alternates: { canonical: "/tools/macro-calculator" },
  openGraph: {
    title: "Macro Calculator — Free TDEE & Macronutrient Tool",
    description:
      "Get your TDEE, daily calorie target, and protein / carb / fat split for any goal — backed by Mifflin-St Jeor and Katch-McArdle formulas.",
    type: "website",
    url: "/tools/macro-calculator",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Macro Calculator — Free TDEE & Macronutrient Tool",
    description:
      "Calorie target + protein / carb / fat split for any goal, with the actual formulas shown.",
  },
};

const faq = [
  {
    question: "What's the difference between BMR and TDEE?",
    answer:
      "BMR (basal metabolic rate) is the energy your body uses at complete rest to keep you alive — breathing, circulation, cell maintenance. TDEE (total daily energy expenditure) is BMR multiplied by an activity factor, so it reflects what you actually burn on a typical day including exercise and non-exercise movement. You eat against TDEE, not BMR.",
  },
  {
    question: "Which formula does this calculator use?",
    answer:
      "Mifflin-St Jeor by default — it's the most accurate population-wide formula for adults and the one most recommended by registered dietitians. If you enter a body fat percentage, we switch to Katch-McArdle, which calculates BMR from lean body mass and tends to be more accurate for lean or very muscular users.",
  },
  {
    question: "How many calories should I eat to lose fat?",
    answer:
      "A 15–25% deficit below your TDEE is the sweet spot for most people. A moderate cut (−15%) preserves more muscle and is easier to sustain; an aggressive cut (−25%) loses weight faster but is harder to hold and raises the risk of muscle loss if protein and training aren't dialed in. Don't drop below roughly 1,200 kcal (women) or 1,500 kcal (men) long term without medical supervision.",
  },
  {
    question: "How much protein do I actually need?",
    answer:
      "For active adults trying to build or keep muscle: roughly 0.7–1.0 g per pound of bodyweight (1.6–2.2 g/kg). Higher end when you're in a cut, lower end on a bulk. If you're very overweight, scale protein to lean body mass instead of total weight so you don't overshoot.",
  },
  {
    question: "Do I need to hit my macros on rest days?",
    answer:
      "Yes, as a baseline — recovery, muscle repair, and hormonal function all continue on off days. Some people cycle carbs slightly (more on training days, less on rest days) while keeping protein and fat steady, but for most people consistent daily targets produce the best adherence and results.",
  },
  {
    question: "Should I recalculate as I lose weight?",
    answer:
      "Yes. TDEE drops as bodyweight drops, so a target calculated at 200 lb will be too high when you hit 180 lb. Recalculate every 10–15 lb of change, or whenever progress stalls for 2–3 weeks despite consistent adherence.",
  },
  {
    question: "Is this accurate for women, teenagers, or people over 60?",
    answer:
      "Mifflin-St Jeor was validated across a wide adult population and works reasonably well for women and older adults, but individual variance is real — two people with identical stats can differ by 200–300 kcal. Use this as a starting estimate, then track for 2–3 weeks and adjust based on actual scale and measurement trends. If you're under 18, pregnant, or have a medical condition, talk to a registered dietitian rather than relying on a calculator.",
  },
  {
    question: "Why do my results seem much lower than other calculators?",
    answer:
      "Some calculators default to higher activity multipliers or less conservative goal adjustments. This tool uses the standard Mifflin-St Jeor multipliers (1.2–1.9) and caps cuts at 25% below TDEE with a hard calorie floor. If another calculator tells you a 5'6\" sedentary woman on an aggressive cut should eat 900 kcal, that calculator is wrong — not this one.",
  },
];

export default function MacroCalculatorPage() {
  const pageUrl = `${SITE_URL}/tools/macro-calculator`;

  const appSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${brand.name} Macro Calculator",
    url: pageUrl,
    applicationCategory: "HealthApplication",
    operatingSystem: "Web",
    description:
      "Free TDEE + macro calculator. Estimates basal metabolic rate with Mifflin-St Jeor or Katch-McArdle, applies an activity multiplier, and produces a calorie target and protein / carb / fat grams for cutting, maintenance, or bulking.",
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
        name: "Macro Calculator",
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
        {/* Header */}
        <div className="mb-8 md:mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#059669] mb-3">
            Free tool
          </p>
          <h1 className="text-3xl md:text-5xl font-bold text-[#0A0A0A] leading-[1.1] tracking-tight mb-4">
            Macro Calculator
          </h1>
          <p className="text-lg text-[#525252] leading-relaxed max-w-2xl">
            Your TDEE, daily calorie target, and protein / carb / fat split in
            grams — calculated with the same formulas registered dietitians
            actually use. No email required.
          </p>
        </div>

        {/* Calculator */}
        <MacroCalculator />

        {/* How it works */}
        <section className="mt-14 md:mt-16">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#059669] mb-3">
            Under the hood
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-[#0A0A0A] tracking-tight mb-5">
            How this calculator works
          </h2>
          <div className="prose max-w-none text-[#525252] leading-relaxed">
            <p>
              There are three steps, in order: estimate the energy your body
              spends just being alive (BMR), scale that for how much you move
              (TDEE), then nudge it up or down for your goal and split the
              remaining calories across the three macros.
            </p>

            <h3 className="text-lg font-bold text-[#0A0A0A] mt-6 mb-2">
              1. BMR — basal metabolic rate
            </h3>
            <p>
              Default formula is{" "}
              <strong>Mifflin-St Jeor</strong>, validated in 1990 and still the
              most accurate population-wide predictor for adults:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[15px]">
              <li>
                Male: <code>BMR = 10·kg + 6.25·cm − 5·age + 5</code>
              </li>
              <li>
                Female: <code>BMR = 10·kg + 6.25·cm − 5·age − 161</code>
              </li>
            </ul>
            <p>
              If you enter a body fat percentage we switch to{" "}
              <strong>Katch-McArdle</strong>, which is more accurate for lean
              or very muscular users because it works off lean body mass:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[15px]">
              <li>
                <code>BMR = 370 + 21.6·leanMassKg</code>
              </li>
            </ul>

            <h3 className="text-lg font-bold text-[#0A0A0A] mt-6 mb-2">
              2. TDEE — total daily energy expenditure
            </h3>
            <p>BMR multiplied by an activity factor:</p>
            <ul className="list-disc pl-5 space-y-1 text-[15px]">
              <li>Sedentary — 1.2</li>
              <li>Light (1–3 days/wk) — 1.375</li>
              <li>Moderate (3–5 days/wk) — 1.55</li>
              <li>Heavy (6–7 days/wk) — 1.725</li>
              <li>Athlete (2-a-days or physical job) — 1.9</li>
            </ul>

            <h3 className="text-lg font-bold text-[#0A0A0A] mt-6 mb-2">
              3. Goal adjustment + macros
            </h3>
            <p>
              Target calories are TDEE × a goal multiplier (−25% aggressive cut
              through +20% aggressive bulk). Protein is set per pound of
              bodyweight — scaling up for cuts (~1.1 g/lb) and down for bulks
              (~0.7 g/lb) — and fat takes the greater of a 0.35 g/lb floor or
              25% of calories. Carbs fill whatever&apos;s left.
            </p>
            <p>
              Calories are clamped to a safe floor ({" "}
              1,500 kcal for men, 1,200 kcal for women) so aggressive cuts
              can&apos;t return unsafely low numbers, and the tool warns you if
              protein plus fat already exhaust your calorie target.
            </p>
          </div>
        </section>

        {/* Picking activity */}
        <section className="mt-12">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0A0A0A] tracking-tight mb-4">
            How to pick an honest activity level
          </h2>
          <div className="text-[#525252] leading-relaxed space-y-3">
            <p>
              This is where most people overshoot. The activity multiplier
              already includes non-exercise movement — fidgeting, walking to
              the kitchen, errands — so if you work a desk job and lift 3x a
              week, you&apos;re <strong>Moderate</strong>, not Heavy. Heavy is for
              manual labor or serious daily training volume. Athlete is
              reserved for twice-daily training or a genuinely physical job
              (construction, moving, landscaping).
            </p>
            <p>
              If you&apos;re unsure, start one tier lower than you think. It&apos;s
              easier to add calories when progress is too slow than to claw
              back from an unintentional surplus.
            </p>
          </div>
        </section>

        {/* CTA to related articles */}
        <section className="mt-12 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-[#0A0A0A] tracking-tight mb-3">
            Use your numbers
          </h2>
          <p className="text-[#525252] leading-relaxed mb-5">
            Got your targets? These reads will help you hit them:
          </p>
          <ul className="space-y-2 text-[15px]">
            <li>
              <Link
                href="/blog/best-protein-powders-2025"
                className="font-semibold text-[#059669] hover:text-[#047857]"
              >
                Best protein powders →
              </Link>{" "}
              <span className="text-[#A3A3A3]">for hitting daily protein</span>
            </li>
            <li>
              <Link
                href="/blog/how-to-track-macros-beginners"
                className="font-semibold text-[#059669] hover:text-[#047857]"
              >
                How to track macros (beginner guide) →
              </Link>{" "}
              <span className="text-[#A3A3A3]">logging + apps walkthrough</span>
            </li>
            <li>
              <Link
                href="/blog/high-protein-meal-prep-beginners-guide"
                className="font-semibold text-[#059669] hover:text-[#047857]"
              >
                High-protein meal prep guide →
              </Link>{" "}
              <span className="text-[#A3A3A3]">macros on autopilot</span>
            </li>
          </ul>
        </section>

        {/* FAQ */}
        <FaqSection items={faq} />

        {/* Credibility footer */}
        <section className="mt-12 pt-8 border-t border-[#E5E5E5] text-sm text-[#A3A3A3]">
          <p>
            This calculator is provided for educational purposes. It&apos;s a
            starting estimate, not medical advice — individuals vary, and
            targets should be adjusted based on real-world progress. If you&apos;re
            under 18, pregnant, have an eating disorder history, or a
            diagnosed metabolic condition, work with a registered dietitian or
            physician rather than relying on any calculator.
          </p>
        </section>
      </div>
    </>
  );
}
