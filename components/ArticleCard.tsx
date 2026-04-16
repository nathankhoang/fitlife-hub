import Link from "next/link";
import { type Article, formatDate } from "@/lib/articles";
import CategoryBadge from "./CategoryBadge";

type Props = {
  article: Article;
  featured?: boolean;
};

export default function ArticleCard({ article, featured = false }: Props) {
  return (
    <article
      className={`bg-white rounded-xl border border-[#E5E7EB] overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col ${
        featured ? "ring-2 ring-[#16A34A]/20" : ""
      }`}
    >
      <div className="bg-gradient-to-br from-[#F8FAFC] to-[#DCFCE7] aspect-video flex items-center justify-center px-6">
        <span className="text-5xl">{getCategoryEmoji(article.category)}</span>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="mb-2">
          <CategoryBadge category={article.category} />
        </div>

        <Link href={`/blog/${article.slug}`} className="group flex-1">
          <h2 className="text-[#111827] font-bold text-lg leading-snug group-hover:text-[#16A34A] transition-colors mb-2">
            {article.title}
          </h2>
          <p className="text-[#6B7280] text-sm leading-relaxed line-clamp-2">
            {article.description}
          </p>
        </Link>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#F3F4F6]">
          <span className="text-xs text-[#9CA3AF]">{formatDate(article.date)}</span>
          <span className="text-xs text-[#9CA3AF]">{article.readTime} min read</span>
        </div>
      </div>
    </article>
  );
}

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    "home-workouts": "🏋️",
    supplements: "💊",
    "diet-nutrition": "🥗",
    "weight-loss": "⚖️",
    "muscle-building": "💪",
    wellness: "🧘",
  };
  return map[category] ?? "🏃";
}
