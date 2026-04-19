// Backfill the correct permalink_url for any already-posted entries whose URL
// was constructed the wrong way. Queries Meta for each post's real permalink.

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.loadEnvFile(path.join(ROOT, ".env.local"));

const { getSocialQueue, updateSocialEntry } = await import("../lib/social/queue.ts");

const token = process.env.META_PAGE_ACCESS_TOKEN;
if (!token) { console.error("META_PAGE_ACCESS_TOKEN missing"); process.exit(1); }

for (const entry of await getSocialQueue()) {
  if (entry.status !== "posted" || entry.platform !== "facebook" || !entry.platformPostId) continue;
  const res = await fetch(`https://graph.facebook.com/v21.0/${entry.platformPostId}?fields=permalink_url&access_token=${encodeURIComponent(token)}`);
  const json = (await res.json()) as { permalink_url?: string; error?: { message: string } };
  if (json.permalink_url && json.permalink_url !== entry.platformPostUrl) {
    await updateSocialEntry(entry.id, { platformPostUrl: json.permalink_url });
    console.log(`${entry.platform} ${entry.platformPostId} → ${json.permalink_url}`);
  } else if (json.error) {
    console.log(`${entry.platformPostId}: ${json.error.message}`);
  } else {
    console.log(`${entry.platformPostId}: unchanged`);
  }
}
