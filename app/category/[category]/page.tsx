import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getArticlesByCategory,
  categoryLabels,
  type Category,
} from "@/lib/articles";
import ArticleCard from "@/components/ArticleCard";
import CategoryBadge from "@/components/CategoryBadge";

type Props = { params: Promise<{ category: string }> };

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      {/* Category hero strip */}
      <div className="aspect-[16/5] rounded-2xl overflow-hidden bg-[#F5F5F5] mb-10 border border-[#E5E5E5]">
        <img
          src={`/images/categories/${cat}.svg`}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      <div className="mb-10">
        <div className="mb-3">
          <CategoryBadge category={cat} linkable={false} />
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold text-[#0A0A0A] mb-2 tracking-tight">
          {label}
        </h1>
        <p className="text-[#525252]">
          {articles.length} article{articles.length !== 1 ? "s" : ""} on{" "}
          {label.toLowerCase()}.
        </p>
      </div>

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
  );
}
