import type { Metadata } from "next";
import Link from "next/link";
import NewsletterCTA from "@/components/NewsletterCTA";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about LeanBodyEngine — our mission to deliver honest, evidence-based fitness and wellness content.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#A3A3A3] mb-3">
        About
      </p>
      <h1 className="text-4xl md:text-5xl font-semibold text-[#0A0A0A] mb-5 tracking-tight">
        Real fitness advice, backed by science.
      </h1>
      <p className="text-lg text-[#525252] mb-12 leading-relaxed">
        Built for people who want results without the BS — no overhyped
        supplements, no extreme diets, no gimmicks.
      </p>

      <div className="prose max-w-none">
        <h2>Our mission</h2>
        <p>
          LeanBodyEngine was built to cut through the noise in the fitness and
          wellness industry. There&apos;s a lot of misinformation out there —
          from overhyped supplements to extreme diets that don&apos;t work
          long-term. Our mission is simple: provide honest, practical, and
          evidence-based guidance that actually helps you reach your goals.
        </p>

        <h2>What we cover</h2>
        <ul>
          <li>
            <strong>Home workouts</strong> — effective routines for all fitness
            levels, no gym required
          </li>
          <li>
            <strong>Supplement reviews</strong> — unbiased analysis of what
            works, what doesn&apos;t, and what&apos;s worth your money
          </li>
          <li>
            <strong>Diet & nutrition</strong> — practical eating strategies
            backed by nutritional science
          </li>
          <li>
            <strong>Weight loss</strong> — sustainable approaches that focus
            on long-term health
          </li>
          <li>
            <strong>Muscle building</strong> — training principles and
            nutrition strategies for hypertrophy
          </li>
          <li>
            <strong>Wellness & recovery</strong> — sleep, stress management,
            and recovery techniques
          </li>
        </ul>

        <h2>Affiliate disclosure</h2>
        <p>
          LeanBodyEngine participates in affiliate programs including Amazon
          Associates, ClickBank, and ShareASale. When you click a product link
          and make a purchase, we may earn a small commission at no additional
          cost to you. This helps us keep the site running and content free.
        </p>
        <p>
          We only recommend products we genuinely believe are valuable. Our
          editorial opinions are never influenced by affiliate relationships.
        </p>
      </div>

      <div className="mt-12">
        <Link
          href="/blog"
          className="inline-block bg-[#0A0A0A] hover:bg-[#262626] text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
        >
          Read our articles →
        </Link>
      </div>

      <div className="mt-16">
        <NewsletterCTA />
      </div>
    </div>
  );
}
