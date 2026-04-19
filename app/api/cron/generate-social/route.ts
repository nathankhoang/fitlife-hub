import { NextRequest, NextResponse } from "next/server";
import { processSocialQueue } from "@/lib/social/worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

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

  const batchParam = req.nextUrl.searchParams.get("batch");
  const batch = batchParam ? Math.max(1, Math.min(50, Number(batchParam))) : undefined;

  const result = await processSocialQueue({ batch });
  return NextResponse.json({ ok: true, ...result }, { status: 200 });
}
