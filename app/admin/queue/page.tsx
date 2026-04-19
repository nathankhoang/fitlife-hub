import { Suspense } from "react";
import Link from "next/link";
import { getQueue, QueueEntry } from "@/lib/queue";
import { categoryLabels } from "@/lib/articles";
import { getPublicationStats, listSubscribers } from "@/lib/beehiiv";
import {
  publishPost,
  schedulePost,
  unschedulePost,
  deleteFromQueue,
  sendNewsletter,
} from "./actions";

export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: QueueEntry["status"] }) {
  const styles = {
    draft: "bg-gray-100 text-gray-700",
    scheduled: "bg-blue-100 text-blue-700",
    published: "bg-green-100 text-green-700",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function defaultScheduleValue(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function PostCard({ entry }: { entry: QueueEntry }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug">{entry.title}</h3>
        <StatusBadge status={entry.status} />
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
        <span className="bg-gray-50 border border-gray-200 rounded px-2 py-0.5">
          {categoryLabels[entry.category]}
        </span>
        <span>{entry.readTime} min read</span>
        <span>{entry.affiliateProductIds.length} affiliate products</span>
      </div>

      {entry.scheduledDate && (
        <p className="text-xs text-gray-400">
          Scheduled: {new Date(entry.scheduledDate).toLocaleString()}
        </p>
      )}
      {entry.publishedDate && (
        <p className="text-xs text-gray-400">
          Published: {new Date(entry.publishedDate).toLocaleString()}
        </p>
      )}

      <div className="flex flex-wrap gap-2 pt-1 items-center">
        <Link
          href={`/admin/queue/${entry.slug}/preview`}
          target="_blank"
          className="text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md font-medium"
        >
          Preview →
        </Link>

        {entry.status !== "published" && (
          <form action={publishPost.bind(null, entry.slug)}>
            <button
              type="submit"
              className="text-xs bg-primary text-white px-3 py-1.5 rounded-md hover:opacity-90 font-medium"
            >
              Publish Now
            </button>
          </form>
        )}

        {entry.status === "scheduled" && (
          <form action={unschedulePost.bind(null, entry.slug)}>
            <button
              type="submit"
              className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1.5"
            >
              Unschedule
            </button>
          </form>
        )}

        {entry.status === "published" && (
          <a
            href={`/blog/${entry.slug}`}
            target="_blank"
            className="text-xs text-primary underline"
          >
            View post →
          </a>
        )}

        {entry.status === "published" && (
          entry.broadcastId ? (
            <span className="text-xs text-purple-600 font-medium">✓ Newsletter sent</span>
          ) : (
            <form action={sendNewsletter.bind(null, entry.slug)}>
              <button
                type="submit"
                className="text-xs text-purple-600 hover:text-purple-800 border border-purple-200 px-3 py-1.5 rounded-md"
              >
                Send newsletter
              </button>
            </form>
          )
        )}

        <form action={deleteFromQueue.bind(null, entry.slug)}>
          <button
            type="submit"
            className="text-xs text-red-500 hover:text-red-700 px-2 py-1.5"
          >
            Remove
          </button>
        </form>
      </div>

      {entry.status === "draft" && (
        <details className="text-xs">
          <summary className="cursor-pointer text-blue-600 hover:underline select-none">
            Schedule for later
          </summary>
          <form
            action={schedulePost.bind(null, entry.slug)}
            className="mt-2 flex flex-wrap gap-2 items-center"
          >
            <input
              type="datetime-local"
              name="scheduledDate"
              required
              defaultValue={defaultScheduleValue()}
              className="text-xs border border-gray-300 rounded px-2 py-1"
            />
            <button
              type="submit"
              className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-md hover:bg-blue-600 font-medium"
            >
              Schedule
            </button>
          </form>
        </details>
      )}
    </div>
  );
}

function Column({
  title,
  entries,
  accent,
}: {
  title: string;
  entries: QueueEntry[];
  accent: string;
}) {
  return (
    <div className="flex-1 min-w-0">
      <div className={`flex items-center gap-2 mb-4 pb-2 border-b-2 ${accent}`}>
        <h2 className="font-bold text-gray-800">{title}</h2>
        <span className="text-sm text-gray-500 font-normal">({entries.length})</span>
      </div>
      <div className="space-y-3">
        {entries.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No posts here</p>
        ) : (
          entries.map((e) => <PostCard key={e.id} entry={e} />)
        )}
      </div>
    </div>
  );
}

async function BeehiivStats() {
  const stats = await getPublicationStats();
  if (!stats) return null;

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {[
        { label: "Active Subscribers", value: stats.activeSubscribers.toLocaleString() },
        { label: "Avg. Open Rate", value: `${stats.averageOpenRate}%` },
        { label: "Avg. Click Rate", value: `${stats.averageClickRate}%` },
      ].map(({ label, value }) => (
        <div key={label} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{label}</p>
        </div>
      ))}
    </div>
  );
}

function formatSubscriberDate(created: number | string): string {
  const d = typeof created === "number"
    ? new Date(created * 1000)
    : new Date(created);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

async function SubscriberList({ cursor }: { cursor?: string }) {
  const { subscribers, cursor: nextCursor, hasMore } = await listSubscribers(cursor);
  if (subscribers.length === 0) return null;

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Subscribers</h2>
        <span className="text-sm text-gray-500">{subscribers.length} shown</span>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-600">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {subscribers.map((sub) => (
              <tr key={sub.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 text-gray-800">{sub.email}</td>
                <td className="px-4 py-2.5">
                  <span className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                    {sub.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-gray-500">{formatSubscriberDate(sub.created)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && nextCursor && (
        <div className="mt-4 text-center">
          <Link
            href={`?cursor=${encodeURIComponent(nextCursor)}`}
            className="text-sm text-blue-600 hover:underline"
          >
            Load more →
          </Link>
        </div>
      )}
    </div>
  );
}

export default async function AdminQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const [all, params] = await Promise.all([getQueue(), searchParams]);
  const drafts = all.filter((e) => e.status === "draft");
  const scheduled = all.filter((e) => e.status === "scheduled");
  const published = all.filter((e) => e.status === "published");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Post Queue</h1>
          <p className="text-gray-500 mt-1">
            {all.length} total posts · {drafts.length} drafts · {scheduled.length} scheduled ·{" "}
            {published.length} published
          </p>
        </div>

        <Suspense fallback={<div className="h-24 mb-8" />}>
          <BeehiivStats />
        </Suspense>

        <div className="flex gap-6 items-start">
          <Column title="Drafts" entries={drafts} accent="border-gray-400" />
          <Column title="Scheduled" entries={scheduled} accent="border-blue-400" />
          <Column title="Published" entries={published} accent="border-primary" />
        </div>

        <Suspense fallback={<p className="mt-12 text-sm text-gray-400">Loading subscribers…</p>}>
          <SubscriberList cursor={params.cursor} />
        </Suspense>
      </div>
    </div>
  );
}
