/**
 * Monthly performance report — runs once a month via cron, emails the
 * operator (and optionally the client) a snapshot of how the site did:
 * articles published, newsletter growth, top content.
 *
 * V1 scope is deliberately narrow: subscriber stats come from Beehiiv,
 * publish activity comes from the queue. GA4 traffic is NOT included —
 * that requires per-site OAuth which is genuinely human-gated.
 * Add a GA4 pull here later when the operator's ready to set up the
 * Google Analytics Data API service account.
 */

import { Resend } from "resend";
import { getQueue } from "@/lib/queue";
import { getPublicationStats } from "@/lib/beehiiv";
import { brand } from "@/lib/brand";
import { SITE_URL } from "@/lib/site";

export type MonthlyReport = {
  /** ISO month in "YYYY-MM" form — the month being reported on. */
  month: string;
  /** Human label for the month, e.g. "March 2026". */
  monthLabel: string;
  articlesPublished: number;
  topArticles: Array<{ slug: string; title: string; publishedDate: string }>;
  subscribers: number | null;
  averageOpenRate: number | null;
  averageClickRate: number | null;
};

/** Build the report payload for the calendar month that ended most recently. */
export async function buildMonthlyReport(): Promise<MonthlyReport> {
  const now = new Date();
  // Report covers the calendar month that just ended. When the cron fires
  // on the 1st of April at 12:00 UTC, this resolves to March 2026.
  const target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const year = target.getUTCFullYear();
  const monthIdx = target.getUTCMonth();
  const monthStart = Date.UTC(year, monthIdx, 1);
  const monthEnd = Date.UTC(year, monthIdx + 1, 1);

  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(target);
  const month = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;

  const queue = await getQueue();
  const inMonth = queue.filter((e) => {
    if (!e.publishedDate) return false;
    const t = new Date(e.publishedDate).getTime();
    return t >= monthStart && t < monthEnd;
  });

  const topArticles = inMonth
    .sort(
      (a, b) =>
        new Date(b.publishedDate!).getTime() - new Date(a.publishedDate!).getTime(),
    )
    .slice(0, 5)
    .map((e) => ({
      slug: e.slug,
      title: e.title,
      publishedDate: e.publishedDate!,
    }));

  const stats = await getPublicationStats();

  return {
    month,
    monthLabel,
    articlesPublished: inMonth.length,
    topArticles,
    subscribers: stats?.activeSubscribers ?? null,
    averageOpenRate: stats?.averageOpenRate ?? null,
    averageClickRate: stats?.averageClickRate ?? null,
  };
}

/** Format the report as an HTML email body. */
export function renderReportHtml(r: MonthlyReport): string {
  const primary = brand.theme.primaryColor;
  const rows = r.topArticles
    .map(
      (a) =>
        `<li style="margin-bottom:8px"><a href="${SITE_URL}/blog/${a.slug}" style="color:${primary};text-decoration:none;font-weight:600">${escapeHtml(a.title)}</a></li>`,
    )
    .join("");

  const statsBlock = [
    metric(
      "Subscribers",
      r.subscribers === null ? "—" : r.subscribers.toLocaleString(),
    ),
    metric(
      "Avg open rate",
      r.averageOpenRate === null ? "—" : `${r.averageOpenRate}%`,
    ),
    metric(
      "Avg click rate",
      r.averageClickRate === null ? "—" : `${r.averageClickRate}%`,
    ),
    metric("Articles this month", String(r.articlesPublished)),
  ].join("");

  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:32px 24px">
  <h1 style="font-size:22px;margin:0 0 4px;color:#0a0a0a">${escapeHtml(brand.name)} — ${r.monthLabel} Report</h1>
  <p style="color:#666;font-size:14px;margin:0 0 24px">How the site performed last month.</p>

  <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:28px">${statsBlock}</div>

  <h2 style="font-size:15px;margin:0 0 10px;color:#0a0a0a">Articles published this month</h2>
  ${r.topArticles.length === 0
    ? '<p style="font-size:14px;color:#666">No articles published last month.</p>'
    : `<ul style="padding-left:18px;margin:0 0 24px;font-size:14px">${rows}</ul>`}

  <p style="font-size:12px;color:#888;margin-top:32px;border-top:1px solid #eee;padding-top:16px">
    This report ran on the 1st of the month via scheduled job.
    Dashboard: <a href="${SITE_URL}/admin" style="color:${primary}">${SITE_URL}/admin</a>
  </p>
</div>`.trim();
}

function metric(label: string, value: string): string {
  return `<div style="flex:1 1 140px;min-width:140px;background:#f6f8fa;border-radius:10px;padding:16px">
    <div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.05em;font-weight:600">${label}</div>
    <div style="font-size:22px;font-weight:800;margin-top:4px;color:#0a0a0a">${value}</div>
  </div>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Send the report by email. Returns true on success, false on skip or failure. */
export async function sendMonthlyReport(r: MonthlyReport): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.REPORT_RECIPIENT || brand.contact.email;
  if (!apiKey || !to) return false;

  const resend = new Resend(apiKey);
  const from = `${brand.name} <${brand.contact.email}>`;
  const subject = `${brand.name} — ${r.monthLabel} report`;
  try {
    await resend.emails.send({
      from,
      to,
      subject,
      html: renderReportHtml(r),
    });
    return true;
  } catch (err) {
    console.error("[monthly-report] failed to send:", err);
    return false;
  }
}
