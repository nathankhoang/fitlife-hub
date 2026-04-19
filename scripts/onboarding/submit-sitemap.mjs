#!/usr/bin/env node
/**
 * submit-sitemap.mjs
 *
 * Post-deploy: pings search engines with the site's sitemap URL so their
 * crawlers know about it without waiting for organic discovery.
 *
 * What it does:
 *   1. Reads _operator.domain from client.config.json
 *   2. Verifies https://<domain>/sitemap.xml resolves (else bails early)
 *   3. Pings Bing via their legacy ping endpoint — still supported in 2026
 *   4. Submits to Bing Webmaster if BING_WEBMASTER_API_KEY is exported
 *   5. Prints the Google Search Console manual submission URL + steps
 *      (Google deprecated their sitemap ping in 2023; GSC API requires
 *      per-site OAuth verification, which has to be done by the operator
 *      once per site)
 *   6. Submits to IndexNow (Bing + Yandex) if INDEXNOW_KEY is exported —
 *      the operator needs to publish the key file at /{key}.txt first
 *
 * Usage:
 *   node scripts/onboarding/submit-sitemap.mjs              # default
 *   node scripts/onboarding/submit-sitemap.mjs --dry-run    # don't POST anywhere
 *
 * Preconditions:
 *   - Site is deployed and reachable at https://<domain>
 *   - (Optional) BING_WEBMASTER_API_KEY exported — from Bing Webmaster
 *     Tools → Settings → API Access. Without it, the script still hits
 *     the public ping endpoint.
 */

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const root = path.resolve(
  path.dirname(url.fileURLToPath(import.meta.url)),
  "..",
  "..",
);
const CONFIG_PATH = path.join(root, "client.config.json");
const DRY = process.argv.includes("--dry-run");

function fail(msg) {
  console.error(`\u2717 ${msg}`);
  process.exit(1);
}
function ok(msg) {
  console.log(`\u2713 ${msg}`);
}
function info(msg) {
  console.log(`  ${msg}`);
}

if (!fs.existsSync(CONFIG_PATH)) fail(`Missing ${CONFIG_PATH}`);
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));

const rawDomain = config?._operator?.domain?.trim();
if (!rawDomain) {
  fail(
    "client.config.json._operator.domain is empty — can't build a sitemap URL.",
  );
}
const siteUrl = rawDomain.startsWith("http")
  ? rawDomain.replace(/\/$/, "")
  : `https://${rawDomain.replace(/\/$/, "")}`;
const sitemapUrl = `${siteUrl}/sitemap.xml`;

console.log(`Sitemap: ${sitemapUrl}\n`);

// ---- 1. Reachability check ---------------------------------------------

async function checkReachable() {
  try {
    const res = await fetch(sitemapUrl, { redirect: "follow" });
    if (!res.ok) {
      fail(
        `Sitemap not reachable: HTTP ${res.status}. Is the site deployed? Has DNS propagated? Did you hit 'git push' yet?`,
      );
    }
    const ct = res.headers.get("content-type") || "";
    if (!/xml/i.test(ct)) {
      console.warn(
        `  ! sitemap content-type is '${ct}' — Bing/Google expect xml. Submission continues but flag this.`,
      );
    }
    ok(`sitemap.xml reachable (HTTP ${res.status})`);
  } catch (err) {
    fail(`Couldn't fetch ${sitemapUrl}: ${err.message}`);
  }
}

await checkReachable();

// ---- 2. Bing ping (legacy public endpoint — no auth) -------------------

console.log("\n── Bing (ping) ──");
const bingPingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
if (DRY) {
  info(`GET ${bingPingUrl}`);
} else {
  try {
    const res = await fetch(bingPingUrl, { redirect: "follow" });
    if (res.ok) ok(`pinged Bing (HTTP ${res.status})`);
    else console.warn(`  ! Bing ping returned HTTP ${res.status}`);
  } catch (err) {
    console.warn(`  ! Bing ping failed: ${err.message}`);
  }
}

// ---- 3. Bing Webmaster API (authoritative) -----------------------------

console.log("\n── Bing Webmaster API ──");
const bingKey = process.env.BING_WEBMASTER_API_KEY;
if (!bingKey) {
  info(
    "BING_WEBMASTER_API_KEY not set — skipping authoritative submission. Generate one at https://www.bing.com/webmasters → Settings → API Access, export it, and re-run.",
  );
} else {
  const endpoint = `https://ssl.bing.com/webmaster/api.svc/json/SubmitSiteMap?apikey=${encodeURIComponent(bingKey)}`;
  if (DRY) {
    info(`POST ${endpoint.replace(bingKey, "***")}`);
    info(`body: { siteUrl, feedUrl }`);
  } else {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ siteUrl, feedUrl: sitemapUrl }),
      });
      const body = await res.text();
      if (res.ok) {
        ok(`Bing Webmaster accepted (HTTP ${res.status})`);
      } else {
        console.warn(
          `  ! Bing Webmaster HTTP ${res.status}: ${body.slice(0, 200)}`,
        );
        if (res.status === 400 || res.status === 401) {
          console.warn(
            "    Common causes: site not verified in Bing Webmaster Tools yet, or API key scoped to another site.",
          );
        }
      }
    } catch (err) {
      console.warn(`  ! Bing Webmaster API call failed: ${err.message}`);
    }
  }
}

// ---- 4. IndexNow (Bing + Yandex, covers homepage + sitemap) ------------

console.log("\n── IndexNow ──");
const indexNowKey = process.env.INDEXNOW_KEY;
if (!indexNowKey) {
  info(
    "INDEXNOW_KEY not set — skipping. To enable: generate a key (uuid is fine), publish it at " +
      `${siteUrl}/<key>.txt, export as INDEXNOW_KEY, re-run.`,
  );
} else {
  const endpoint = "https://api.indexnow.org/indexnow";
  const payload = {
    host: new URL(siteUrl).host,
    key: indexNowKey,
    keyLocation: `${siteUrl}/${indexNowKey}.txt`,
    urlList: [siteUrl, sitemapUrl],
  };
  if (DRY) {
    info(`POST ${endpoint}`);
    info(`body: ${JSON.stringify(payload)}`);
  } else {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok || res.status === 202) {
        ok(`IndexNow accepted (HTTP ${res.status})`);
      } else {
        const body = await res.text();
        console.warn(
          `  ! IndexNow HTTP ${res.status}: ${body.slice(0, 200)}`,
        );
        if (res.status === 403) {
          console.warn(
            `    The key file at ${siteUrl}/${indexNowKey}.txt isn't reachable or doesn't contain the key.`,
          );
        }
      }
    } catch (err) {
      console.warn(`  ! IndexNow call failed: ${err.message}`);
    }
  }
}

// ---- 5. Google Search Console (manual) ---------------------------------

console.log("\n── Google Search Console (manual) ──");
console.log(
  "Google deprecated their sitemap ping endpoint in 2023. Programmatic submission now requires the Search Console API with per-property OAuth.",
);
console.log(
  "One-time setup (per site) — takes ~3 minutes the operator does once:",
);
info(`  1. https://search.google.com/search-console → Add property → '${siteUrl}'`);
info(
  "  2. Verify via DNS TXT record (Vercel → DNS) or HTML meta tag",
);
info(`  3. Sitemaps section → 'Add a new sitemap' → enter: sitemap.xml`);
info(
  "  4. Index coverage takes 1–3 days to populate — crawling starts within hours",
);

console.log("\nDone.");
