# Client Onboarding Checklist

End-to-end guide for spinning up a new fitness-influencer site from this
template. The goal: a working, rebranded, deployed site with initial
content in **under 3 hours** of operator time.

---

## 0. Prerequisites (collect from the client up front)

Have the client send over the following **before** you start, ideally in a
single email or shared doc:

- **Brand name** (e.g., "Jane Fitness", "SteelMind Performance")
- **Short badge** — 2–4 letter monogram for the nav tile (e.g., "JF", "SMP")
- **Tagline** — one sentence, used on Footer + Organization schema
- **Domain** — the production URL they'll use (e.g., `janefitness.com`)
- **Author block**:
  - Legal / public name
  - Credentials (e.g., "CSCS, RD", "PT, CPT") — optional but strong for YMYL
  - 2–3 sentence short bio (byline / article cards)
  - 1–2 paragraph long bio (about page hero)
  - Square headshot, 600×600 minimum, neutral background preferred
  - Topics they cover (for `knowsAbout` schema — e.g., "Strength training",
    "Nutrition", "Recovery")
- **Social links** — whichever of these are real and active:
  - Instagram, YouTube, TikTok, X, Threads, Facebook
- **Contact email** — the address that'll appear in Footer + About page
- **Amazon Associates tracking ID** — their approved tag (e.g., `janefit-20`)
  - If they don't have one, pause and have them apply first; Associates
    approval takes 1–3 days and is required for affiliate links to work.

Without all of this, don't start the setup — you'll be blocked halfway through.

---

## 1. Clone and branch

```bash
# Fork or clone the template repo
gh repo fork nathankhoang/fitlife-hub --clone --fork-name <client-slug>

# OR: new repo from scratch
git clone https://github.com/nathankhoang/fitlife-hub.git <client-slug>
cd <client-slug>
rm -rf .git
git init -b main
```

**Branch strategy:** work on a `client-setup` branch, merge to `main` once the
client has signed off on a staging preview. Don't push to their production
branch until they've seen the site.

---

## 2. Rebrand with the scaffolding script

Copy the example config and fill in the client's details:

```bash
cp client.config.example.json client.config.json
# Edit client.config.json with the values collected in step 0
```

Then run:

```bash
npm run rebrand
```

This writes `lib/brand.ts` with the new values. Review the diff and commit.

**Files you may also need to touch manually** (the script doesn't:

- `public/favicon.ico`, `apple-icon.png`, `icon.png` — replace with client assets
- `public/images/author/<slug>.webp` — drop the client's headshot here; set
  `author.photoUrl: "/images/author/<slug>.webp"` in `brand.ts`
- `app/category/[category]/page.tsx` → `categoryMeta` — adjust category
  descriptions to match the client's voice (these are per-site editorial copy,
  not config)

---

## 3. Environment variables

Set these in Vercel **Project Settings → Environment Variables**:

| Variable | Required? | Example |
|---|---|---|
| `BLOB_PUBLIC_BASE` | required | `https://xxx.public.blob.vercel-storage.com` |
| `BLOB_READ_WRITE_TOKEN` | required | (from the Blob store integration) |
| `NEXT_PUBLIC_SITE_URL` | required | `https://janefitness.com` |
| `NEXT_PUBLIC_GA_ID` | optional | `G-XXXXXXXXXX` — only if GA4 is being used |
| `ADMIN_PASSWORD` | required | (strong password, stored in a password manager) |
| `RESEND_API_KEY` | optional | (only if newsletter is active) |
| `CRON_SECRET` | required if cron | (used by `/api/cron/*` routes) |

**Blob setup:**
1. In Vercel, open the project → Storage → Create Database → Blob.
2. Copy the public URL and strip any trailing slash. Paste into
   `BLOB_PUBLIC_BASE`.
3. The read/write token auto-populates when you link the Blob store.

---

## 4. Domain + DNS

1. Vercel Project → Settings → Domains → Add the client's domain.
2. Vercel gives you either an A record or CNAME. Send the client the exact
   record to add at their registrar.
3. Wait for propagation (usually < 1 hour). Vercel issues the SSL cert
   automatically once DNS resolves.

---

## 5. Initial content

The site ships with editorial content that's LeanBodyEngine-specific.
Depending on the client, you'll either:

**Option A: Keep the shipped content** (fastest). The affiliate catalog,
comparison pages, and tool pages are neutral enough for most fitness
niches. The client will replace articles over time via `create-post`.

**Option B: Clear and re-seed** (recommended for clients with distinct voice).

```bash
# One-shot clean slate — clears affiliateProducts, comparisons, queue.json.
# Preserves types, helpers, and everything framework/tools/schema-related.
npm run reset:content          # dry-run — shows what'll change
npm run reset:content -- --yes # actually apply
```

Then manually:
- Add the client's curated affiliate products to `lib/affiliates.ts`
- Hand-curate 3–5 comparison matchups in `lib/comparisons.ts` using products the client stands behind
- Delete or replace `content/articles/*.mdx` seeds
- Clear `articles/` and `drafts/` folders in the Blob store if reusing an existing Blob (fresh stores start empty)

Either way, generate the **first 5 cornerstone articles** with the client's
voice using `create-post`. These anchor the site's topical authority — pick
the highest-volume queries in the client's niche and write real articles,
not thin stubs.

---

## 5b. Video-to-article pipeline (optional but recommended)

For influencer clients, the biggest content-flow hurdle is getting them to
type anything. The `video:article` script turns any of their existing
TikTok / YouTube / Instagram Reel videos into an MDX draft in ~2 minutes —
no typing required from them.

**Workstation prereqs** (one-time install):

- `yt-dlp` — https://github.com/yt-dlp/yt-dlp
  - macOS: `brew install yt-dlp`
  - Windows: `winget install yt-dlp`
  - Python: `pip install yt-dlp`
- `ffmpeg` — https://ffmpeg.org (optional, for hero-frame extraction)
  - macOS: `brew install ffmpeg`
  - Windows: `winget install ffmpeg`

**Env vars** (add to `.env.local` in the client repo):

- `OPENAI_API_KEY` — used for Whisper transcription (~$0.006/min of audio)
- `ANTHROPIC_API_KEY` — used for Claude article structuring

**Usage:**

```bash
# From a video URL
npm run video:article -- \
  https://www.youtube.com/watch?v=XXXX \
  --category supplements \
  --slug creatine-loading-explained

# From a local file
npm run video:article -- ./raw-video.mp4 --category home-workouts

# From an existing transcript (skip transcription)
npm run video:article -- \
  --transcript ./transcript.txt \
  --category supplements \
  --slug my-topic
```

**What it produces:**

- `content/drafts/<slug>.mdx` — MDX with frontmatter + body, ready for the
  admin queue. Claude is prompted to preserve the creator's voice —
  rearranges, doesn't rewrite. It'll remove filler and add SEO structure
  (title, description, H2s, FAQ, hero image path) but won't put words in
  their mouth.
- `public/images/articles/<slug>.webp` — hero frame auto-extracted from
  the video (3-second mark, scaled to 1600w) if ffmpeg is installed.
  Otherwise the operator adds one manually.

**Operator review checklist before publishing:**

- [ ] Skim the transcript (left in the temp dir printed by the script) and
      the MDX side-by-side — does the article stay faithful?
- [ ] Check the frontmatter title and description — they're SEO-optimized
      by Claude but may need tweaks
- [ ] Verify the category is right
- [ ] Confirm the hero image exists (or replace the auto-extracted frame)
- [ ] Spot-check the FAQ — Claude only generates questions the transcript
      actually addresses, but double-check for accuracy
- [ ] Move the draft into the publish queue via admin panel OR commit to
      `content/drafts/` and trigger a deploy

**Typical flow for a client's week:**

1. Client sends 2–3 video links (Slack, email, shared folder)
2. Operator runs `npm run video:article` on each (< 5 min per video)
3. Operator reviews + polishes each draft (~10 min per article)
4. Batch-publishes via the admin queue

Scales to 10+ articles/week per client without the client typing a word.

---

## 6. First deploy

```bash
git add -A
git commit -m "Initial rebrand for <client-name>"
git push
```

Vercel auto-deploys. The first deploy typically runs 3–5 minutes. Check the
preview URL Vercel returns and walk through:

- [ ] Homepage loads, hero/tagline look right
- [ ] Nav wordmark shows correct short name
- [ ] Footer shows correct brand, contact email, copyright
- [ ] `/about` shows the client's hero greeting, bio, and AuthorCard
- [ ] `/tools/macro-calculator` loads, produces correct numbers
- [ ] `/compare` lists comparisons and they load
- [ ] Any blog article shows the client as author on the byline
- [ ] View-source has `"name":"<client-brand>"` in Organization schema
- [ ] View-source has `"@type":"Person"` with client's name as article author

---

## 7. Post-launch verification

**Search Console (Google):**
- [ ] Add property — either the bare domain (DNS verification, ideal) or
      the exact URL (HTML tag — use `metadata.verification.google` in
      `app/layout.tsx`)
- [ ] Submit sitemap at `<domain>/sitemap.xml`
- [ ] Request indexing for the homepage, about, and top 3 articles

**Bing Webmaster Tools:**
- [ ] Add site, verify, submit sitemap

**Amazon Associates:**
- [ ] Confirm the tracking ID is live by clicking an affiliate link on the
      site and checking the URL ends with `?tag=<client-tag>`
- [ ] Amazon needs to see real traffic within 180 days of approval or the
      account gets closed — if launch traffic is slow, flag this.

**Rich Results Test** — validate on a sample article:
- https://search.google.com/test/rich-results
- Confirm Article, FAQPage (if present), Product (if present), BreadcrumbList
  all pass
- Person author has `url`, `jobTitle`, `sameAs` populated

**Analytics:**
- If `NEXT_PUBLIC_GA_ID` is set, load the homepage in an incognito window
  and verify a pageview shows up in GA4 real-time

---

## 8. Handoff to the client

- Send them the admin URL (`/admin`) and the password
- Document the `create-post` workflow so they can submit drafts by sending
  you content (or, once video-to-article lands, pointing at a video URL)
- Set expectations on content cadence — 2 articles/week is a sensible
  minimum for SEO momentum; slower than that stalls progress

---

## Common gotchas

- **Images not showing up on deploy** — check that the images are committed
  to git, not just generated locally. The `create-post` flow should stage
  them automatically; if it doesn't, fix that script.
- **`BLOB_PUBLIC_BASE` trailing slash** — the resolver strips trailing slashes
  but avoid double-slash in raw configs.
- **Amazon tag not approved yet** — the links still route, but you earn
  nothing until approval. Don't push affiliate-driven content before then.
- **Old LBE metadata leaking** — if you see "LeanBodyEngine" anywhere on the
  preview, it's in content (articles, affiliate product names, etc.), not
  config. `grep -rn "LeanBodyEngine" content/ lib/affiliates.ts` to find it.
- **Author photo broken** — path must start with `/` and point to a file in
  `public/`. For external URLs (S3, CDN), use the full `https://...`.

---

## What's customizable vs. what's fixed

**Customizable via `lib/brand.ts`:** name, shortName, tagline, description,
legal name, author (name, bio, credentials, photo, topics, profile URL,
Person-schema toggle), contact email, Amazon tag, ClickBank + ShareASale IDs,
socials.

**Customizable via content:** category descriptions, article MDX, affiliate
product catalog (`lib/affiliates.ts`), comparison registry
(`lib/comparisons.ts`), about-page body copy.

**Fixed (code changes = scope creep):** layout structure, nav/footer shape,
tool logic, schema emission patterns, color palette (currently green accent),
font stack. Charge separately for changes here.
