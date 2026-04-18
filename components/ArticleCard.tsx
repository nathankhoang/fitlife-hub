import Image from "next/image";
import Link from "next/link";
import { type Article, formatDate } from "@/lib/articles";
import CategoryBadge from "./CategoryBadge";

type Props = {
  article: Article;
  featured?: boolean;
};

export default function ArticleCard({ article, featured = false }: Props) {
  const thumb = article.image || `/images/categories/${article.category}.svg`;

  return (
    <article
      className={`bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden hover:border-[#A3A3A3] hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-all duration-200 flex flex-col ${
        featured ? "ring-1 ring-[#059669]/40" : ""
      }`}
    >
      <Link href={`/blog/${article.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-[#F5F5F5]">
        <Image
          src={thumb}
          alt={article.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 hover:scale-[1.02]"
        />
      </Link>

      <div className="p-5 flex flex-col flex-1">
        <div className="mb-3">
          <CategoryBadge category={article.category} />
        </div>

        <Link href={`/blog/${article.slug}`} className="group flex-1">
          <h2 className="text-[#0A0A0A] font-semibold text-lg leading-snug group-hover:text-[#059669] transition-colors mb-2 tracking-tight">
            {article.title}
          </h2>
          <p className="text-[#525252] text-sm leading-relaxed line-clamp-2">
            {article.description}
          </p>
        </Link>

        <div className="flex items-center justify-between mt-5 pt-4 border-t border-[#F5F5F5]">
          <span className="text-xs text-[#A3A3A3]">{formatDate(article.date)}</span>
          <span className="text-xs text-[#A3A3A3]">{article.readTime} min read</span>
        </div>
      </div>
    </article>
  );
}
