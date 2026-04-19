#!/usr/bin/env node
/**
 * provision-client-infra.mjs
 *
 * Wraps `gh` + `vercel` CLIs to stand up a new client's infrastructure
 * from the values already captured in client.config.json. Idempotent
 * where the underlying CLI supports it — safe to re-run if a step
 * fails partway through.
 *
 * What it does (in order):
 *   1. Template-repo guard + CLI auth checks (gh, vercel)
 *   2. Creates the Vercel project   (vercel project add <slug>)
 *   3. Links this directory         (vercel link --yes --project <slug>)
 *   4. Connects the GitHub repo     (vercel git connect)
 *   5. Creates a Blob store, wired to all envs
 *                                   (vercel blob create-store -a public -y)
 *   6. Uploads a ping file to derive BLOB_PUBLIC_BASE, pushes the var
 *   7. Pushes scalar env vars       (NEXT_PUBLIC_SITE_URL, GA_ID,
 *                                    CRON_SECRET, ADMIN_PASSWORD,
 *                                    optionally RESEND_API_KEY)
 *   8. Attaches the custom domain   (vercel domains add <domain> <slug>)
 *   9. Prints DNS records the operator must set at their registrar
 *
 * What it intentionally does NOT do:
 *   - Create the GitHub repo (the operator forks the template before
 *     running /onboard-client; origin must already point at the client repo).
 *   - Update DNS at the registrar (always human).
 *   - Invite Vercel project members (Vercel REST API, out of scope here —
 *     added to the final checklist).
 *   - Push the code (Step 7 of /onboard-client is the explicit go-live gate).
 *
 * Usage:
 *   node scripts/onboarding/provision-client-infra.mjs            # dry-run preview
 *   node scripts/onboarding/provision-client-infra.mjs --apply    # execute
 *
 * Secrets:
 *   ADMIN_PASSWORD is generated (32 random hex chars) unless the operator
 *   exports ADMIN_PASSWORD before running.
 *   RESEND_API_KEY is pulled from the environment; if unset and the form
 *   said newsletter=yes, the script logs a reminder and skips it.
 */

import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import crypto from "node:crypto";
import { execSync, spawnSync } from "node:child_process";
import { assertNotTemplateRepo } from "../_template-guard.mjs";

const root = path.resolve(
  path.dirname(url.fileURLToPath(import.meta.url)),
  "..",
  "..",
);
const CONFIG_PATH = path.join(root, "client.config.json");

const APPLY =
  process.argv.includes("--apply") || process.argv.includes("--yes");

assertNotTemplateRepo({
  cwd: root,
  argv: process.argv,
  scriptName: "provision-client-infra",
});

// ---- Reporting helpers --------------------------------------------------

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
function section(title) {
  console.log(`\n\u2500\u2500 ${title} \u2500\u2500`);
}

// ---- Config -------------------------------------------------------------

if (!fs.existsSync(CONFIG_PATH)) fail(`Missing ${CONFIG_PATH}`);
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));

const brandName = config?.name?.trim();
if (!brandName) fail("client.config.json.name is empty");

const domain = config?._operator?.domain?.trim();
if (!domain) {
  fail(
    "client.config.json._operator.domain is empty — provisioning needs the production domain.",
  );
}

const ga4Id = config?._operator?.ga4Id?.trim() || "";
const newsletter = (config?._operator?.newsletter || "").toLowerCase();
const wantsNewsletter = newsletter.startsWith("yes");

// Derive a stable slug for the Vercel project + Blob store. Stays in
// client.config.json on re-runs so the same project/store are reused.
function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
const projectSlug =
  config?._operator?.vercelProjectSlug?.trim() || slugify(brandName);
if (!projectSlug) fail("Couldn't derive a Vercel project slug from brand name");

const siteUrl = domain.startsWith("http")
  ? domain.replace(/\/$/, "")
  : `https://${domain.replace(/\/$/, "")}`;

// ---- Plan ---------------------------------------------------------------

section("Plan");
info(`Project slug:  ${projectSlug}`);
info(`Domain:        ${domain}`);
info(`Site URL:      ${siteUrl}`);
info(`Blob store:    ${projectSlug}-blob (access=public, all envs)`);
info(`GA4:           ${ga4Id || "(not provided)"}`);
info(`Newsletter:    ${wantsNewsletter ? "yes (needs RESEND_API_KEY)" : "no"}`);

// ---- Preflight ----------------------------------------------------------

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: root,
    encoding: "utf8",
    stdio: opts.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    env: { ...process.env, ...(opts.env || {}) },
    shell: process.platform === "win32",
  });
  return r;
}

function runCapture(cmd, args, opts = {}) {
  return run(cmd, args, { ...opts, capture: true });
}

section("Preflight");

// origin remote
let originUrl;
try {
  originUrl = execSync("git remote get-url origin", { cwd: root })
    .toString()
    .trim();
} catch {
  fail("No git origin configured. Create the client repo first.");
}
info(`origin: ${originUrl}`);

// gh auth
{
  const r = runCapture("gh", ["auth", "status"]);
  if (r.status !== 0) {
    fail(
      "gh CLI not authenticated. Run `gh auth login`, then re-run this script.",
    );
  }
  ok("gh authenticated");
}

// vercel auth
let vercelUser = "";
{
  const r = runCapture("vercel", ["whoami"]);
  if (r.status !== 0) {
    fail(
      "vercel CLI not authenticated. Run `vercel login`, then re-run this script.",
    );
  }
  vercelUser = (r.stdout || "").trim().split(/\n/).pop();
  ok(`vercel authenticated as ${vercelUser}`);
}

if (!APPLY) {
  console.log(
    "\nDry-run only — re-run with --apply to execute.\n\nWith --apply the script will:",
  );
  console.log(`  1. vercel project add ${projectSlug}`);
  console.log(`  2. vercel link --yes --project ${projectSlug}`);
  console.log(`  3. vercel git connect  (binds to ${originUrl})`);
  console.log(
    `  4. vercel blob create-store ${projectSlug}-blob -a public -e production -e preview -e development -y`,
  );
  console.log(`  5. upload a ping file, capture BLOB_PUBLIC_BASE, push env`);
  console.log(
    `  6. vercel env add NEXT_PUBLIC_SITE_URL=${siteUrl}  (production+preview+development)`,
  );
  if (ga4Id) console.log(`  7. vercel env add NEXT_PUBLIC_GA_ID=${ga4Id}`);
  console.log(`  8. vercel env add CRON_SECRET=<generated>`);
  console.log(`  9. vercel env add ADMIN_PASSWORD=<generated-or-from-env>`);
  if (wantsNewsletter)
    console.log(
      `  10. vercel env add RESEND_API_KEY=<from RESEND_API_KEY env, or skip with a note>`,
    );
  console.log(`  11. vercel domains add ${domain} ${projectSlug}`);
  console.log(`  12. vercel domains inspect ${domain}   (prints DNS records)`);
  process.exit(0);
}

// ---- Apply --------------------------------------------------------------

function runOrFail(label, cmd, args) {
  console.log(`\n$ ${cmd} ${args.join(" ")}`);
  const r = run(cmd, args);
  if (r.status !== 0) {
    fail(`${label} failed (exit ${r.status}).`);
  }
  ok(label);
}

function runAllowFail(label, cmd, args) {
  console.log(`\n$ ${cmd} ${args.join(" ")}`);
  const r = run(cmd, args);
  return r.status === 0;
}

// 1. Create Vercel project (idempotent: if it already exists, proceed)
section("1. Vercel project");
const projectExists = runAllowFail("vercel project inspect", "vercel", [
  "project",
  "inspect",
  projectSlug,
]);
if (!projectExists) {
  runOrFail("vercel project add", "vercel", ["project", "add", projectSlug]);
} else {
  ok(`project ${projectSlug} already exists`);
}

// 2. Link this directory
section("2. Link local dir");
runOrFail("vercel link", "vercel", [
  "link",
  "--yes",
  "--project",
  projectSlug,
]);

// 3. Connect Git (may already be connected; allow-fail)
section("3. Connect Git");
runAllowFail("vercel git connect", "vercel", [
  "git",
  "connect",
  "--yes",
  originUrl,
]);

// 4. Create Blob store. If already exists and is connected to this project,
// `vercel blob list-stores --json` will include it; skip create.
section("4. Blob store");
const storeName = `${projectSlug}-blob`;
let blobStoreAlreadyWired = false;
{
  const r = runCapture("vercel", ["blob", "list-stores", "--json"]);
  if (r.status === 0) {
    try {
      const payload = JSON.parse(r.stdout || "null");
      const stores = Array.isArray(payload)
        ? payload
        : payload?.stores || payload?.data || [];
      blobStoreAlreadyWired = stores.some(
        (s) => (s?.name || s?.id || "").toString().includes(storeName),
      );
    } catch {
      /* best-effort */
    }
  }
}
if (!blobStoreAlreadyWired) {
  runOrFail("vercel blob create-store", "vercel", [
    "blob",
    "create-store",
    storeName,
    "-a",
    "public",
    "-e",
    "production",
    "-e",
    "preview",
    "-e",
    "development",
    "-y",
  ]);
} else {
  ok(`blob store ${storeName} already exists & connected`);
}

// 5. Derive BLOB_PUBLIC_BASE by uploading a ping file
section("5. BLOB_PUBLIC_BASE");
runOrFail("vercel env pull .env.local", "vercel", [
  "env",
  "pull",
  ".env.local",
  "--yes",
]);

const pingPath = path.join(root, ".provision-ping.txt");
fs.writeFileSync(pingPath, `provision-ping ${Date.now()}\n`);

let blobPublicBase = "";
try {
  const { put } = await import("@vercel/blob");
  const envFile = path.join(root, ".env.local");
  const envText = fs.readFileSync(envFile, "utf8");
  const tokenMatch = envText.match(/^BLOB_READ_WRITE_TOKEN="?([^"\n]+)"?/m);
  if (!tokenMatch) fail("BLOB_READ_WRITE_TOKEN not found in .env.local");
  const token = tokenMatch[1];

  const result = await put(".provision-ping.txt", fs.readFileSync(pingPath), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "text/plain; charset=utf-8",
    token,
  });
  const u = new URL(result.url);
  blobPublicBase = `${u.protocol}//${u.host}`;
  ok(`BLOB_PUBLIC_BASE = ${blobPublicBase}`);
} catch (err) {
  fail(`Couldn't derive BLOB_PUBLIC_BASE: ${err.message}`);
} finally {
  try {
    fs.unlinkSync(pingPath);
  } catch {
    /* ignore */
  }
}

// 6–10. Scalar env vars
section("6. Env vars");

function pushEnv(name, value, envs = ["production", "preview", "development"]) {
  for (const env of envs) {
    const r = run(
      "vercel",
      ["env", "add", name, env, "--value", value, "--force", "--yes"],
    );
    if (r.status !== 0) {
      console.warn(`  ! ${name} (${env}) failed — continuing`);
    } else {
      ok(`${name} (${env})`);
    }
  }
}

const adminPassword =
  process.env.ADMIN_PASSWORD || crypto.randomBytes(16).toString("hex");
const cronSecret = crypto.randomBytes(24).toString("hex");

pushEnv("NEXT_PUBLIC_SITE_URL", siteUrl);
if (ga4Id) pushEnv("NEXT_PUBLIC_GA_ID", ga4Id);
pushEnv("BLOB_PUBLIC_BASE", blobPublicBase);
pushEnv("CRON_SECRET", cronSecret);
pushEnv("ADMIN_PASSWORD", adminPassword);

if (wantsNewsletter) {
  if (process.env.RESEND_API_KEY) {
    pushEnv("RESEND_API_KEY", process.env.RESEND_API_KEY);
  } else {
    console.warn(
      "\n  ! RESEND_API_KEY not set in this shell. Newsletter was requested but the key is missing.",
    );
    console.warn(
      "    Add it later:  vercel env add RESEND_API_KEY production",
    );
  }
}

// 11. Domain
section("7. Domain");
const domainAdded = runAllowFail("vercel domains add", "vercel", [
  "domains",
  "add",
  domain,
  projectSlug,
]);
if (!domainAdded) {
  console.warn(
    `  ! Couldn't attach ${domain}. It may already be attached, or owned by another team. Inspect with:`,
  );
  console.warn(`    vercel domains inspect ${domain}`);
}

// 12. DNS records
section("8. DNS records for operator");
const inspect = runCapture("vercel", ["domains", "inspect", domain]);
if (inspect.status === 0) {
  console.log(inspect.stdout || "");
} else {
  console.warn(
    `  ! vercel domains inspect ${domain} failed — check the Vercel dashboard for DNS records.`,
  );
}

// ---- Summary ------------------------------------------------------------

section("Summary");
console.log(`Vercel project:    ${projectSlug}`);
console.log(`Domain attached:   ${domain} (DNS update still required)`);
console.log(`Blob public base:  ${blobPublicBase}`);
console.log(`ADMIN_PASSWORD:    ${adminPassword}   (save this — shown once)`);
console.log(`CRON_SECRET:       ${cronSecret}       (save this — shown once)`);
console.log();
console.log("Remaining human gates:");
console.log("  - Forward the DNS records above to the client's registrar");
console.log(
  `  - Invite ${config?._operator?.vercelEmail || "<operator email>"} to the Vercel project (dashboard → settings → members)`,
);
if (wantsNewsletter && !process.env.RESEND_API_KEY) {
  console.log(
    "  - Add RESEND_API_KEY once the client forwards their Resend key",
  );
}
console.log("  - git push  (triggers the first Vercel deploy)");
