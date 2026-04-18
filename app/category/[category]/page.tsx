import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getArticlesByCategory,
  categoryLabels,
  type Category,
} from "@/lib/articles";
import { SITE_URL } from "@/lib/site";
import ArticleCard from "@/components/ArticleCard";

type Props = { params: Promise<{ category: string }> };

const categoryMeta: Record<Category, { gradient: string; description: string }> = {
  "home-workouts": {
    gradient: "from-[#1e3a8a] to-[#0891b2]",
    description:
      "Effective routines you can do anywhere — no gym membership required. Build strength, endurance, and flexibility at home.",
  },
  supplements: {
    gradient: "from-[#064e3b] to-[#059669]",
    description:
      "Unbiased reviews of protein powders, creatine, pre-workouts, vitamins, and more. Find out what actually works.",
  },
  "diet-nutrition": {
    gradient: "from-[#92400e] to-[#d97706]",
    description:
      "Practical nutrition strategies backed by science. Macros, meal planning, and evidence-based eating for real results.",
  },
  "weight-loss": {
    gradient: "from-[#581c87] to-[#7c3aed]",
    description:
      "Sustainable fat loss without crash diets. The science of caloric deficit, metabolism, and keeping the weight off long-term.",
  },
  "muscle-building": {
    gradient: "from-[#7f1d1d] to-[#dc2626]",
    description:
      "Training programs and nutrition protocols to maximize hypertrophy. From beginner gains to breaking plateaus.",
  },
  wellness: {
    gradient: "from-[#134e4a] to-[#0f766e]",
    description:
      "Sleep optimization, stress management, and recovery techniques to support your training and overall health.",
  },
};

export async function generateStaticParams() {
  return Object.keys(categoryLabels).map((category) => ({ category }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  if (!(category in categoryLabels)) return {};
  const label = categoryLabels[category as Category];
  const title = `${label} Articles`;
  const description = `Browse all ${label.toLowerCase()} articles on LeanBodyEngine — expert tips, guides, and reviews.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/category/${category}`,
      type: "website",
      images: ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  if (!(category in categoryLabels)) notFound();

  const cat = category as Category;
  const articles = await getArticlesByCategory(cat);
  const label = categoryLabels[cat];
  const meta = categoryMeta[cat];

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: label },
    ],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Photo hero */}
      <section className={`relative overflow-hidden bg-gradient-to-br ${meta.gradient}`}>
        <Image
          src={`/images/categories/${cat}.jpg`}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
          aria-hidden
        />
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute inset-0 bg-black/45" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60 mb-3">
            Category
          </p>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            {label}
          </h1>
          <p className="text-white/70 text-lg max-w-2xl leading-relaxed mb-5">
            {meta.description}
          </p>
          <p className="text-white/50 text-sm">
            {articles.length} article{articles.length !== 1 ? "s" : ""}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {articles.length === 0 ? (
          <p className="text-[#525252] text-center py-20">
            No articles in this category yet. Check back soon!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
