import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// Force this route to run server-side at request time. State lives in Resend
// (HTTP API) — no local file mutations, so it's safe under any number of
// concurrent invocations including the parallel /create-post sub-agent loop.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!apiKey || !audienceId) {
    console.warn("[subscribe] RESEND_API_KEY or RESEND_AUDIENCE_ID missing");
    return NextResponse.json(
      { ok: false, error: "not_configured" },
      { status: 503 },
    );
  }

  const resend = new Resend(apiKey);
  const result = await resend.contacts.create({
    email: email.trim().toLowerCase(),
    audienceId,
    unsubscribed: false,
  });

  if (result.error) {
    const msg = (result.error.message ?? "").toLowerCase();
    // Resend returns 409-ish errors for duplicate contacts — treat as success
    if (msg.includes("already") || msg.includes("exists") || msg.includes("contact_already_exists")) {
      return NextResponse.json({ ok: true, alreadySubscribed: true }, { status: 200 });
    }
    console.error("[subscribe] resend error:", result.error);
    return NextResponse.json({ ok: false, error: "provider_error" }, { status: 502 });
  }

  console.log(`[subscribe] new contact: ${email}`);
  return NextResponse.json({ ok: true }, { status: 200 });
}
