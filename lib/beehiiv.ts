import { brand } from "@/lib/brand";

// Per-client publication — read from env at runtime. The legacy literal is
// kept as a fallback so LeanBodyEngine (the flagship) keeps working without
// setting the env var; new client deployments MUST set BEEHIIV_PUBLICATION_ID
// or every client's newsletter will land in LBE's publication.
const LEGACY_LBE_PUBLICATION_ID = "pub_bf0910d1-3e8b-4501-9fec-9547eacc1849";
const PUBLICATION_ID =
  process.env.BEEHIIV_PUBLICATION_ID || LEGACY_LBE_PUBLICATION_ID;
const BASE = "https://api.beehiiv.com/v2";

function apiKey(): string | undefined {
  return process.env.BEEHIIV_API_KEY;
}

function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey()}`,
    "Content-Type": "application/json",
  };
}

export type PublicationStats = {
  activeSubscribers: number;
  averageOpenRate: number;
  averageClickRate: number;
};

export async function getPublicationStats(): Promise<PublicationStats | null> {
  if (!apiKey()) return null;
  try {
    const res = await fetch(
      `${BASE}/publications/${PUBLICATION_ID}?expand=stats`,
      { headers: authHeaders(), cache: "no-store" },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: {
        stats?: {
          active_subscriptions?: number;
          average_open_rate?: number;
          average_click_rate?: number;
        };
      };
    };
    const stats = json.data?.stats;
    if (!stats) return null;
    return {
      activeSubscribers: stats.active_subscriptions ?? 0,
      averageOpenRate: Math.round((stats.average_open_rate ?? 0) * 100),
      averageClickRate: Math.round((stats.average_click_rate ?? 0) * 100),
    };
  } catch {
    return null;
  }
}

export type Subscriber = {
  id: string;
  email: string;
  status: string;
  created: number | string;
};

export type SubscriberPage = {
  subscribers: Subscriber[];
  cursor: string | null;
  hasMore: boolean;
};

export async function listSubscribers(cursor?: string): Promise<SubscriberPage> {
  if (!apiKey()) return { subscribers: [], cursor: null, hasMore: false };
  try {
    const params = new URLSearchParams({ limit: "50", status: "active" });
    if (cursor) params.set("cursor", cursor);
    const res = await fetch(
      `${BASE}/publications/${PUBLICATION_ID}/subscriptions?${params}`,
      { headers: authHeaders(), cache: "no-store" },
    );
    if (!res.ok) return { subscribers: [], cursor: null, hasMore: false };
    const json = (await res.json()) as {
      data?: Array<{ id: string; email: string; status: string; created: number | string }>;
      pagination?: { cursor?: string; has_more?: boolean };
    };
    return {
      subscribers: (json.data ?? []).map((s) => ({
        id: s.id,
        email: s.email,
        status: s.status,
        created: s.created,
      })),
      cursor: json.pagination?.cursor ?? null,
      hasMore: json.pagination?.has_more ?? false,
    };
  } catch {
    return { subscribers: [], cursor: null, hasMore: false };
  }
}

export async function createBroadcast(opts: {
  title: string;
  description: string;
  slug: string;
  siteUrl: string;
}): Promise<string | null> {
  if (!apiKey()) return null;
  try {
    const articleUrl = `${opts.siteUrl}/blog/${opts.slug}`;
    const bodyContent = [
      `<p style="font-size:16px;line-height:1.6;color:#374151;">${opts.description}</p>`,
      `<p style="margin-top:24px;">`,
      `<a href="${articleUrl}" style="background:${brand.theme.primaryColor};color:#ffffff;padding:12px 24px;`,
      `border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">`,
      `Read the full article →</a></p>`,
    ].join("");

    const res = await fetch(`${BASE}/publications/${PUBLICATION_ID}/posts`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        title: opts.title,
        body_content: bodyContent,
        status: "confirmed",
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[beehiiv] createBroadcast error ${res.status}: ${text}`);
      return null;
    }
    const json = (await res.json()) as { data?: { id: string } };
    return json.data?.id ?? null;
  } catch (err) {
    console.error("[beehiiv] createBroadcast exception:", err);
    return null;
  }
}
