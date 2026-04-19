import type { Metadata } from "next";
import Link from "next/link";
import NewsletterCTA from "@/components/NewsletterCTA";
import AuthorCard from "@/components/AuthorCard";
import { brand } from "@/lib/brand";
import { SITE_URL } from "@/lib/site";

const aboutUrl = `${SITE_URL}/about`;

export const metadata: Metadata = {
  title: brand.author.emitPersonSchema
    ? `About ${brand.author.name}`
    : "About",
  description: brand.author.emitPersonSchema
    ? `${brand.author.name} writes ${brand.name} — ${brand.author.bio}`
    : `Learn about ${brand.name} — our mission to deliver honest, evidence-based fitness and wellness content.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const personSchema = brand.author.emitPersonSchema
    ? {
        "@context": "https://schema.org",
        "@type": "Person",
        "@id": `${aboutUrl}#author`,
        name: brand.author.name,
        url: aboutUrl,
        description: brand.author.bio,
        ...(brand.author.photoUrl
          ? {
              image: brand.author.photoUrl.startsWith("http")
                ? brand.author.photoUrl
                : `${SITE_URL}${brand.author.photoUrl}`,
            }
          : {}),
        ...(brand.author.credentials ? { jobTitle: brand.author.credentials } : {}),
        ...(brand.author.knowsAbout && brand.author.knowsAbout.length > 0
          ? { knowsAbout: brand.author.knowsAbout }
          : {}),
        ...(brand.socials.length > 0
          ? { sameAs: brand.socials.map((s) => s.url) }
          : {}),
        worksFor: {
          "@type": "Organization",
          name: brand.name,
          url: SITE_URL,
        },
      }
    : null;

  const aboutPageSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": aboutUrl,
    url: aboutUrl,
    name: brand.author.emitPersonSchema
      ? `About ${brand.author.name}`
      : `About ${brand.name}`,
    isPartOf: {
      "@type": "WebSite",
      name: brand.name,
      url: SITE_URL,
    },
    ...(personSchema
      ? {
          mainEntity: { "@id": `${aboutUrl}#author` },
        }
      : {}),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "About", item: aboutUrl },
    ],
  };

  const isAuthorMode = brand.author.emitPersonSchema;

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {personSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
      )}

      {/* Hero */}
      <section className="border-b border-[#E5E5E5] bg-[#FAFAFA]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#A3A3A3] mb-3">
            About
          </p>
          {isAuthorMode ? (
            <>
              <h1 className="text-4xl md:text-5xl font-bold text-[#0A0A0A] mb-5 tracking-tight">
                Hi, I&apos;m {brand.author.name.split(" ")[0]}.
              </h1>
              <p className="text-lg text-[#525252] leading-relaxed">
                {brand.author.bio}
              </p>
            </>
          ) : (
            <>
              <h1 className="text-4xl md:text-5xl font-bold text-[#0A0A0A] mb-5 tracking-tight">
                Real fitness advice,
                <br />
                backed by science.
              </h1>
              <p className="text-lg text-[#525252] leading-relaxed">
                Built for people who want results without the BS — no overhyped
                supplements, no extreme diets, no gimmicks.
              </p>
            </>
          )}
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16 space-y-12">
        {isAuthorMode && (
          <AuthorCard variant="full" linkToProfile={false} />
        )}

        <div className="prose max-w-none">
          <h2>{isAuthorMode ? `Why ${brand.name} exists` : "Our mission"}</h2>
          <p>
            {brand.name} was built to cut through the noise in the fitness and
            wellness industry. There&apos;s a lot of misinformation out there —
            from overhyped supplements to extreme diets that don&apos;t work
            long-term.{" "}
            {isAuthorMode
              ? "The goal here is simple: every piece of content starts with the peer-reviewed evidence, gets tested against real-world practice, and ends with advice I'd give a friend — not a sales pitch."
              : "Our mission is simple: provide honest, practical, and evidence-based guidance that actually helps you reach your goals."}
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
              <strong>Diet &amp; nutrition</strong> — practical eating strategies
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
              <strong>Wellness &amp; recovery</strong> — sleep, stress management,
              and recovery techniques
            </li>
          </ul>

          <h2>How we make money</h2>
          <p>
            {brand.name} participates in the Amazon Associates program. When
            you click a product link and make a purchase, we may earn a small
            commission at no additional cost to you. This helps keep the site
            running and all content free to read.
          </p>
          <p>
            We only recommend products we genuinely believe are valuable. Our
            editorial opinions are <strong>never influenced</strong> by affiliate
            relationships — we decline any product that doesn&apos;t meet our
            standards regardless of commission rates.
          </p>

          <h2>Contact</h2>
          <p>
            Questions, corrections, or partnership inquiries? Reach us at{" "}
            <a href={`mailto:${brand.contact.email}`}>{brand.contact.email}</a>.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/blog"
            className="inline-block bg-[#059669] hover:bg-[#047857] text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            Browse all articles →
          </Link>
          <Link
            href="/category/supplements"
            className="inline-block bg-white hover:bg-[#FAFAFA] text-[#0A0A0A] font-semibold px-6 py-3 rounded-xl border border-[#E5E5E5] transition-colors text-sm"
          >
            Supplement reviews
          </Link>
        </div>

        <NewsletterCTA />
      </div>
    </div>
  );
}
