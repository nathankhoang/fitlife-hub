import { getQueue, QueueEntry } from "@/lib/queue";
import { categoryLabels } from "@/lib/articles";
import { publishPost, deleteFromQueue } from "./actions";

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
          Scheduled: {new Date(entry.scheduledDate).toLocaleDateString()}
        </p>
      )}
      {entry.publishedDate && (
        <p className="text-xs text-gray-400">
          Published: {new Date(entry.publishedDate).toLocaleDateString()}
        </p>
      )}

      <div className="flex gap-2 pt-1">
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
        {entry.status === "published" && (
          <a
            href={`/blog/${entry.slug}`}
            target="_blank"
            className="text-xs text-primary underline"
          >
            View post →
          </a>
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

export default function AdminQueuePage() {
  const all = getQueue();
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

        <div className="flex gap-6 items-start">
          <Column title="Drafts" entries={drafts} accent="border-gray-400" />
          <Column title="Scheduled" entries={scheduled} accent="border-blue-400" />
          <Column title="Published" entries={published} accent="border-primary" />
        </div>
      </div>
    </div>
  );
}
