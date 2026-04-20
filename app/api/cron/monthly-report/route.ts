import { NextRequest, NextResponse } from "next/server";
import {
  buildMonthlyReport,
  sendMonthlyReport,
} from "@/lib/report/monthly-report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Runs 1st of each month (12:00 UTC) via Vercel cron. Builds the
 * previous-month performance report and emails it to REPORT_RECIPIENT
 * (or brand.contact.email as a fallback).
 */
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
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  const report = await buildMonthlyReport();
  const sent = await sendMonthlyReport(report);

  return NextResponse.json(
    { ok: true, sent, month: report.month, articlesPublished: report.articlesPublished },
    { status: 200 },
  );
}
