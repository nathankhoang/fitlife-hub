/**
 * create-form.gs
 *
 * One-time Google Apps Script that creates the fitness-influencer
 * onboarding form exactly as specified in docs/ONBOARDING_FORM.md.
 *
 * How to run:
 *   1. https://script.google.com → New project
 *   2. Delete the starter code, paste this entire file in
 *   3. Click Run → authorize the permissions Google asks for
 *   4. Check the Execution log for the edit + share URLs
 *
 * The form is created in your Google Drive root. Move it wherever you
 * want, link it to a Response Sheet, and send the share URL to clients.
 */

function createOnboardingForm() {
  const form = FormApp.create("Fitness Influencer Site — Onboarding")
    .setDescription(
      "Tell us about your brand, you, and how you work. Takes 10–15 minutes. " +
        "We use every answer to customize your site before launch. Sections " +
        "with a * are required.",
    )
    .setCollectEmail(true)
    .setProgressBar(true)
    .setShowLinkToRespondAgain(false);

  // Section 1 — The basics
  form.addPageBreakItem().setTitle("1. The basics");
  req(form.addTextItem().setTitle("Brand name").setHelpText("What's the site called? (e.g. \"Jane Fitness\", \"SteelMind Performance\")"));
  req(
    form
      .addTextItem()
      .setTitle("Short badge — 2 to 4 letters")
      .setHelpText("Monogram for the nav tile, e.g. JF, SMP")
      .setValidation(
        FormApp.createTextValidation()
          .setHelpText("Must be 2–4 letters or numbers")
          .requireTextMatchesPattern("^[A-Za-z0-9]{2,4}$")
          .build(),
      ),
  );
  req(form.addTextItem().setTitle("One-sentence tagline").setHelpText("Used in Footer and OG descriptions"));
  req(form.addParagraphTextItem().setTitle("2–3 sentence description").setHelpText("This becomes the site-wide SEO meta description"));
  req(form.addTextItem().setTitle("Legal business name").setHelpText("For the © footer and T&Cs"));
  req(
    form
      .addTextItem()
      .setTitle("Production domain")
      .setHelpText("e.g. janefitness.com — don't include https:// or paths"),
  );

  // Section 2 — About you
  form.addPageBreakItem().setTitle("2. About you (the author)");
  req(form.addTextItem().setTitle("Your full name").setHelpText("As it'll appear on bylines"));
  form.addTextItem().setTitle("Credentials (optional)").setHelpText("e.g. CSCS, RD, NASM-CPT — leave blank if none");
  req(form.addParagraphTextItem().setTitle("Short bio — 1 to 3 sentences").setHelpText("Used on bylines and article cards"));
  req(form.addParagraphTextItem().setTitle("Long bio — 1 to 2 paragraphs").setHelpText("The About-page hero"));
  req(
    form
      .addCheckboxItem()
      .setTitle("Topics you cover")
      .setHelpText("Select all that apply — maps to schema.org knowsAbout")
      .setChoiceValues([
        "Strength training",
        "Hypertrophy / muscle building",
        "Powerlifting",
        "Nutrition",
        "Diet and meal planning",
        "Cutting / fat loss",
        "Supplements",
        "Recovery",
        "Sleep",
        "Mindset and habits",
        "Cardio conditioning",
        "Running",
        "Women's fitness",
        "Men's fitness",
        "Injury prevention",
      ]),
  );
  req(
    form
      .addMultipleChoiceItem()
      .setTitle("Show YOU as the named author on articles?")
      .setHelpText(
        "Strongly recommended for YMYL (health/fitness) content. Enables the Person schema that Google weights for E-E-A-T.",
      )
      .setChoiceValues(["Yes, use my name as author", "No, use the brand name"]),
  );
  req(
    form
      .addTextItem()
      .setTitle("Public contact email")
      .setHelpText("Shown in Footer and About page")
      .setValidation(
        FormApp.createTextValidation()
          .setHelpText("Must be a valid email address")
          .requireTextMatchesPattern("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")
          .build(),
      ),
  );
  form
    .addTextItem()
    .setTitle("Headshot — Google Drive link (optional)")
    .setHelpText(
      "Paste a public Google Drive/Dropbox link to a square photo, min 600×600. If you don't have one handy, skip — we'll use a monogram avatar and swap in the photo later.",
    );

  // Section 3 — Social links
  const s3 = form.addPageBreakItem().setTitle("3. Social links");
  s3.setHelpText("Paste the full URL for each platform you're active on. Skip the ones you don't use.");
  form.addTextItem().setTitle("Instagram URL");
  form.addTextItem().setTitle("YouTube channel URL");
  form.addTextItem().setTitle("TikTok URL");
  form.addTextItem().setTitle("X (Twitter) URL");
  form.addTextItem().setTitle("Threads URL");
  form.addTextItem().setTitle("Facebook URL");

  // Section 4 — Affiliates
  form.addPageBreakItem().setTitle("4. Affiliate accounts");
  req(
    form
      .addTextItem()
      .setTitle("Amazon Associates tracking ID")
      .setHelpText("The tag Amazon issued you, e.g. janefit-20"),
  );
  req(
    form
      .addMultipleChoiceItem()
      .setTitle("Are you already approved by Amazon Associates?")
      .setHelpText(
        "If not, please apply first — we can't earn commission until you're approved, and Amazon requires real traffic within 180 days of approval.",
      )
      .setChoiceValues(["Yes, approved", "No, still in application", "Haven't applied yet"]),
  );
  form.addTextItem().setTitle("ClickBank nickname (optional)");
  form.addTextItem().setTitle("ShareASale affiliate ID (optional)");

  // Section 5 — Content focus
  form.addPageBreakItem().setTitle("5. Content focus");
  req(
    form
      .addMultipleChoiceItem()
      .setTitle("Who's the reader?")
      .setChoiceValues(["Beginners", "Intermediate", "Advanced", "Mixed audience"]),
  );
  req(
    form
      .addCheckboxItem()
      .setTitle("Which site categories should be active?")
      .setHelpText("Check each one you'll produce content for. Categories you skip stay on the template but won't be promoted.")
      .setChoiceValues([
        "Home Workouts",
        "Supplements",
        "Diet & Nutrition",
        "Weight Loss",
        "Muscle Building",
        "Wellness",
      ]),
  );
  form
    .addParagraphTextItem()
    .setTitle("Topics to AVOID")
    .setHelpText(
      "Anything you won't cover — specific brands, claims you don't want to make, medical topics to stay away from, etc. Leave blank if no restrictions.",
    );

  // Section 6 — Starter content
  form.addPageBreakItem().setTitle("6. Starter content");
  req(
    form
      .addParagraphTextItem()
      .setTitle("Top 5–10 cornerstone article topics")
      .setHelpText("One per line. These become your first month's articles."),
  );
  form
    .addParagraphTextItem()
    .setTitle("Supplements you personally endorse")
    .setHelpText(
      "One per line as: Product name · Amazon URL · one-sentence reason. We'll seed your affiliate catalog with these.",
    );
  form
    .addParagraphTextItem()
    .setTitle("Existing blog content to migrate?")
    .setHelpText("Paste URLs, or describe what/where the content lives. Skip if this is a new site.");

  // Section 7 — Content workflow
  form.addPageBreakItem().setTitle("7. Content workflow");
  req(
    form
      .addCheckboxItem()
      .setTitle("How will you send us content?")
      .setChoiceValues([
        "TikTok / Reels / short-form videos",
        "YouTube long-form videos",
        "Written drafts (Google Doc, Notion, email)",
        "Topic ideas only — you generate the rest",
      ]),
  );
  req(
    form
      .addListItem()
      .setTitle("Expected posting cadence")
      .setChoiceValues([
        "1–2 articles per week",
        "3–5 articles per week",
        "6–10 articles per week",
        "10+ articles per week",
      ]),
  );

  // Section 8 — Infrastructure handoff
  form.addPageBreakItem().setTitle("8. Infrastructure handoff");
  req(
    form
      .addTextItem()
      .setTitle("Your Vercel account email")
      .setHelpText("We'll share the project with this email so you can see deploy logs"),
  );
  req(form.addTextItem().setTitle("Your GitHub username").setHelpText("We'll grant you repo access"));
  form
    .addTextItem()
    .setTitle("Google Analytics 4 measurement ID (optional)")
    .setHelpText("e.g. G-XXXXXXXXXX — leave blank if you don't have GA4 yet");
  req(
    form
      .addMultipleChoiceItem()
      .setTitle("Do you want an email newsletter set up?")
      .setChoiceValues([
        "Yes — I have a Resend API key already",
        "Yes — please create the Resend account for me",
        "No, skip the newsletter for now",
      ]),
  );
  form
    .addTextItem()
    .setTitle("Beehiiv publication ID (optional)")
    .setHelpText(
      "If you already have a Beehiiv account, paste your publication ID (starts with 'pub_'). Find it at beehiiv.com → Settings → Publication → Publication ID. Leave blank if you don't have Beehiiv set up — we'll configure it later.",
    );

  // Section 9 — Launch preferences
  form.addPageBreakItem().setTitle("9. Launch preferences");
  form.addDateItem().setTitle("Target launch date");
  form
    .addTextItem()
    .setTitle("Brand color preference (optional)")
    .setHelpText(
      "Default is emerald green (#059669). If you want a different primary color, paste a hex code here. Note: custom colors beyond the default are a paid scope change.",
    );
  form
    .addParagraphTextItem()
    .setTitle("Anything else we should know?")
    .setHelpText("Constraints, deadlines, past sites you like, anything relevant.");

  const editUrl = form.getEditUrl();
  const publishedUrl = form.getPublishedUrl();

  Logger.log("=".repeat(70));
  Logger.log("Fitness Influencer Onboarding — form created.");
  Logger.log("Edit URL:   " + editUrl);
  Logger.log("Share URL:  " + publishedUrl);
  Logger.log("=".repeat(70));
  Logger.log(
    "Next: open the Edit URL → Responses tab → Link to Sheets → save the sheet.",
  );
  Logger.log(
    "Then: send the Share URL to each new client. Run exportLatestResponse.gs after they submit.",
  );

  return { editUrl: editUrl, publishedUrl: publishedUrl };
}

function req(item) {
  item.setRequired(true);
  return item;
}

/**
 * Adds the Beehiiv publication ID question to an already-deployed form.
 * Run this ONCE from the Apps Script editor after pulling the latest
 * create-form.gs — idempotent, so re-runs are safe (it checks whether the
 * question already exists before adding).
 *
 * How to run:
 *   1. Open the Apps Script editor attached to the live onboarding form.
 *   2. Select `addNewOnboardingFields` from the function dropdown.
 *   3. Click Run. Check the log for "added" vs "already present".
 */
function addNewOnboardingFields() {
  const form = FormApp.getActiveForm();
  if (!form) {
    Logger.log(
      "No active form. Open this Apps Script from the form's Script Editor (Form → three-dot menu → Script Editor).",
    );
    return;
  }

  const existingTitles = new Set(
    form.getItems().map((i) => i.getTitle().trim()),
  );

  const fieldsToAdd = [
    {
      title: "Beehiiv publication ID (optional)",
      help:
        "If you already have a Beehiiv account, paste your publication ID (starts with 'pub_'). Find it at beehiiv.com → Settings → Publication → Publication ID. Leave blank if you don't have Beehiiv set up — we'll configure it later.",
    },
  ];

  let added = 0;
  for (const f of fieldsToAdd) {
    if (existingTitles.has(f.title)) {
      Logger.log(`- ${f.title} — already present, skipping`);
      continue;
    }
    form.addTextItem().setTitle(f.title).setHelpText(f.help);
    Logger.log(`+ ${f.title} — added`);
    added++;
  }

  Logger.log(`Done. Added ${added} new field(s) to the form.`);
  Logger.log(`Edit URL: ${form.getEditUrl()}`);
}
