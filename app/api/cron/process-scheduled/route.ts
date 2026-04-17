import { NextRequest, NextResponse } from "next/server";
import { processExpiredScheduled } from "@/lib/scheduler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "cron_not_configured" },
      { status: 503 },
    );
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const published = await processExpiredScheduled();
  return NextResponse.json({ ok: true, published }, { status: 200 });
}
