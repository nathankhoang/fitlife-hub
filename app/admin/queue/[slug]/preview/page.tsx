import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import {
  getArticleBySlug,
  getDraftBySlug,
  formatDate,
} from "@/lib/articles";
import { getQueue } from "@/lib/queue";
import CategoryBadge from "@/components/CategoryBadge";
import AffiliateProductCard from "@/components/AffiliateProductCard";

const mdxComponents = {
  AffiliateProductCard,
};

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export default async function PreviewPage({ params }: Props) {
  const { slug } = await params;

  const article = (await getDraftBySlug(slug)) ?? (await getArticleBySlug(slug));
  if (!article) notFound();

  const entry = (await getQueue()).find((e) => e.slug === slug);
  const status = entry?.status ?? "draft";

  return (
    <>
      <div className="sticky top-0 z-50 bg-yellow-100 border-b-2 border-yellow-400 px-4 py-2 text-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-yellow-900">PREVIEW</span>
          <span className="text-yellow-800">
            Status: <span className="font-semibold">{status}</span>
          </span>
          {entry?.scheduledDate && status === "scheduled" && (
            <span className="text-yellow-800">
              · Scheduled for {new Date(entry.scheduledDate).toLocaleString()}
            </span>
          )}
        </div>
        <Link
          href="/admin/queue"
          className="text-yellow-900 hover:underline font-medium"
        >
          ← Back to queue
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <div className="mb-3">
              <CategoryBadge category={article.category} linkable={false} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#111827] leading-tight mb-4">
              {article.title}
            </h1>
            <p className="text-lg text-[#6B7280] leading-relaxed mb-4">
              {article.description}
            </p>
            <div className="flex items-center gap-4 text-sm text-[#9CA3AF] border-t border-b border-[#F3F4F6] py-3">
              <span>{formatDate(article.date)}</span>
              <span>·</span>
              <span>{article.readTime} min read</span>
            </div>
          </div>

          <div className="prose max-w-none">
            <MDXRemote source={article.content} components={mdxComponents} />
          </div>
        </div>
      </div>
    </>
  );
}
