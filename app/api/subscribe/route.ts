import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Kept in sync with lib/beehiiv.ts. New clients set BEEHIIV_PUBLICATION_ID in
// Vercel env; flagship falls through to the hardcoded LBE publication.
const LEGACY_LBE_PUBLICATION_ID = "pub_bf0910d1-3e8b-4501-9fec-9547eacc1849";
const PUBLICATION_ID =
  process.env.BEEHIIV_PUBLICATION_ID || LEGACY_LBE_PUBLICATION_ID;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const { email, hp } = (body ?? {}) as { email?: unknown; hp?: unknown };

  // Honeypot: silently 200 if a bot filled the hidden field
  if (typeof hp === "string" && hp.length > 0) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }

  const apiKey = process.env.BEEHIIV_API_KEY;
  if (!apiKey) {
    console.warn("[subscribe] BEEHIIV_API_KEY not set");
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  const res = await fetch(
    `https://api.beehiiv.com/v2/publications/${PUBLICATION_ID}/subscriptions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        reactivate_existing: true,
        send_welcome_email: true,
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[subscribe] beehiiv error ${res.status}: ${text}`);
    return NextResponse.json({ ok: false, error: "provider_error" }, { status: 502 });
  }

  const data = (await res.json()) as { data?: { status?: string } };
  const alreadySubscribed = data?.data?.status === "active";

  console.log(`[subscribe] subscribed: ${email}`);
  return NextResponse.json({ ok: true, alreadySubscribed }, { status: 200 });
}
