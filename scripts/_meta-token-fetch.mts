// Takes a short-lived Facebook user access token (from Graph API Explorer)
// and derives everything we need for Phase 5:
//   - Long-lived user token (~60 days)
//   - Page ID + Page Access Token for leanbodyengine (effectively non-expiring)
//   - IG User ID linked to the Page
//
// Run: npx tsx scripts/_meta-token-fetch.mts <short-lived-user-token>

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.loadEnvFile(path.join(ROOT, ".env.local"));

const GRAPH = "https://graph.facebook.com/v21.0";
const shortLived = process.argv[2];
if (!shortLived) {
  console.error("usage: npx tsx scripts/_meta-token-fetch.mts <short-lived-user-token>");
  process.exit(1);
}

const appId = process.env.META_APP_ID;
const appSecret = process.env.META_APP_SECRET;
if (!appId || !appSecret) {
  console.error("META_APP_ID and META_APP_SECRET must be set in .env.local");
  process.exit(1);
}

const PAGE_NAME = "leanbodyengine";

type Json = Record<string, unknown>;

async function get(url: string): Promise<Json> {
  const res = await fetch(url);
  const json = (await res.json()) as Json;
  if (!res.ok) throw new Error(JSON.stringify(json, null, 2));
  return json;
}

console.log("[1/3] exchanging short-lived → long-lived user token…");
const exch = await get(
  `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${encodeURIComponent(shortLived)}`,
);
const longLivedUser = exch.access_token as string;
console.log(`    long-lived user token (${(exch.expires_in as number) ?? "?"}s): ${longLivedUser.slice(0, 20)}…`);

console.log("[2/3] finding Page ID + Page Access Token…");
const pages = (await get(`${GRAPH}/me/accounts?access_token=${encodeURIComponent(longLivedUser)}`)) as { data: Array<{ id: string; name: string; access_token: string }> };
const page = pages.data.find((p) => p.name.toLowerCase().replace(/\s+/g, "") === PAGE_NAME);
if (!page) {
  console.error(`Could not find Page matching name "${PAGE_NAME}" in your list. Pages available:`);
  for (const p of pages.data) console.error(`  - ${p.name} (id=${p.id})`);
  process.exit(1);
}
console.log(`    FB_PAGE_ID               = ${page.id}`);
console.log(`    META_PAGE_ACCESS_TOKEN   = ${page.access_token.slice(0, 20)}…`);

console.log("[3/3] resolving IG Business account linked to Page…");
const ig = (await get(
  `${GRAPH}/${page.id}?fields=instagram_business_account&access_token=${encodeURIComponent(page.access_token)}`,
)) as { instagram_business_account?: { id: string } };
const igUserId = ig.instagram_business_account?.id ?? null;
if (igUserId) {
  console.log(`    IG_USER_ID               = ${igUserId}`);
} else {
  console.log("    IG_USER_ID               = (none — IG not linked to this Page yet)");
}

console.log("\n===== Vercel env values =====");
console.log(`FB_PAGE_ID=${page.id}`);
console.log(`META_PAGE_ACCESS_TOKEN=${page.access_token}`);
if (igUserId) console.log(`IG_USER_ID=${igUserId}`);
else console.log("# IG_USER_ID (skip — link IG in mobile app first)");
