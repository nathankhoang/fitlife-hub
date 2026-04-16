import type { Metadata } from "next";
import Link from "next/link";
import NewsletterCTA from "@/components/NewsletterCTA";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about FitLife Hub — our mission to deliver honest, evidence-based fitness and wellness content.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <h1 className="text-4xl font-bold text-[#111827] mb-4">About FitLife Hub</h1>
      <p className="text-lg text-[#6B7280] mb-10 leading-relaxed">
        Real fitness advice, backed by science — built for people who want results without the BS.
      </p>

      <div className="prose max-w-none">
        <h2>Our Mission</h2>
        <p>
          FitLife Hub was built to cut through the noise in the fitness and
          wellness industry. There&apos;s a lot of misinformation out there —
          from overhyped supplements to extreme diets that don&apos;t work
          long-term. Our mission is simple: provide honest, practical, and
          evidence-based guidance that actually helps you reach your goals.
        </p>

        <h2>What We Cover</h2>
        <ul>
          <li>
            <strong>Home Workouts</strong> — effective routines for all fitness
            levels, no gym required
          </li>
          <li>
            <strong>Supplement Reviews</strong> — unbiased analysis of what
            works, what doesn&apos;t, and what&apos;s worth your money
          </li>
          <li>
            <strong>Diet & Nutrition</strong> — practical eating strategies
            backed by nutritional science
          </li>
          <li>
            <strong>Weight Loss</strong> — sustainable approaches that focus
            on long-term health
          </li>
          <li>
            <strong>Muscle Building</strong> — training principles and
            nutrition strategies for hypertrophy
          </li>
          <li>
            <strong>Wellness & Recovery</strong> — sleep, stress management,
            and recovery techniques
          </li>
        </ul>

        <h2>Affiliate Disclosure</h2>
        <p>
          FitLife Hub participates in affiliate programs including Amazon
          Associates, ClickBank, and ShareASale. When you click a product link
          and make a purchase, we may earn a small commission at no additional
          cost to you. This helps us keep the site running and content free.
        </p>
        <p>
          We only recommend products we genuinely believe are valuable. Our
          editorial opinions are never influenced by affiliate relationships.
        </p>
      </div>

      <div className="mt-10">
        <Link
          href="/blog"
          className="inline-block bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
        >
          Read Our Articles →
        </Link>
      </div>

      <div className="mt-14">
        <NewsletterCTA />
      </div>
    </div>
  );
}
