import type { Metadata } from "next";
import Link from "next/link";
import SupplementStackQuiz from "@/components/SupplementStackQuiz";
import FaqSection from "@/components/FaqSection";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Supplement Stack Quiz — Build Your Evidence-Based Stack",
  description:
    "Answer 5 questions about your goals, training, diet, sleep, and budget. Get a personalized supplement stack recommendation backed by evidence — not marketing.",
  alternates: { canonical: "/quiz/supplement-stack" },
  openGraph: {
    title: "Supplement Stack Quiz — Build Your Evidence-Based Stack",
    description:
      "Answer 5 questions. Get the supplements with the strongest evidence for your specific situation — and skip the rest.",
    type: "website",
    url: "/quiz/supplement-stack",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Supplement Stack Quiz — Build Your Evidence-Based Stack",
    description:
      "Answer 5 questions for a personalized supplement recommendation.",
  },
};

const faq = [
  {
    question: "How does this quiz decide what to recommend?",
    answer:
      "A rules-based mapping from your answers to supplements with the strongest research support for your specific situation. Protein powder is matched to your dietary needs (whey concentrate, whey isolate, or plant-based). Creatine is recommended for muscle or performance goals at 3+ sessions a week. Sleep supplements scale with the severity of the issue you report. Insurance picks (vitamin D, fish oil) scale with budget. It's editorial logic, not machine learning — every branch maps to a human-written reason.",
  },
  {
    question: "Why don't you recommend more supplements?",
    answer:
      "Because most supplements don't do anything meaningful for most people. The industry has thousands of SKUs and maybe a dozen with strong, replicated evidence in healthy adults. We'd rather tell you that whole food, sleep, and training are 90% of the outcome and point you at the 10% that matters — than pad the stack with BCAAs-for-everyone and HMB.",
  },
  {
    question: "Are these affiliate picks?",
    answer:
      "Some links are affiliate links — we may earn a commission if you buy through them at no cost to you. The picks are selected on evidence and track record, not commission rates. If a product doesn't deserve to be in your stack, we don't include it.",
  },
  {
    question: "Should I start everything at once?",
    answer:
      "No. Stagger additions by 2–4 weeks so you can tell what's actually doing something. If you start four supplements Monday and feel different by Friday, you have no way to know which one is working. Add protein powder first (biggest macro lever), then creatine, then sleep supplements if relevant, then insurance picks.",
  },
  {
    question: "What if my situation changes — should I retake?",
    answer:
      "Yes. The stack you need while building muscle on a 4-day split is different from what you need while cutting on a 2-day split, and different again when your sleep falls apart during a busy quarter. Retake the quiz when your goals, training, or life circumstances change — takes 30 seconds.",
  },
  {
    question: "Can I trust your recommendations if you're selling these?",
    answer:
      "Check the picks yourself — every product appears in our comparison pages and review articles with its full pros/cons breakdown. We'd rather keep sending you back for the next quiz than lose trust by pushing a bad pick for a better margin. If a recommendation seems off, dig into the source material; we cite it because we want the reasoning to hold up independently.",
  },
  {
    question: "What's not included and why?",
    answer:
      "We intentionally omit: most pre-workouts for beginner training frequencies (marginal at best), BCAAs for anyone eating pre-workout protein (redundant), glutamine (no benefit in non-clinical populations), testosterone boosters (nothing legal works), fat burners (caffeine is the only working ingredient, and you can buy caffeine for $5), and the entire 'recovery drink' category (protein + carbs does this for a quarter of the price).",
  },
];

export default function SupplementStackQuizPage() {
  const pageUrl = `${SITE_URL}/quiz/supplement-stack`;

  const appSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "LeanBodyEngine Supplement Stack Quiz",
    url: pageUrl,
    applicationCategory: "HealthApplication",
    operatingSystem: "Web",
    description:
      "Free 5-question quiz that recommends an evidence-based supplement stack based on your goal, training frequency, diet, sleep, and budget.",
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
        name: "Supplement Stack Quiz",
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
            Free interactive tool
          </p>
          <h1 className="text-3xl md:text-5xl font-bold text-[#0A0A0A] leading-[1.1] tracking-tight mb-4">
            Supplement Stack Quiz
          </h1>
          <p className="text-lg text-[#525252] leading-relaxed max-w-2xl">
            Five questions, thirty seconds. We&apos;ll recommend the handful of
            supplements with the strongest evidence for your situation — goal,
            training, diet, sleep, budget — and deliberately skip everything else.
          </p>
        </div>

        <SupplementStackQuiz />

        <section className="mt-14 md:mt-16">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#059669] mb-3">
            How this quiz thinks
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-[#0A0A0A] tracking-tight mb-5">
            Our recommendation logic, made explicit
          </h2>
          <div className="prose max-w-none text-[#525252] leading-relaxed">
            <p>
              We only recommend supplements that meet three criteria: (1) strong,
              replicated evidence in healthy adults, (2) a clear mechanism of
              action, and (3) a dose-response relationship that works at
              affordable retail doses. If any of those fail, the supplement
              doesn&apos;t make our stack — even if it sells like crazy.
            </p>

            <h3 className="text-lg font-bold text-[#0A0A0A] mt-6 mb-2">
              The short list of supplements we actually recommend
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 text-[15px]">
              <li>
                <strong>Protein powder</strong> — to hit a daily protein target
                when food is inconvenient. Matched to your diet.
              </li>
              <li>
                <strong>Creatine monohydrate</strong> — the most-studied performance
                supplement. 3–5 g/day, every day.
              </li>
              <li>
                <strong>Vitamin D3</strong> — most adults are deficient,
                particularly in winter or in northern latitudes.
              </li>
              <li>
                <strong>Fish oil</strong> — Western diets are under-consumed on
                omega-3s; 1–2 g combined EPA + DHA closes the gap.
              </li>
              <li>
                <strong>Magnesium glycinate</strong> — deepens sleep, supports
                nervous system recovery. Common dietary gap.
              </li>
              <li>
                <strong>Melatonin & ashwagandha</strong> — situational picks when
                sleep is genuinely broken or stress is the limiter.
              </li>
              <li>
                <strong>Multivitamin</strong> — hedge against small gaps, not a
                performance tool. Optional at higher budgets.
              </li>
              <li>
                <strong>Pre-workout</strong> — optional at high training
                frequencies with budget room. Everyone else: coffee is fine.
              </li>
            </ul>

            <h3 className="text-lg font-bold text-[#0A0A0A] mt-6 mb-2">
              What we intentionally don&apos;t recommend
            </h3>
            <p>
              BCAAs (redundant if you&apos;re eating protein), glutamine (no
              effect in healthy populations), testosterone boosters (nothing
              legal works), fat burners (caffeine is the only working ingredient
              and you can buy it for $5), and most &ldquo;recovery drink&rdquo;
              products (protein + a carb source does this for a fraction of the
              price). If a supplement isn&apos;t on our recommend-list, it&apos;s
              not an oversight — it&apos;s an active call.
            </p>
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-[#0A0A0A] tracking-tight mb-3">
            Once you have your stack
          </h2>
          <p className="text-[#525252] leading-relaxed mb-5">
            These resources make your stack actually useful:
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
                set your daily protein target so the protein powder has a job
              </span>
            </li>
            <li>
              <Link
                href="/compare"
                className="font-semibold text-[#059669] hover:text-[#047857]"
              >
                Product-vs-product comparisons →
              </Link>{" "}
              <span className="text-[#A3A3A3]">
                pick the specific brand that fits best within each category
              </span>
            </li>
            <li>
              <Link
                href="/category/supplements"
                className="font-semibold text-[#059669] hover:text-[#047857]"
              >
                Supplement review archive →
              </Link>{" "}
              <span className="text-[#A3A3A3]">
                deeper dives on dosing, timing, and edge cases
              </span>
            </li>
          </ul>
        </section>

        <FaqSection items={faq} />

        <section className="mt-12 pt-8 border-t border-[#E5E5E5] text-sm text-[#A3A3A3]">
          <p>
            Recommendations are for general educational purposes, not medical
            advice. Supplements can interact with medications and conditions —
            if you&apos;re on prescription medication, pregnant, or have a
            diagnosed metabolic, kidney, or liver condition, consult a physician
            or registered dietitian before starting anything new.
          </p>
        </section>
      </div>
    </>
  );
}
