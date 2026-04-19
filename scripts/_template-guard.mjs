/**
 * _template-guard.mjs
 *
 * Shared safety check used by rebrand.mjs and reset-content.mjs.
 *
 * Refuses to run a destructive operation inside the flagship / template
 * repo, where overwriting brand config or clearing editorial content would
 * trash the live site (leanbodyengine.com). When the operator has cloned
 * the template into a new repo for a client, the origin URL will no
 * longer match the blacklist and the guard passes silently.
 *
 * Bypass: pass `--force-template` to the invoking script. Only needed
 * when developing the template itself.
 */

import { execSync } from "node:child_process";

/**
 * Repo slugs that should never have destructive scripts run against them.
 * Add variants here (old names, mirrors, etc.) rather than hand-patching
 * the scripts.
 */
const BLACKLIST_PATTERNS = [
  /nathankhoang\/fitlife-hub(\.git)?$/i,
  /nathankhoang\/seo-articles(\.git)?$/i,
  /nathankhoang\/leanbodyengine(\.git)?$/i,
];

function readOrigin(cwd) {
  try {
    return execSync("git remote get-url origin", {
      cwd,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

function isBlacklisted(remoteUrl) {
  if (!remoteUrl) return false;
  return BLACKLIST_PATTERNS.some((p) => p.test(remoteUrl));
}

export function assertNotTemplateRepo({ cwd, argv, scriptName }) {
  const bypass =
    Array.isArray(argv) &&
    (argv.includes("--force-template") || argv.includes("--template-dev"));

  if (bypass) {
    console.warn(
      `\u26a0  --force-template passed. ${scriptName} will run against the template repo.`,
    );
    return;
  }

  const remote = readOrigin(cwd);
  if (!isBlacklisted(remote)) return;

  const lines = [
    "",
    "\u2717 Refusing to run against the template / flagship repo.",
    "",
    `  Git origin:  ${remote}`,
    `  Script:      ${scriptName}`,
    "",
    "  This command is destructive — it would rewrite lib/brand.ts or clear",
    "  affiliate + comparison content on the live leanbodyengine site.",
    "",
    "  What you almost certainly meant to do:",
    "",
    "    1. Clone the template into a new repo for this client:",
    "       gh repo fork nathankhoang/fitlife-hub --clone --fork-name <client>",
    "       cd <client>",
    "",
    "    2. Re-run the command in that directory.",
    "",
    "  If you really are developing on the template itself, pass",
    "  --force-template to bypass this guard.",
    "",
  ];
  console.error(lines.join("\n"));
  process.exit(2);
}
