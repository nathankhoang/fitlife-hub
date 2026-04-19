/**
 * export-response.gs
 *
 * Reads the latest submission on the onboarding form and prints a JSON
 * object that matches client.config.json exactly. You copy that JSON into
 * the client's repo and then run `/onboard-client` in Claude Code.
 *
 * How to use:
 *   1. Paste this file into the SAME Apps Script project that hosts
 *      create-form.gs (so FormApp.getActiveForm() resolves to your form).
 *   2. Click Run on exportLatestResponse.
 *   3. View → Logs — copy the printed JSON.
 *   4. Save it as client.config.json in the client's repo root.
 *   5. In the repo, open Claude Code and run: /onboard-client
 */

function exportLatestResponse() {
  const form = FormApp.getActiveForm();
  if (!form) {
    Logger.log(
      "No active form. Open this Apps Script from the form's Script Editor (Form → three-dot menu → Script Editor) so FormApp.getActiveForm() resolves.",
    );
    return null;
  }

  const responses = form.getResponses();
  if (responses.length === 0) {
    Logger.log("No responses yet. Share the form and wait for a submission.");
    return null;
  }

  const latest = responses[responses.length - 1];
  const answers = {};
  for (const item of latest.getItemResponses()) {
    const title = item.getItem().getTitle();
    answers[title] = item.getResponse();
  }

  const config = mapAnswersToConfig(answers);
  const out = JSON.stringify(config, null, 2);

  Logger.log("=".repeat(70));
  Logger.log("client.config.json — copy everything between the lines below");
  Logger.log("=".repeat(70));
  Logger.log(out);
  Logger.log("=".repeat(70));

  return out;
}

function mapAnswersToConfig(a) {
  const get = (key) => (a[key] === undefined || a[key] === "" ? null : a[key]);
  const getStr = (key) => {
    const v = get(key);
    return typeof v === "string" ? v.trim() : "";
  };
  const getArr = (key) => {
    const v = a[key];
    return Array.isArray(v) ? v : [];
  };

  const emitPersonChoice = getStr("Show YOU as the named author on articles?");
  const emitPersonSchema = emitPersonChoice.toLowerCase().startsWith("yes");

  const socials = [];
  pushSocial(socials, "instagram", getStr("Instagram URL"));
  pushSocial(socials, "youtube", getStr("YouTube channel URL"));
  pushSocial(socials, "tiktok", getStr("TikTok URL"));
  pushSocial(socials, "x", getStr("X (Twitter) URL"));
  pushSocial(socials, "threads", getStr("Threads URL"));
  pushSocial(socials, "facebook", getStr("Facebook URL"));

  const authorName = getStr("Your full name");
  const authorSlug = slugify(authorName) || "author";

  const config = {
    name: getStr("Brand name"),
    shortName: getStr("Short badge — 2 to 4 letters").toUpperCase(),
    tagline: getStr("One-sentence tagline"),
    description: getStr("2–3 sentence description"),
    legalName: getStr("Legal business name"),

    author: {
      name: authorName,
      ...(getStr("Credentials (optional)")
        ? { credentials: getStr("Credentials (optional)") }
        : {}),
      bio: getStr("Short bio — 1 to 3 sentences"),
      longBio: getStr("Long bio — 1 to 2 paragraphs"),
      photoUrl: getStr("Headshot — Google Drive link (optional)")
        ? `/images/author/${authorSlug}.webp`
        : null,
      profileUrl: "/about",
      knowsAbout: getArr("Topics you cover"),
      emitPersonSchema,
    },

    contact: {
      email: getStr("Public contact email"),
    },

    affiliates: {
      amazonTag: getStr("Amazon Associates tracking ID"),
      clickbankId: getStr("ClickBank nickname (optional)") || null,
      shareasaleId: getStr("ShareASale affiliate ID (optional)") || null,
    },

    socials,

    // Non-brand metadata preserved for the operator / /onboard-client slash
    // command. These fields aren't part of lib/brand.ts — they drive the
    // setup checklist (env vars, starter content, etc.) downstream.
    _operator: {
      domain: getStr("Production domain"),
      amazonApproved: getStr(
        "Are you already approved by Amazon Associates?",
      ),
      headshotSourceUrl: getStr("Headshot — Google Drive link (optional)"),
      audience: getStr("Who's the reader?"),
      activeCategories: getArr("Which site categories should be active?"),
      avoidTopics: getStr("Topics to AVOID"),
      starterTopics: getStr("Top 5–10 cornerstone article topics"),
      starterProducts: getStr("Supplements you personally endorse"),
      existingContent: getStr("Existing blog content to migrate?"),
      contentSources: getArr("How will you send us content?"),
      cadence: getStr("Expected posting cadence"),
      vercelEmail: getStr("Your Vercel account email"),
      githubUsername: getStr("Your GitHub username"),
      ga4Id: getStr("Google Analytics 4 measurement ID (optional)"),
      newsletter: getStr("Do you want an email newsletter set up?"),
      launchDate: getStr("Target launch date"),
      brandColor: getStr("Brand color preference (optional)"),
      notes: getStr("Anything else we should know?"),
      submittedAt: new Date().toISOString(),
    },
  };

  return config;
}

function pushSocial(arr, platform, url) {
  if (!url) return;
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return;
  const handle = inferHandle(platform, trimmed);
  arr.push({ platform, handle, url: trimmed });
}

function inferHandle(platform, url) {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/^\/+|\/+$/g, "");
    return path.split("/")[0].replace(/^@/, "") || platform;
  } catch (e) {
    return platform;
  }
}

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
