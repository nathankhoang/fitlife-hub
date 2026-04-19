import { getSocialQueue } from "@/lib/social/queue";
import type { SocialPostEntry } from "@/lib/social/types";
import { SocialPostCard } from "./_components/SocialPostCard";
import { approveAllForArticleAction } from "./actions";

export const dynamic = "force-dynamic";

type ArticleGroup = {
  articleSlug: string;
  articleTitle: string;
  entries: SocialPostEntry[];
};

function groupByArticle(entries: SocialPostEntry[]): ArticleGroup[] {
  const map = new Map<string, ArticleGroup>();
  for (const e of entries) {
    const g = map.get(e.articleSlug);
    if (g) g.entries.push(e);
    else
      map.set(e.articleSlug, {
        articleSlug: e.articleSlug,
        articleTitle: e.articleTitle,
        entries: [e],
      });
  }
  // Sort by most recent entry in the group.
  return [...map.values()].sort((a, b) => {
    const ta = Math.max(...a.entries.map((x) => new Date(x.updatedAt).getTime()));
    const tb = Math.max(...b.entries.map((x) => new Date(x.updatedAt).getTime()));
    return tb - ta;
  });
}

function statusCounts(entries: SocialPostEntry[]) {
  const init = {
    pending: 0,
    awaiting_approval: 0,
    approved: 0,
    posted: 0,
    failed: 0,
  };
  for (const e of entries) {
    if (e.status === "pending" || e.status === "generating") init.pending++;
    else if (e.status === "awaiting_approval") init.awaiting_approval++;
    else if (e.status === "approved" || e.status === "posting") init.approved++;
    else if (e.status === "posted") init.posted++;
    else if (e.status === "failed" || e.status === "expired") init.failed++;
  }
  return init;
}

export default async function SocialQueuePage() {
  const all = await getSocialQueue();
  const counts = statusCounts(all);
  const groups = groupByArticle(all);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Social Queue</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {all.length} total · {counts.pending} generating · {counts.awaiting_approval} awaiting approval · {counts.approved} approved · {counts.posted} posted · {counts.failed} failed/expired
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Approving a post publishes it immediately to the platform via the Meta Graph API.
          </p>
        </div>

        {groups.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
            <p className="text-gray-500">The social queue is empty.</p>
            <p className="text-xs text-gray-400 mt-2">
              Publish an article with <code>SOCIAL_AUTOPOST_ENABLED=true</code>, or hit <code>GET /api/cron/generate-social</code> with the cron secret to drain pending entries.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {groups.map((g) => {
              const hasAwaiting = g.entries.some((e) => e.status === "awaiting_approval");
              return (
                <section key={g.articleSlug}>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h2 className="font-semibold text-gray-900 text-lg leading-snug">
                        {g.articleTitle}
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        <a
                          href={`/blog/${g.articleSlug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline"
                        >
                          /blog/{g.articleSlug}
                        </a>
                      </p>
                    </div>
                    {hasAwaiting && (
                      <form action={approveAllForArticleAction.bind(null, g.articleSlug)}>
                        <button
                          type="submit"
                          className="text-xs bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 font-medium whitespace-nowrap"
                        >
                          ✓ Approve all ({g.entries.filter((e) => e.status === "awaiting_approval").length})
                        </button>
                      </form>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {g.entries
                      .sort((a, b) => a.platform.localeCompare(b.platform))
                      .map((e) => (
                        <SocialPostCard key={e.id} entry={e} />
                      ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
