import type { Metadata } from "next";
import Link from "next/link";
import OneRepMaxCalculator from "@/components/OneRepMaxCalculator";
import FaqSection from "@/components/FaqSection";
import { SITE_URL } from "@/lib/site";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "1RM Calculator — Estimate Your One-Rep Max",
  description:
    "Free one-rep max calculator. Estimates your 1RM from any rep set using Epley, Brzycki, Lombardi, and O'Conner formulas — plus a full training load table (55–100%).",
  alternates: { canonical: "/tools/1rm-calculator" },
  openGraph: {
    title: "1RM Calculator — Estimate Your One-Rep Max",
    description:
      "Free 1RM calculator with Epley + Brzycki formulas and a 55–100% training load table. No email, no paywall.",
    type: "website",
    url: "/tools/1rm-calculator",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "1RM Calculator — Estimate Your One-Rep Max",
    description:
      "Epley + Brzycki 1RM estimate with a full 55–100% training load table.",
  },
};

const faq = [
  {
    question: "How accurate is a 1RM calculator?",
    answer:
      "Accuracy is best in the 2–6 rep range — within about 5% of a true tested max for most trained lifters. It drops as reps climb, because the closer you get to true failure the more the weight curve bends: a 15-rep set isn't linearly related to a 1RM. For anything above 10 reps, treat the number as a ballpark, not a target.",
  },
  {
    question: "Which formula is most accurate — Epley or Brzycki?",
    answer:
      "They're similar and both well-validated. Brzycki tends to produce slightly lower estimates; Epley slightly higher. For most lifters the difference is under 3%. This calculator shows both plus Lombardi and O'Conner so you can see the spread, and the big headline number is the Epley/Brzycki average — the standard choice in strength-training research.",
  },
  {
    question: "Should I actually test my 1RM?",
    answer:
      "Only if you need the number for a powerlifting meet, a specific program, or pure curiosity — and only if your technique is solid. Testing a true 1RM is high-risk (peak fatigue, form breakdown, injury potential) and detrains for ~5–10 days afterwards. For most training purposes, an estimate from a heavy 3–5 rep set is safer and nearly as useful.",
  },
  {
    question: "What's a good rep set to plug in for accuracy?",
    answer:
      "A heavy set of 3–5 reps taken close to (but not at) failure gives the best 1RM estimate. Sets in the 1–2 range give accurate numbers but are basically testing. Sets above 8 reps introduce too much metabolic fatigue for the formulas to hold cleanly.",
  },
  {
    question: "How should I use the training load table?",
    answer:
      "It's a starting map for programming. 70–80% of 1RM is the standard hypertrophy range (8–12 reps). 80–90% is strength (3–6 reps). 90%+ is peak strength and top singles. Adjust the exact load based on how the bar moves on the day — RPE beats percentages when fatigue is real.",
  },
  {
    question: "Does this work for deadlift, squat, and bench equally?",
    answer:
      "The formulas don't care about the lift, but rep performance does vary by exercise. Most lifters can grind out more reps at a given percentage on squat and deadlift than on bench, because those lifts have more room for leverage and grind. Treat the estimate as a baseline and expect deadlift numbers to run a little higher than the formula predicts for high-rep sets.",
  },
  {
    question: "I'm a beginner — should I even be calculating a 1RM?",
    answer:
      "You can estimate for fun, but don't program around it. Beginner strength goes up too fast — the number from a 5×5 set this week is already wrong in two weeks. Run a progressive overload program (add weight every session while form holds) for 3–6 months before percentage-based training becomes worth the math.",
  },
  {
    question: "Why are there slightly different numbers between calculators online?",
    answer:
      "Different sites use different formula blends, default to different ones, or round differently. The underlying math is the same across Epley, Brzycki, Lombardi, and O'Conner — only the coefficients and curve shape differ. Any two reputable calculators should agree within 3–5% on a 2–8 rep input.",
  },
];

export default function OneRepMaxCalculatorPage() {
  const pageUrl = `${SITE_URL}/tools/1rm-calculator`;

  const appSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${brand.name} 1RM Calculator`,
    url: pageUrl,
    applicationCategory: "HealthApplication",
    operatingSystem: "Web",
    description:
      "Free one-rep max calculator. Estimates 1RM from any rep set using Epley, Brzycki, Lombardi, and O'Conner formulas, and generates a full 55–100% training load table.",
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
        name: "1RM Calculator`,
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
            1RM Calculator
          </h1>
          <p className="text-lg text-[#525252] leading-relaxed max-w-2xl">
            Estimate your one-rep max from any rep set — plus a full training
            load table from 67% to 100% for programming by percentage. Uses
            Epley, Brzycki, Lombardi, and O&apos;Conner formulas.
          </p>
        </div>

        <OneRepMaxCalculator />

        <section className="mt-14 md:mt-16">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#059669] mb-3">
            Under the hood
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-[#0A0A0A] tracking-tight mb-5">
            How this calculator works
          </h2>
          <div className="prose max-w-none text-[#525252] leading-relaxed">
            <p>
              Every 1RM formula models the same relationship: as weight goes
              up, the number of reps you can do with it goes down — and the
              curve is predictable. Plug in any heavy set and the math
              extrapolates to what you&apos;d lift for a single rep.
            </p>

            <h3 className="text-lg font-bold text-[#0A0A0A] mt-6 mb-2">
              The four formulas
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-[15px]">
              <li>
                <strong>Epley (1985):</strong>{" "}
                <code>1RM = weight × (1 + reps / 30)</code>
              </li>
              <li>
                <strong>Brzycki (1993):</strong>{" "}
                <code>1RM = weight × 36 / (37 − reps)</code>
              </li>
              <li>
                <strong>Lombardi (1989):</strong>{" "}
                <code>1RM = weight × reps^0.10</code>
              </li>
              <li>
                <strong>O&apos;Conner (1989):</strong>{" "}
                <code>1RM = weight × (1 + 0.025 × reps)</code>
              </li>
            </ul>
            <p>
              Epley and Brzycki are the two most referenced in strength research
              — they agree closely in the 2–10 rep range, which is where 1RM
              estimation is most reliable. We show all four so you can see the
              spread; the big headline number is the Epley/Brzycki average.
            </p>

            <h3 className="text-lg font-bold text-[#0A0A0A] mt-6 mb-2">
              The training load table
            </h3>
            <p>
              Once you have an estimated 1RM, you can program by percentage.
              Standard ranges: 70–80% of 1RM for hypertrophy (8–12 reps),
              80–90% for strength (3–6 reps), 90%+ for peak strength and top
              singles. Weights are rounded to the nearest 5 lb/kg since that&apos;s
              the smallest plate change on most bars.
            </p>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0A0A0A] tracking-tight mb-4">
            Getting the most accurate estimate
          </h2>
          <div className="text-[#525252] leading-relaxed space-y-3">
            <p>
              The sweet spot is a heavy set of 3–5 reps taken{" "}
              <strong>close to but not at</strong> failure — typically RPE 8–9.
              That&apos;s enough rep data for the formula to extrapolate
              cleanly, without the metabolic fatigue that distorts high-rep
              sets.
            </p>
            <p>
              Avoid plugging in AMRAP (as-many-reps-as-possible) sets from the
              end of a workout — accumulated fatigue means your actual fresh
              1RM is higher than the calculator will suggest. Use your first
              working set of the day, or a stand-alone heavy set done fresh.
            </p>
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-[#0A0A0A] tracking-tight mb-3">
            Use your numbers
          </h2>
          <p className="text-[#525252] leading-relaxed mb-5">
            Got your 1RM? Program around it with these:
          </p>
          <ul className="space-y-2 text-[15px]">
            <li>
              <Link
                href="/blog/progressive-overload-guide-muscle-building"
                className="font-semibold text-[#059669] hover:text-[#047857]"
              >
                Progressive overload guide →
              </Link>{" "}
              <span className="text-[#A3A3A3]">how to add weight intelligently</span>
            </li>
            <li>
              <Link
                href="/blog/compound-vs-isolation-exercises"
                className="font-semibold text-[#059669] hover:text-[#047857]"
              >
                Compound vs isolation exercises →
              </Link>{" "}
              <span className="text-[#A3A3A3]">what to prioritize for strength</span>
            </li>
            <li>
              <Link
                href="/tools/macro-calculator"
                className="font-semibold text-[#059669] hover:text-[#047857]"
              >
                Macro calculator →
              </Link>{" "}
              <span className="text-[#A3A3A3]">fuel your training</span>
            </li>
          </ul>
        </section>

        <FaqSection items={faq} />

        <section className="mt-12 pt-8 border-t border-[#E5E5E5] text-sm text-[#A3A3A3]">
          <p>
            Estimates are starting points, not guaranteed numbers. Real-world
            1RM varies with sleep, hydration, exercise-specific skill, and
            fatigue. Never attempt a true 1RM test without a spotter and
            proper warm-up ramp. If you&apos;re new to lifting, work with a
            qualified coach or run a linear progression program before
            programming by percentage.
          </p>
        </section>
      </div>
    </>
  );
}
