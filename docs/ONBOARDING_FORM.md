# Client Onboarding Form — reference + setup

This doc defines the Google Form you send to every new fitness-influencer
client. Once they submit, the responses feed directly into the
`/onboard-client` slash command, which generates `client.config.json`,
runs `npm run rebrand`, optionally clears the seed content, and reports
back the manual steps that remain.

## How to set up the form (one-time)

1. Go to https://script.google.com and click **New project**.
2. Delete the starter `myFunction` and paste the contents of
   [`scripts/onboarding/create-form.gs`](../scripts/onboarding/create-form.gs).
3. Click **Run** → authorize access when prompted.
4. In Apps Script logs, copy the form's **edit URL** and **share URL**.
5. Open the edit URL → link it to a new Google Sheet (Responses tab → Link
   to Sheets). Responses will flow there.
6. Send the share URL to the client.
7. When they submit, open the Apps Script project again and run
   **`exportLatestResponse`** from
   [`scripts/onboarding/export-response.gs`](../scripts/onboarding/export-response.gs)
   — it prints a JSON object that matches `client.config.json` shape.
8. Copy that JSON into the client's repo at `client.config.json`, open a
   Claude Code session in that repo, and run `/onboard-client` — Claude
   reads the file, runs the pipeline, and tells you what's left to do
   manually (DNS, env vars, photo upload, etc.).

## Form sections & questions

Every question below maps to a specific field in `client.config.json` or
an operational prerequisite. Optional fields are marked; everything else
is required.

### Section 1 — The basics (identity)

| # | Question | Type | Maps to |
|---|---|---|---|
| 1 | Brand name | short text | `name` |
| 2 | Short badge (2–4 letters / monogram for the nav tile) | short text | `shortName` |
| 3 | One-sentence tagline (Footer + OG descriptions) | short text | `tagline` |
| 4 | 2–3 sentence description (used as the SEO meta description site-wide) | paragraph | `description` |
| 5 | Legal business name (for copyright notices) | short text | `legalName` |
| 6 | Production domain you'll use (e.g. `janefitness.com`) | short text | used to set `NEXT_PUBLIC_SITE_URL` env var |

### Section 2 — About you (the author)

| # | Question | Type | Maps to |
|---|---|---|---|
| 7 | Your full name (as it appears on bylines) | short text | `author.name` |
| 8 | Credentials (e.g. "CSCS, RD", "NASM-CPT") — optional | short text | `author.credentials` |
| 9 | Short bio, 1–3 sentences (byline + article cards) | paragraph | `author.bio` |
| 10 | Long bio, 1–2 paragraphs (the About page hero) | paragraph | `author.longBio` |
| 11 | Topics you cover (select all that apply) | multi-checkbox | `author.knowsAbout` |
| 12 | Do you want articles to show YOU as the named author? (recommended for YMYL) | yes/no | `author.emitPersonSchema` |
| 13 | Public contact email | short text | `contact.email` |
| 14 | Headshot — upload a square ≥600×600 photo (or leave blank and send via email) | file upload | `author.photoUrl` (operator saves under `public/images/author/`) |

### Section 3 — Social links

One per platform, paste the full URL. Leave blank if you don't use it.

| # | Question | Type | Maps to |
|---|---|---|---|
| 15 | Instagram URL | short text | `socials[platform=instagram]` |
| 16 | YouTube channel URL | short text | `socials[platform=youtube]` |
| 17 | TikTok URL | short text | `socials[platform=tiktok]` |
| 18 | X (Twitter) URL | short text | `socials[platform=x]` |
| 19 | Threads URL | short text | `socials[platform=threads]` |
| 20 | Facebook URL | short text | `socials[platform=facebook]` |

### Section 4 — Affiliate accounts

| # | Question | Type | Maps to |
|---|---|---|---|
| 21 | Amazon Associates tracking ID (tag that Amazon issued you) | short text | `affiliates.amazonTag` |
| 22 | Are you already approved by Amazon Associates? | yes/no | operator-side gate; pause setup if no |
| 23 | ClickBank nickname (optional) | short text | `affiliates.clickbankId` |
| 24 | ShareASale affiliate ID (optional) | short text | `affiliates.shareasaleId` |

### Section 5 — Content focus

| # | Question | Type | Maps to |
|---|---|---|---|
| 25 | Target audience — who's the reader? | radio (Beginners / Intermediate / Advanced / Mixed) | Used for default `/create-post` config |
| 26 | Which of these site categories should be active? | multi-checkbox (Home Workouts, Supplements, Diet & Nutrition, Weight Loss, Muscle Building, Wellness) | Categories absent get minimal content; default descriptions kept |
| 27 | Topics you want to AVOID (health claims, brands, etc.) | paragraph | Captured for editorial guardrails |

### Section 6 — Starter content

| # | Question | Type | Maps to |
|---|---|---|---|
| 28 | List 5–10 cornerstone article topics for your first month (one per line) | paragraph | Fed into `/create-post` for initial seeding |
| 29 | Supplement products you personally endorse and want to link to — one per line as `Product name · Amazon URL · one-sentence reason` | paragraph | Seeds for `lib/affiliates.ts` |
| 30 | Do you have existing blog content to migrate? If yes, paste URLs or describe | paragraph | Operator triages manually |

### Section 7 — Content workflow

| # | Question | Type | Maps to |
|---|---|---|---|
| 31 | How will you send content? (select all that apply) | multi-checkbox (TikTok/Reels, YouTube, Written drafts, Topic ideas only) | Informs cadence plan |
| 32 | Expected posting cadence | dropdown (1–2/week, 3–5/week, 6–10/week, 10+/week) | Informs ops planning |

### Section 8 — Infrastructure handoff

| # | Question | Type | Maps to |
|---|---|---|---|
| 33 | Your Vercel account email (so we can share the project) | short text | Operator-side |
| 34 | GitHub username (so we can grant repo access) | short text | Operator-side |
| 35 | Google Analytics 4 tracking ID (leave blank if none) | short text | `NEXT_PUBLIC_GA_ID` env var |
| 36 | Do you want a newsletter set up? | yes/no | Operator decides Resend account path |

### Section 9 — Launch preferences

| # | Question | Type | Maps to |
|---|---|---|---|
| 37 | Target launch date | date | Operator planning |
| 38 | Any brand color preference beyond the default emerald green? (hex code if you have one) | short text | Advanced — charge for custom theme; default stays green |
| 39 | Anything else we should know? | paragraph | Free-form |

## What `/onboard-client` does with this

When you run `/onboard-client` in Claude Code with a populated
`client.config.json` in the repo root, Claude will:

1. Validate every required field in the config
2. Run `npm run rebrand` — writes `lib/brand.ts`
3. Ask whether to run `npm run reset:content -- --yes` (default yes unless
   client asked to keep existing LBE seeds)
4. Create a post-form checklist in the session output covering:
   - Photo upload location (`public/images/author/<slug>.webp`)
   - Favicon / icon replacement paths
   - Vercel env vars to set
   - DNS record for the domain
   - Initial-content seeding commands ready to paste (one
     `/create-post` command per cornerstone topic from Section 6)
   - Affiliate product catalog seed commands from Section 6 answers
5. Stop — no auto-deploy. Operator decides when to ship.

## Gotchas

- **Amazon not yet approved (Q22 = no)** — Pause setup and wait. Affiliate
  links built with an unapproved tag earn nothing, and Amazon requires
  actual traffic within 180 days of approval.
- **No headshot** — set `author.photoUrl: null` so the monogram fallback
  renders. Upload later and update config.
- **Custom brand color (Q38)** — that's a code change, not a config
  change. Price separately.
- **Multi-author request** — template is single-author. Decline or price
  as a bespoke engagement.
