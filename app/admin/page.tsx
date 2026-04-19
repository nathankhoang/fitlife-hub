import { getQueue, QueueEntry } from "@/lib/queue";
import { categoryLabels } from "@/lib/articles";
import Link from "next/link";
import CreatePostConfig from "./_components/CreatePostConfig";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "G-NQQ4L0X60E";
const GA_PROPERTY_ID = process.env.GA_PROPERTY_ID ?? "";

function readState() {
  try {
    const p = path.join(process.cwd(), "data", "telemetry", "state.json");
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function StatCard({ label, value, accent }: { label: string; value: number | string; accent: string }) {
  return (
    <div className={`bg-white/5 border ${accent} rounded-xl p-5`}>
      <div className="text-white/40 text-xs font-medium uppercase tracking-wide mb-1">{label}</div>
      <div className="text-white text-3xl font-bold">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: QueueEntry["status"] }) {
  const styles = {
    draft: "bg-white/10 text-white/50",
    scheduled: "bg-blue-500/20 text-blue-300",
    published: "bg-green-500/20 text-green-300",
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${styles[status]}`}>
      {status}
    </span>
  );
}

function ArticleRow({ entry }: { entry: QueueEntry }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-white/5 hover:bg-white/2 transition-colors">
      <StatusBadge status={entry.status} />
      <div className="flex-1 min-w-0">
        <div className="text-white text-sm font-medium truncate">{entry.title}</div>
        <div className="text-white/40 text-xs mt-0.5">{categoryLabels[entry.category]} · {entry.readTime} min</div>
      </div>
      <div className="text-white/30 text-xs shrink-0">
        {entry.publishedDate
          ? new Date(entry.publishedDate).toLocaleDateString()
          : entry.scheduledDate
          ? `Scheduled ${new Date(entry.scheduledDate).toLocaleDateString()}`
          : new Date(entry.createdAt).toLocaleDateString()}
      </div>
      {entry.status === "published" && (
        <Link href={`/blog/${entry.slug}`} target="_blank" className="text-xs text-[#059669] hover:underline shrink-0">
          View →
        </Link>
      )}
    </div>
  );
}

export default async function AdminPage() {
  const queue = await getQueue();
  const state = readState();

  const drafts = queue.filter((e) => e.status === "draft");
  const scheduled = queue.filter((e) => e.status === "scheduled");
  const published = queue.filter((e) => e.status === "published");
  const recentPublished = published.slice(-10).reverse();

  return (
    <div className="space-y-12 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
        <p className="text-white/40 text-sm">LeanBodyEngine admin panel</p>
      </div>

      {/* ── Overview ── */}
      <section id="overview">
        <h2 className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-4">Overview</h2>
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total articles" value={queue.length} accent="border-white/10" />
          <StatCard label="Published" value={published.length} accent="border-green-500/20" />
          <StatCard label="Scheduled" value={scheduled.length} accent="border-blue-500/20" />
          <StatCard label="Drafts" value={drafts.length} accent="border-white/10" />
        </div>
      </section>

      {/* ── Article Queue ── */}
      <section id="articles">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white/60 text-xs font-semibold uppercase tracking-widest">Article Queue</h2>
          <Link href="/admin/queue" className="text-xs text-[#059669] hover:underline">
            Full kanban view →
          </Link>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          {/* Tabs summary */}
          <div className="grid grid-cols-3 border-b border-white/10">
            {[
              { label: "Drafts", count: drafts.length, color: "text-white/60" },
              { label: "Scheduled", count: scheduled.length, color: "text-blue-300" },
              { label: "Published", count: published.length, color: "text-green-300" },
            ].map((tab) => (
              <div key={tab.label} className="px-5 py-3 border-r border-white/10 last:border-r-0">
                <div className={`text-xl font-bold ${tab.color}`}>{tab.count}</div>
                <div className="text-white/40 text-xs">{tab.label}</div>
              </div>
            ))}
          </div>

          {/* Recent rows */}
          <div className="px-5 py-1">
            {queue.length === 0 ? (
              <p className="text-white/30 text-sm py-8 text-center">No articles in queue yet.</p>
            ) : (
              [...scheduled, ...recentPublished, ...drafts.slice(0, 5)].map((entry) => (
                <ArticleRow key={entry.id} entry={entry} />
              ))
            )}
          </div>

          {queue.length > 15 && (
            <div className="px-5 py-3 border-t border-white/10">
              <Link href="/admin/queue" className="text-xs text-white/40 hover:text-white/60">
                + {queue.length - 15} more articles — view all in kanban →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Social Queue ── */}
      <section id="social">
        <h2 className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-4">Social Media Queue</h2>
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-lg">📱</span>
          </div>
          <h3 className="text-white font-semibold mb-1">Social posting not yet configured</h3>
          <p className="text-white/40 text-sm max-w-sm mx-auto">
            The social media autoposting feature is in development. Once wired up, scheduled posts for
            Instagram, Twitter/X, and Facebook will appear here.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-xs text-white/30 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
            feat/social-autoposting — in progress
          </div>
        </div>
      </section>

      {/* ── Analytics ── */}
      <section id="analytics">
        <h2 className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-4">Analytics</h2>
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#F9AB00]/10 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#F9AB00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div className="text-white text-sm font-semibold">Google Analytics 4</div>
                <div className="text-white/40 text-xs font-mono">{GA_ID}</div>
              </div>
            </div>
            <a
              href={`https://analytics.google.com/analytics/web/#/p${GA_PROPERTY_ID || "YOUR_PROPERTY_ID"}/reports/reportinghub`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-[#F9AB00]/10 hover:bg-[#F9AB00]/20 text-[#F9AB00] border border-[#F9AB00]/20 px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              Open GA4 →
            </a>
          </div>

          {/* Placeholder metric cards */}
          <div className="grid grid-cols-4 divide-x divide-white/10">
            {[
              { label: "Users (7d)", value: "—" },
              { label: "Sessions (7d)", value: "—" },
              { label: "Pageviews (7d)", value: "—" },
              { label: "Avg. engagement", value: "—" },
            ].map((m) => (
              <div key={m.label} className="px-5 py-4 text-center">
                <div className="text-white/20 text-2xl font-bold mb-0.5">{m.value}</div>
                <div className="text-white/40 text-xs">{m.label}</div>
              </div>
            ))}
          </div>

          <div className="px-5 py-3 border-t border-white/10 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
            <span className="text-white/30 text-xs">
              GA4 tracking active on all pages. To show inline metrics, connect the{" "}
              <a href="https://developers.google.com/analytics/devguides/reporting/data/v1" target="_blank" className="text-white/50 underline">GA4 Data API</a>{" "}
              with a service account and set <code className="bg-white/5 px-1 rounded">GA_SERVICE_ACCOUNT_KEY</code>.
            </span>
          </div>
        </div>
      </section>

      {/* ── CRM ── */}
      <section id="crm">
        <h2 className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-4">CRM — Email Subscribers</h2>
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-lg">✉️</span>
          </div>
          <h3 className="text-white font-semibold mb-1">CRM not yet connected</h3>
          <p className="text-white/40 text-sm max-w-sm mx-auto">
            Connect your CRM provider to view subscriber counts, segments, and campaign performance here.
          </p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <div className="text-xs text-white/30 border border-dashed border-white/20 rounded-lg px-4 py-2">
              Recommended: ConvertKit · Mailchimp · Klaviyo · Resend
            </div>
          </div>
        </div>
      </section>

      {/* ── Content Generation ── */}
      <section id="generate">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white/60 text-xs font-semibold uppercase tracking-widest">Content Generation</h2>
            <p className="text-white/30 text-xs mt-1">Configure the <code className="bg-white/5 px-1 rounded">/create-post</code> batch parameters, then copy the command into your Claude Code terminal.</p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <CreatePostConfig initialState={state} />
        </div>
      </section>
    </div>
  );
}
