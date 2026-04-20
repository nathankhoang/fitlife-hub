// Thin Resend-backed notifier for social-pipeline failure emails.
// Only sends when RESEND_API_KEY and SOCIAL_NOTIFY_EMAIL are set;
// otherwise it no-ops so the pipeline still runs in local/dev envs.

import { Resend } from "resend";
import type { SocialPostEntry } from "./types";
import { STRATEGIES } from "./strategies";
import { brand } from "@/lib/brand";
import { SITE_URL } from "@/lib/site";

export async function notifyGenerationFailure(entry: SocialPostEntry): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.SOCIAL_NOTIFY_EMAIL;
  if (!apiKey || !to) return;

  const resend = new Resend(apiKey);
  const platformLabel = STRATEGIES[entry.platform].label;
  const from = `${brand.name} Alerts <${brand.contact.email}>`;
  const subjectTag = brand.shortName || brand.name.slice(0, 3).toUpperCase();
  const subject = `[${subjectTag}] Social post failed: ${entry.articleSlug} (${platformLabel})`;
  const lines = [
    `Platform:    ${platformLabel}`,
    `Article:     ${entry.articleSlug}`,
    `Title:       ${entry.articleTitle}`,
    `Attempts:    ${entry.attempts} / 3`,
    `Last error:  ${entry.lastError ?? "(none)"}`,
    ``,
    `Entry ID:    ${entry.id}`,
    ``,
    `Review at ${SITE_URL}/admin/social-queue`,
  ];
  try {
    await resend.emails.send({ from, to, subject, text: lines.join("\n") });
  } catch (err) {
    // Never let a notify failure escape the worker path.
    console.error("[social/notify] failed to send:", err);
  }
}
