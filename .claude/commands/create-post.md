# /create-post

You are autonomously creating **10 fitness blog posts for LeanBodyEngine per invocation** by dispatching 10 parallel sub-agents. **Default mode is fully autonomous** — do not ask the user any questions. Generate every answer yourself, proceed through every step without waiting for confirmation, and report back at the end.

If the user passes arguments (e.g. a topic, product list, or publish timing), treat those as overrides and apply them to ALL 10 posts in the batch; fill the rest autonomously. Otherwise, pick everything yourself.

---

## Step 0 — Iteration Control (run this FIRST, every invocation)

Read `data/telemetry/state.json`. Use its `iteration` and `maxIterations` fields to decide what mode to run in.

**Decision table:**

| Condition | Mode | Action |
|-----------|------|--------|
| `iteration < maxIterations` | **generate** | Run Steps 1–6 below. Increment `iteration` BEFORE Step 1. Set `hookShouldLog = true`. Set `mode = "generate"`. If `iteration` was 0, also set `startedAt` to the current ISO timestamp. After all 10 sub-agents finish and the queue is updated, **call `ScheduleWakeup` with `delaySeconds: 60`, `prompt: "/create-post"`, and `reason: "create-post iteration N+1 of 10"`** to trigger the next iteration. |
| `iteration >= maxIterations` | **finalize** | Skip Steps 1–6. Set `hookShouldLog = false`, `mode = "done"`. Generate the **cost & expenditure report** (see Step 7 below). **Do NOT call `ScheduleWakeup`** — the loop terminates here. |

Always write the updated state back to `data/telemetry/state.json` before continuing.

Print a single-line header: `=== create-post iteration N/10 (mode) — dispatching 10 parallel sub-agents ===` so the transcript clearly marks each run.

---

## Step 0.5 — Queue Reconciliation (runs every invocation, before Step 1)

Ensure every published MDX file is registered in `queue.json` — including articles that predate the queue system or were committed directly to git.

Run this Node snippet from the project root:

```
node --env-file=.env.local -e "
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { put } = require('@vercel/blob');

const ARTICLES_DIR = path.join(process.cwd(), 'content', 'articles');
const QUEUE_PATH = path.join(process.cwd(), 'data', 'queue.json');

const queue = JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf8'));
const existingSlugs = new Set(queue.map(e => e.slug));

const mdxFiles = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.mdx'));
const added = [];

for (const file of mdxFiles) {
  const slug = file.replace(/\.mdx$/, '');
  if (existingSlugs.has(slug)) continue;
  const raw = fs.readFileSync(path.join(ARTICLES_DIR, file), 'utf8');
  const { data } = matter(raw);
  if (!data.title || !data.category) continue;
  const entry = {
    id: slug,
    slug,
    title: data.title,
    description: data.description || '',
    category: data.category,
    status: 'published',
    scheduledDate: null,
    publishedDate: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
    createdAt: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
    featured: !!data.featured,
    readTime: data.readTime || 5,
    affiliateProductIds: []
  };
  queue.push(entry);
  existingSlugs.add(slug);
  added.push(slug);
}

if (added.length > 0) {
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
  console.log('Reconciled', added.length, 'unregistered articles:', added.join(', '));
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    put('queue.json', JSON.stringify(queue, null, 2), {
      access: 'public', addRandomSuffix: false, allowOverwrite: true,
      contentType: 'application/json; charset=utf-8'
    }).then(() => console.log('queue.json synced to Blob')).catch(e => console.error('Blob sync failed:', e.message));
  }
} else {
  console.log('Queue reconciliation: all articles already registered, nothing to do.');
}
"
```

If any articles were reconciled, print a summary line: `→ reconciled N unregistered articles: <slug1>, <slug2>, ...`

This step is idempotent — running it when nothing is missing takes under 1 second.

---

## Step 1 — Research Trends, Then Plan 10 Distinct Assignments

### Step 1a — Trend Research (do this BEFORE planning topics)

Before picking any topics, spend time researching what is currently trending and gaining traction in the fitness, health, and wellness space. Use WebSearch and WebFetch to:

1. **Check what major fitness/health sites are publishing right now.** Search for recent articles (last 30–90 days) on sites like:
   - Healthline (`site:healthline.com fitness OR supplements OR workout 2025`)
   - Men's Health / Women's Health
   - Examine.com (supplement research summaries — fetch their human effect matrix pages)
   - Barbend, Garage Gym Reviews, T-Nation (strength/training)
   - PubMed / NIH for recent studies (`site:pubmed.ncbi.nlm.nih.gov 2024 2025`)

2. **Search for trending fitness topics broadly:**
   - "fitness trends 2025 2026"
   - "best supplements 2025"
   - "trending workouts 2025"
   - "new research [topic] 2025"
   - Check Reddit (r/fitness, r/strength_training, r/nutrition, r/supplements) for what practitioners are actively debating

3. **Note what's gaining traction:** new training methodologies (e.g. zone 2 cardio, Norwegian 4×4, blood flow restriction training, RIR-based programming, HIIT vs LISS debates), emerging supplements (e.g. tongkat ali, fadogia agrestis, NMN/NR for longevity, creatine HCl vs monohydrate, berberine), trending diets (e.g. protein-sparing modified fasts, carnivore refinements, GLP-1 diet adjustments), recovery modalities, longevity/healthspan topics.

Summarize the top 10–15 trending topic opportunities you discovered, then use that list to inform your assignment plan below.

### Step 1b — Plan 10 Distinct Assignments

Read `data/queue.json`. Using your trend research from Step 1a, plan **10 distinct (topic, category, format) assignments** that:
- Do NOT duplicate any existing `slug` or `title` in `data/queue.json`
- Collectively cover as many of the 6 categories as possible (home-workouts, supplements, diet-nutrition, weight-loss, muscle-building, wellness) — aim for ~2 per category across the batch if feasible
- **Prioritize trending, advanced, and timely topics** from your Step 1a research — avoid generic beginner topics that are already widely covered everywhere
- **Target an intermediate-to-advanced audience by default.** Assume the reader has been training or following their diet for 1+ years. Skip "what is X" basics. Go deep: advanced programming concepts, nuanced supplement science, performance optimization, research-backed specificity, edge cases, and common mistakes made by experienced trainees
- Use varied formats (Deep Dive, Advanced Guide, Research Breakdown, Protocol Guide, Data-Driven Comparison, Myth-Busting) — avoid generic "Beginner Guide" framing unless the topic itself is genuinely niche or emerging
- Mix article lengths: ~4 posts at 1,500–2,000 words (8–10 min read), ~4 posts at 2,500–3,500 words (12–18 min), ~2 posts at 4,000+ words (20+ min deep dives)
- **Assign a different structural pattern to each of the 10 posts** from this list: Contrarian Frame, Case Example First, Progressive Disclosure, Comparison Structure, Framework + Application, Data-Led / Research Breakdown. No pattern should repeat more than twice across the batch. Include this in each assignment as a `structuralPattern` field.
- **Pre-assign a tone profile** for each article — one of: [Direct/No-Nonsense, Conversational/Relatable, Investigative/Skeptical, Authoritative/Coach-Voice, Measured/Research-First]. No tone should repeat more than twice across the batch. Include as a `toneProfile` field in each assignment.

For each assignment, pre-decide: **topic, slug, category, format, audience, tone, target word count, trending angle (why this topic now / what makes it timely), and 3–5 affiliate product IDs**.

**Product IDs MUST be chosen AFTER reasoning about what the specific article topic needs** — see the Product Selection Rules section below.

Print the full 10-row plan as a numbered list (include target word count, trending angle, and chosen product IDs) so the run is auditable before dispatch.

---

## Product Selection Rules — MUST follow for every post

**Copy this entire section into every sub-agent briefing.**

### Rule 1 — Research the topic first
Before selecting any products, think through the article's key sections. Ask: *"If a reader finished this article and took action, what exact products would they realistically buy?"* A sleep article reader buys a magnesium supplement, sleep mask, or white noise machine — not protein powder. A pre-workout article reader buys a pre-workout — not a yoga mat.

### Rule 2 — Direct relevance only
Every `<AffiliateProductCard>` in the post MUST be mentioned naturally within the surrounding content. If you cannot write a sentence like "this is exactly what we recommend for [specific reason tied to the section]," the product does not belong in that post.

### Rule 3 — Price range diversity (required)
Every post MUST include:
- At least **one product under $25**
- At least **one product over $60**
- The rest can be mid-range

Do not use all mid-range products. Readers have different budgets.

**Premium vs Budget pairing (strongly preferred):** Where two products serve the same purpose at different price points, feature them as an explicit pair — a **"Best Overall"** (flagship/premium) and a **"Best Budget Pick"** (affordable alternative). Explain the trade-offs clearly so the reader can choose based on their budget. Example: Manduka PRO yoga mat (premium) paired with Gaiam Essentials mat (budget). This pairing approach should appear in at least one section per article.

### Rule 4 — Brand diversity
No more than **2 products from the same brand** per post. Vary brands across posts in the same batch.

### Rule 5 — Placement is IN the content, not appended below it
Place every `<AffiliateProductCard productId="..." />` component:
- Inside a "Best X for Y" or "Our Pick" callout block
- Inside a comparison or "What to Look For" section
- After a specific recommendation sentence like "For this, we recommend [product name], which [specific reason]."
- NEVER as a standalone block dropped below a generic paragraph that doesn't mention the product

### Rule 6 — Product quality standards (required)
Every product recommended in a post MUST be a high-quality, well-reviewed product:
- **Minimum 4.0 stars** average rating (4.5+ stars strongly preferred)
- **Minimum 500 customer reviews** (1,000+ preferred — high volume confirms the rating is reliable)
- Only recommend products you can genuinely justify as "best in class" or "best value" for the use case — not just filler to hit a product count
- When writing about the product, briefly mention WHY it is trusted (e.g. "with over 50,000 five-star reviews", "Amazon's #1 bestseller in creatine", "NSF Certified for sport") — this builds reader confidence
- Do NOT recommend a product solely because it is in the catalog; if a catalog product has weak reviews or is a poor fit, skip it and use a better-matched alternative

---

## Full Product Catalog (copy into every sub-agent briefing)

Organized by topic relevance. Choose products that match what the article actually covers.

### Protein / Whey
- `optimum-nutrition-gold-standard` — ON Gold Standard Whey, 24g protein, $30–$60 → post-workout, muscle building, protein intake
- `myprotein-impact-whey` — Dymatize ISO100 isolate, 25g protein, $35–$60 → lean muscle, cutting, low-fat protein
- `orgain-organic-protein` — Orgain plant-based protein, 21g, $20–$35 → vegan, dairy-free, plant protein
- `quest-protein-bars` — Quest bars 20g protein, $20–$30 → on-the-go protein, snacking, meal replacement
- `rxbar-protein-bars` — RXBAR whole food bars, 12g protein, $18–$28 → clean eating, whole food snacks

### Creatine / Pre-Workout / BCAAs
- `creatine-monohydrate-bulk` — BulkSupplements creatine, $20–$40 → strength, power, muscle building
- `cellucor-c4-preworkout` — C4 pre-workout, $30–$45 → energy, performance, beginner-friendly pre-workout
- `legion-pulse-preworkout` — Legion Pulse, 350mg caffeine, $45–$50 → clean pre-workout, experienced athletes
- `bcaa-xtend` — Xtend BCAAs 7g, $25–$40 → intra-workout, muscle recovery, endurance

### Vitamins / Health Supplements
- `thorne-multivitamin` — Thorne NSF Certified multi, $35–$45 → athletes, bioavailable vitamins
- `garden-of-life-multivitamin` — Garden of Life organic multi, $30–$40 → organic, whole food, general wellness
- `fish-oil-nordic-naturals` — Nordic Naturals Omega-3, 1280mg EPA+DHA, $30–$55 → inflammation, heart health, joint health
- `vitamin-d3-sports-research` — Vitamin D3+K2 5000IU, $15–$22 → bone density, immunity, testosterone, general health
- `magnesium-glycinate` — Doctor's Best magnesium glycinate, $12–$22 → sleep quality, muscle relaxation, recovery, stress
- `ashwagandha-ksm66` — Jarrow KSM-66 ashwagandha, $15–$25 → cortisol, stress, sleep, strength gains
- `melatonin-natrol` — Natrol melatonin 5mg, $8–$14 → sleep onset, jet lag, sleep cycle
- `collagen-vital-proteins` — Vital Proteins collagen peptides, $25–$45 → joint health, connective tissue, skin, recovery
- `turmeric-curcumin` — Sports Research turmeric+BioPerine, $18–$28 → inflammation, joint pain, recovery

### Sleep
- `sleep-mask-alaska-bear` — Alaska Bear silk sleep mask, $8–$15 → light blocking, sleep quality, travel
- `white-noise-machine` — LectroFan white noise machine, $45–$60 → sound masking, deep sleep, sleep environment

### Cardio / Fat Loss
- `jump-rope-wod-nation` — WOD Nation speed jump rope, $10–$18 → HIIT, cardio, fat loss, beginner-friendly
- `fitness-tracker-fitbit` — Fitbit Charge 6, $100–$160 → calorie tracking, heart rate, step counting, fat loss

### Recovery
- `foam-roller` — TriggerPoint GRID, $30–$40 → myofascial release, soreness, mobility
- `massage-gun-renpho` — RENPHO R3 mini massage gun, $40–$65 → deep tissue, recovery speed, post-workout
- `compression-socks` — Physix Gear compression socks 3-pack, $14–$22 → blood flow, soreness, endurance sports
- `epsom-salt-dr-teals` — Dr Teal's Epsom Salt, $8–$16 → magnesium soak, muscle soak, post-workout bath

### Home Gym / Equipment
- `resistance-bands-set` — Fit Simplify bands 5-pack, $10–$15 → home workouts, rehab, activation, budget-friendly
- `adjustable-dumbbells` — Bowflex SelectTech 552, 5–52.5 lbs, $300–$400 → home gym, strength training
- `pull-up-bar` — Iron Gym pull-up bar, $25–$35 → bodyweight, back, upper body
- `yoga-mat` — Manduka PRO yoga mat, $80–$120 → yoga, floor work, premium option
- `yoga-mat-budget` — Gaiam Essentials 10mm mat, $20–$30 → yoga, stretching, budget option
- `ab-roller` — Perfect Fitness Ab Carver Pro, $25–$40 → core, abs, home gym
- `kettlebell-cap` — CAP Cast Iron kettlebell, $15–$60 → full-body, functional strength, budget-friendly
- `push-up-handles` — Perfect Fitness push-up handles, $15–$25 → chest, upper body, calisthenics
- `weight-bench-flybird` — Flybird adjustable bench, $140–$200 → home gym, dumbbell press, upper body

### Nutrition / Kitchen
- `meal-prep-containers` — Prep Naturals glass containers 10-pack, $35–$50 → meal prep, diet adherence, food storage
- `food-scale-etekcity` — Etekcity digital food scale, $10–$16 → macro tracking, calorie counting, precision
- `nutribullet-blender` — NutriBullet Pro 900W, $60–$90 → protein shakes, smoothies, meal prep

---

## Step 1.5 — Pre-Flight: Ensure Affiliate Product Thumbnails

Before dispatching sub-agents, guarantee every product in `lib/affiliates.ts` has a WebP on disk so any `<AffiliateProductCard productId="..." />` renders a real image instead of a 404.

Run from the project root:

```
node scripts/fetch-product-thumbnails.mjs
```

The script is idempotent — it skips products whose `public/images/products/<id>.webp` already exists (~0.1s no-op). For any new product added since the last run, it scrapes the Amazon product page (`m.media-amazon.com/images/I/...` extracted from the `"hiRes"` JSON / `data-old-hires` / `data-a-dynamic-image` selectors), normalizes through `sharp` to a 600×600 white-bg WebP @ q90, and patches `lib/affiliates.ts` so successes resolve to `.webp` and any failures fall back to the existing SVG.

If the script returns a non-zero exit code, log the failed product IDs but **do not block the batch** — sub-agents that don't reference a failed product are unaffected, and the AffiliateProductCard component already falls back to `/images/products/placeholder.svg`. Re-run the script later with `--force --id <product-id>` to retry a specific failure.

---

## Step 2 — Dispatch 10 Parallel Sub-Agents

In **a single message**, issue 10 `Agent` tool calls (`subagent_type: "general-purpose"`) — one per assignment from Step 1. Sub-agents MUST run in parallel, not sequentially.

Each sub-agent prompt must be fully self-contained (sub-agents start with no conversation context). Include in every prompt:

1. **Assignment:** topic, slug, category, format, audience, tone profile, structural pattern, target word count, trending angle, and the 3–5 product IDs selected. Make sure `structuralPattern` and `toneProfile` are explicitly stated — sub-agents MUST follow them, not default to a generic structure.

2. **Scope restrictions — HARD RULES. Violating any of these fails the task.**

   **You MAY write to ONLY these files:**
   - `content/drafts/<slug>.mdx` (your one and only MDX file, using the exact slug in your assignment)
   - `content/articles/<slug>.mdx` (only as a copy of the draft above, in the publish step)

   **You MAY read (but NOT modify) these files when needed:**
   - `lib/affiliates.ts` — to confirm the productIds in your assignment are valid
   - `data/queue.json` — if you need to confirm your slug doesn't collide

   **You MAY use WebSearch and WebFetch freely** to research your topic before writing. This is required — see Content Rules (Sub-step D). Fetch real studies, authoritative health sites, examine.com summaries, Reddit threads, and recent articles from major fitness publications.

   **You MAY execute ONLY this command:**
   - `node scripts/generate-thumbnail.mjs --slug "<slug>" --title "<title>" --category <category>` from the project root. This script itself writes to `public/images/articles/<slug>*.webp` and rewrites the frontmatter of your own draft — that is allowed because it's scoped to your slug.

   **You MUST NOT touch any of these, ever:**
   - Anything in `lib/`, `app/`, `components/`, `scripts/`, `public/`, `assets/`, `node_modules/`
   - `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `.env*`, `.gitignore`, `eslint.config.mjs`, `postcss.config.mjs`
   - `.claude/` (skills, hooks, settings)
   - `data/queue.json` (read-only for you — the parent owns all writes to it)
   - Any MDX file whose slug is not yours — even to read, unless you're checking for duplicates

   If completing your task appears to require changing any file outside the writable whitelist above (e.g. "I need to refactor lib/articles.ts", "I need to add a new affiliate product", "I need to fix a bug in the component"), **STOP immediately** and return this error JSON instead of proceeding:
   ```json
   {"error": "out_of_scope", "slug": "<slug>", "reason": "<one-sentence description of what you'd need to change and why>"}
   ```
   The parent will escalate to the user. Do NOT attempt the out-of-scope edit.

3. **Output contract** — the sub-agent must:
   - Write the MDX article to `content/drafts/<slug>.mdx` with `image: ""` initially. Follow the exact frontmatter + content structure in §Content Rules below. Match the target word count from the assignment.
   - **Select a hero image using the Article-First Rating Method (required — follow EVERY step below without skipping):**

     **Step A — Read and internalize the article topic deeply.**
     Before searching for any image, answer these questions about your article:
     1. What is the SINGLE most specific physical subject of this article? (not the category — the exact thing)
        - "Zone 2 cardio" → the specific subject is a person cycling or running at a steady moderate pace, NOT a generic gym
        - "Tongkat ali testosterone" → the specific subject is the actual herbal supplement root or capsules, NOT a person flexing
        - "Blood flow restriction training" → the specific subject is someone using a BFR cuff/band on their arm while lifting
        - "Cold plunge vs sauna" → the specific subject is a person in a cold plunge or a wooden sauna interior
        - "Protein distribution" → the specific subject is food laid out in measured portions or a meal prep spread
        - "GLP-1 muscle preservation" → the specific subject is high-protein healthy food or a person eating a structured meal
     2. What would a reader expect to see when they click this article?
     3. What image would make the article feel instantly credible and specific — not stock-generic?

     Write down your answers before searching. This defines your search target.

     **Step B — Generate 3 distinct search queries.**
     Based on Step A, create 3 different search queries that target the SPECIFIC subject, from most specific to more general:
     - Query 1: most specific (e.g., `site:pexels.com/photo "blood flow restriction cuff arm"`)
     - Query 2: moderately specific (e.g., `site:pexels.com/photo "bfr training bicep curl"`)
     - Query 3: broadest fallback (e.g., `site:pexels.com/photo "resistance band arm workout"`)

     NEVER use generic queries like `"fitness"`, `"gym"`, `"health"`, `"exercise"`, `"supplements"` alone — these always return irrelevant stock photos.

     **Step C — Search and collect candidates.**
     Run all 3 queries using WebSearch. For each result, note:
     - The Pexels photo ID (number in the URL)
     - A one-sentence description of what the photo actually shows
     Collect at least 5 candidate photos total across all 3 queries.

     **Step D — Rate EVERY candidate on this 1–10 scale.**
     For each candidate photo, score it honestly:

     | Score | Meaning |
     |-------|---------|
     | 10 | Photo shows EXACTLY the specific subject of the article. Zero ambiguity. A reader would instantly know what the article is about just from the image. |
     | 8–9 | Photo is closely related but missing one specific element (e.g., shows the right exercise but wrong equipment) |
     | 6–7 | Photo is thematically related but generic (e.g., "person working out" for a specific exercise article) |
     | 4–5 | Photo is in the right category but doesn't represent the topic (e.g., running photo for a weightlifting article) |
     | 1–3 | Photo is vaguely related or completely wrong |

     Write out your rating AND your reasoning for each candidate. Example:
     - Photo 3838389 (shows person cycling on road bike outdoors): **9/10** — shows the exact activity for zone 2 cardio; missing only the "steady pace" context
     - Photo 1552242 (shows generic gym equipment): **4/10** — wrong subject entirely, doesn't represent zone 2 cardio

     **Step E — Apply the 10/10 rule.**
     Only select a photo rated **10/10**. If no candidate scores 10/10:
     - Generate 2 new, more specific search queries and repeat Steps C–D
     - You have up to 5 total search rounds to find a 10/10 image
     - If after 5 rounds you still have no 10/10, select the highest-rated candidate (must be ≥8/10) and note why it was the best available
     - NEVER select a photo rated below 8/10 under any circumstance — use `"image_status": "missing"` instead

     **Step F — Triple-check before downloading.**
     Before running the download command, verify:
     1. Does the photo show the SPECIFIC thing described in Step A? (yes/no)
     2. Would a reader who has NOT read the article understand what the article is about from this image alone? (yes/no)
     3. Is this image meaningfully different from a generic stock photo someone would use for any fitness article? (yes/no)
     All three answers must be YES. If any is NO, go back to Step D and pick a higher-rated candidate.

     **Step G — Gender balance check.**
     If the photo features a person: across the 10-article batch, aim for roughly equal gender representation. If the batch is running male-heavy, actively pick a female-featuring photo when both score equally. Note your choice.

     **Step H — Build the direct download URL and apply.**
     Pexels direct URL format:
     `https://images.pexels.com/photos/{ID}/pexels-photo-{ID}.jpeg?auto=compress&cs=tinysrgb&w=1920`
     Replace `{ID}` with your chosen photo ID.

     Run from the project root:
     ```
     node --env-file=.env.local scripts/ensure-images.mjs --slug "<slug>" --url "<pexels-direct-url>" --force
     ```
     This downloads the image, converts to 1600×1000 WebP, saves to `public/images/articles/<slug>.webp`, and updates the `image:`, `imageOg:`, `imagePinterest:` frontmatter fields in both `content/drafts/<slug>.mdx` and `content/articles/<slug>.mdx`.

     **Step I — Retry on download failure.**
     If the command fails (non-zero exit, 404, download error), pick your next highest-rated candidate and retry. Attempt up to 3 different photos before giving up. On final failure, set `"image_status": "missing"` in the returned JSON — but still complete the post.

   - Copy `content/drafts/<slug>.mdx` to `content/articles/<slug>.mdx` (publish).
   - **Do NOT touch `data/queue.json`** — race-unsafe with 10 parallel agents.
   - **Return** (as the final message to the parent) a single JSON object with shape:
     ```json
     {"id": "<short-unique-id>", "slug": "<slug>", "title": "<title>", "description": "<150-160 chars>", "category": "<category>", "status": "published", "scheduledDate": null, "publishedDate": "<ISO now>", "createdAt": "<ISO now>", "featured": false, "readTime": <int>, "affiliateProductIds": ["..."]}
     ```
     and nothing else (no prose, no markdown fences).

4. **Content Rules (Sub-step D):**

   **Research first — before writing a single word of the article.**

   Use WebSearch and WebFetch to gather real, current information on your assigned topic:
   - Search for recent studies or meta-analyses on PubMed/NIH. Fetch the abstract or summary and extract actual findings, effect sizes, dosages, and study populations.
   - Fetch 2–3 recent articles from Healthline, Examine.com, Men's Health, Barbend, T-Nation, or similar authoritative sources. Note their coverage gaps — angle your article at what they missed or understated.
   - Search Reddit (r/fitness, r/strength_training, r/nutrition, r/supplements) for practitioner debates and real-world nuance that academic sources miss.
   - If the topic is a supplement, fetch the Examine.com page for that compound and pull their evidence summary and human effect matrix data.
   - If the topic involves a training protocol, find the original program or study it derives from and pull the actual sets/reps/frequency/progression scheme.

   Write the article FROM this research — not from memory. Every specific claim, statistic, dosage, or protocol must trace back to something you actually fetched, not something recalled from training data. If you can't find a real source for a claim, don't make it.

   ---

   **CRITICAL: Source Citations & Expert Voice**

   Every article MUST cite real sources woven naturally into the prose — not just linked footnotes at the bottom. Follow these rules exactly:

   - **Narrative citation format:** "A 2024 meta-analysis in the *British Journal of Sports Medicine* (n=1,247) found that…" or "Research published in *Nutrients* confirmed…" — put the journal name and year directly in the sentence.
   - **Name experts with full context:** Never say "experts say." Say: "Dr. Stuart Phillips, a protein researcher at McMaster University, notes that…" or "According to exercise physiologist Andy Galpin, PhD, at Cal State Fullerton…" — the specificity signals real sourcing.
   - **Embed limitations honestly:** "The catch: most of these studies ran for only 8 weeks. Long-term data on this is still limited." Acknowledging what the research CAN'T tell you is a human signal, not a weakness.
   - **Integrate disagreement:** When experts or studies conflict, say so — "Not everyone agrees. A 2023 review in *JISSN* pushed back, arguing the effect size is too small to matter practically."
   - **Cite Reddit/practitioner community for real-world nuance:** "In practice, experienced lifters on r/strength_training consistently report that…" — validates claims against real-world use.
   - NEVER fabricate citations, author names, journals, or study findings. Only cite sources you actually fetched during research.

   ---

   **CRITICAL: Break the AI Formula — REQUIRED for every article**

   Google's AI detection flags content that follows the same structure every time. Each article MUST use a DIFFERENT structural pattern from the list below. Your assignment specifies the format — follow it. Do NOT default to "Definition → Explanation → Plan."

   **6 Available Structural Patterns (pick the one assigned, or if not assigned pick one that fits the topic):**

   1. **Contrarian Frame** — Open by challenging the mainstream take. "Everyone says X. The research says something different." Then build toward the nuanced truth. Best for: supplement myths, popular-but-wrong training advice.

   2. **Case Example First** — Open with a specific scenario or case. "Picture this: you've been training for 2 years, adding creatine, eating 200g protein, but your bench hasn't moved in 4 months. Here's what the data says about why." Build the explanation around the case. Best for: plateaus, troubleshooting, protocols.

   3. **Progressive Disclosure** — Follow the reader's actual decision process: "First, figure out X. Once you know X, here's how to choose Y. Given Y, the right Z for you is…" Each step narrows to the next. Best for: program design, supplement stacks, diet plans.

   4. **Comparison Structure** — Pit two or more approaches against each other with identical analysis for each. "Approach A: how it works / evidence / who it suits / trade-offs. Approach B: same treatment." Let the reader decide. Best for: creatine HCl vs monohydrate, HIIT vs LISS, diet comparisons.

   5. **Framework + Application** — Create a named, numbered system for the topic (e.g., "The 3-Variable Hypertrophy Model"). Define the framework first, then apply it to real examples. Best for: training design, nutrition planning, recovery protocols.

   6. **Data-Led / Research Breakdown** — Start with the most surprising finding from the research, then work outward to explain the full picture. "A 2024 review found that eating MORE protein than current guidelines actually increased lean mass retention by 23%. Here's the full picture." Best for: supplement science, nutrition research, emerging protocols.

   **Additional pattern-breaking requirements (apply to ALL articles):**

   - **Include ≥1 genuine contrarian take** — something that goes against standard advice. Back it with evidence. E.g., "Rest-pause sets may not be worth the joint stress for most lifters, despite the hype." Then explain your reasoning.
   - **Include ≥1 concrete case example or scenario** — a specific person, situation, or training context that grounds the advice. Can be real ("a study's intervention group averaged 38-year-old males…") or illustrative ("for someone eating 160g/day who's plateaued…").
   - **Include ≥1 explicit comparison** — two methods, products, approaches, or protocols side-by-side, with specific trade-off language.
   - **Include ≥1 editorial opinion or directional recommendation** — not just "it depends." Say: "Honestly, for most intermediate lifters, option B is the better starting point. Here's why." Hedging every recommendation into oblivion signals AI, not expertise.

   ---

   **CRITICAL: Original Data & Assets — REQUIRED for every article**

   Right now articles explain things. They don't CREATE anything. Every article MUST include at least TWO of the following:

   **1. Named Custom Framework**
   Create a branded mini-system for the article's main concept. Give it a name. Examples:
   - "The LBE Protein Ladder" (a 4-step escalation system for protein intake)
   - "The 3-Lever Hypertrophy Model" (volume, intensity, frequency as three adjustable levers)
   - "The PRIME Stack Method" (a supplement prioritization framework: Proven → Research-backed → Individual → Meaningful → Evaluated)
   The name makes it memorable and shareable. Define the framework clearly with numbered steps or tiers.

   **2. Decision Table or Scoring Matrix**
   Build a markdown table the reader can use to make a choice. Example for a creatine article:

   | Your Goal | Best Form | Dose | Timing |
   |-----------|-----------|------|--------|
   | Max strength | Monohydrate | 5g/day | Post-workout |
   | Low bloat priority | HCl | 1.5–2g/day | Pre-workout |
   | Budget-conscious | Monohydrate bulk | 5g/day | Anytime |

   Always include a "Best For" column so readers can self-select.

   **3. Protocol Card (numbered, copy-pasteable)**
   A specific, structured protocol the reader can screenshot and follow. Not explained in prose — formatted as a numbered list or table with exact values. Example:
   ```
   Zone 2 Base-Building Protocol (8-Week)
   Week 1–2: 3×30 min @ 60–65% max HR
   Week 3–4: 3×40 min @ 62–67% max HR
   Week 5–6: 4×40 min @ 63–68% max HR
   Week 7–8: 4×45 min @ 65–70% max HR
   Recovery: 48hr min between sessions
   Progress marker: Can hold conversation without breathlessness
   ```

   **4. Comparison Table with Original Analysis**
   Not just copied specs. Add a "LBE Take" or "Our Verdict" column that adds editorial value. Example:

   | Supplement | Evidence Grade | Effect Size | Best For | Skip If |
   |-----------|---------------|-------------|----------|---------|
   | Creatine | A (strong) | +5–8% strength | Everyone | Kidney disease Hx |
   | Beta-alanine | B (moderate) | Reduces fatigue in 4+ min efforts | Endurance athletes | Sprint/power athletes |
   | Citrulline | B (moderate) | Improved pump, -3% fatigue | Hypertrophy focus | Casual lifters |

   **5. "Myth vs Reality" Callout Block**
   Format as a clear MDX callout or blockquote section. Example:
   > **Myth:** You need to eat within 30 minutes post-workout or you lose your gains.
   > **Reality:** A 2013 meta-analysis found the anabolic window extends up to 4–6 hours around training. Total daily protein matters far more than timing for most people.

   Include 2–3 myth/reality pairs per article where myths exist in the topic.

   **6. Quick-Reference Cheat Sheet**
   A table-formatted "cheat sheet" that functions as a standalone reference. Give it a heading like "Quick Reference: Dosing Cheat Sheet" so readers bookmark it. Keep it scannable — max 6 rows, 4 columns.

   ---

   **CRITICAL: Human Tone Variation — REQUIRED in every article**

   Every article must shift tone AT LEAST 3 times across its length. These tones must appear in the same piece — not different articles having different tones:

   - **Conversational opener** (relatable, direct address, no jargon)
   - **Technical authority section** (precise, data-dense, mechanism-focused)
   - **Honest/cautionary moment** ("Here's where most people go wrong…" or "I'll be direct: this won't work for everyone")
   - **Motivational close** (action-oriented, confident, forward-looking)

   **Specific language rules to signal human writing:**
   - Use hedging where warranted: "may," "suggests," "the evidence points toward" — but only when the science actually is uncertain. Don't over-hedge confident findings.
   - Use colloquialisms at transition points: "Here's the thing though," "The short answer is yes, but," "Let's cut through the noise on this."
   - Use parenthetical asides for quick clarifications: "(that's roughly 0.7g per pound of bodyweight)" or "(think Romanian deadlifts or walking lunges)"
   - Use "you" framing to personalize recommendations: "If you're training 4+ days a week, the math changes."
   - Vary sentence length deliberately: mix short punchy sentences with longer technical explanations. A string of 8 identical-length sentences signals AI.
   - Vary paragraph length: some 1–2 sentence paragraphs for emphasis, some longer explanatory ones. Never all the same length.

   **What to AVOID (AI red flags):**
   - Never start 3+ consecutive sections with the same sentence structure
   - Never use "In conclusion," "In summary," or "It's important to note that"
   - Never write "As mentioned earlier" or "As noted above"
   - Never say "X is crucial for your fitness journey" or "your wellness goals"
   - Never open every H2 section with a definition of the term in the heading
   - Never end every paragraph with a one-line summary that restates the paragraph
   - Avoid over-polished transitions that sound like transitions: "Now that we've covered X, let's turn to Y"

   ---

   **Frontmatter:**
   - `title`, `description` (150–160 chars), `category`, `date` (today YYYY-MM-DD), `readTime`, `featured: false`, `image: ""`
   - Primary keyword in H1, first paragraph, ≥2 H2s, and meta description

   **Audience & depth — intermediate to advanced:**
   - Assume the reader has been training or following their diet for 1+ years. Skip all "what is X" and "why exercise matters" basics.
   - Go deep: explain the mechanism (how does this work physiologically or biochemically?), give specific protocols (exact sets/reps/rest/frequency/progression), give specific dosages and timing windows from the research you fetched, address edge cases and common mistakes made by experienced trainees.
   - Cite real studies inline using what you fetched: "A 2024 meta-analysis in the *British Journal of Sports Medicine* found…" — use real authors, journals, and years from actual fetched content, never fabricated citations.
   - Include actual numbers throughout: effect sizes, percentage improvements, mg/kg dosages, rep ranges with rationale, sample sizes. Vague language ("studies suggest it may help") is not acceptable.
   - Write to the target word count — do not truncate early.
   - Include ≥2 original data assets from the list above (framework, table, protocol, cheat sheet, etc.) per major section.

   **Product placement — follow all 6 Product Selection Rules provided above:**
   - Each `<AffiliateProductCard productId="..." />` must appear inside the specific section where that product is discussed
   - Introduce the product naturally: "If you're looking for [specific use case], [Product Name] delivers [specific reason]. Here's our pick:" — then place the card
   - NEVER place a card as a standalone block after an unrelated paragraph
   - NEVER recommend a product that isn't directly relevant to the article's topic

   **Structure:**
   - Use one of the 6 structural patterns above — NOT the default Definition → Explanation → Plan
   - Open with a hook tied to something you researched: a surprising study result, a contrarian finding, a specific performance gap, a scenario that places the reader in the problem
   - Use H2s for major sections, H3s for subsections
   - Include a "Key Takeaways" box near the top — specific numbers and protocols only (e.g. "5g creatine monohydrate daily increases 1RM by ~8% in trained athletes" not "creatine helps with strength")
   - Vary paragraph and sentence lengths deliberately throughout
   - End with `## Final Thoughts` — write it as a genuine editorial opinion, not a summary. Take a stance.

---

## Step 3 — Collect Sub-Agent Results

Each sub-agent returns one JSON object. Parse all 10 results.

- If a sub-agent failed or returned invalid JSON, note it in the final report but do NOT block the batch — proceed with the valid results.
- If two sub-agents somehow produced the same slug (race on topic picking), rename the later one with a `-v2` suffix before queueing (and rename the MDX file accordingly).
- If a result contains `"image_status": "missing"`, flag that slug in the final report under a **"Posts needing images"** section so the user can run `npm run ensure:images -- --slug <slug>` to backfill later.

---

## Step 4 — Append All 10 Entries to the Queue

Read `data/queue.json` once, append all valid entries from Step 3 in one pass, and write the file back. This is the only write to `queue.json` in the entire batch.

---

## Step 4.5 — Sync to Blob and Revalidate Home Page

After writing `data/queue.json`, sync the new posts to Vercel Blob and flush the Next.js cache so the home page "guides published" count updates immediately.

Run from the project root, passing all successful batch slugs as arguments:

```
node --env-file=.env.local scripts/sync-batch-to-blob.mjs <slug1> <slug2> ... <slugN>
```

The script exits cleanly if `BLOB_READ_WRITE_TOKEN` is not set (local-only mode — in that case `getAllArticles()` reads from the filesystem and the count already reflects new articles on the next page load). When the token IS set the script:
1. Uploads each article MDX to Blob at `articles/<slug>.mdx` (parallel)
2. Uploads the updated `data/queue.json` to Blob
3. POSTs to `${SITE_URL}/api/revalidate` to invalidate the `queue` cache tag and flush `/` and `/blog`

`SITE_URL` defaults to `http://localhost:3000`. Set it in `.env.local` to your Vercel deployment URL (e.g. `SITE_URL=https://leanbodyengine.com`) to revalidate the live site after each batch.

---

## Step 5 — Schedule Next Iteration

After the queue is updated, ALWAYS call:

```
ScheduleWakeup({
  delaySeconds: 60,
  prompt: "/create-post",
  reason: "create-post iteration <N+1> of 10"
})
```

Then print a one-line confirmation including the count of successful posts:
`→ batch N/10 complete — X posts published, next iteration scheduled in 60s`

---

## Step 6 — Finalizer Report (only runs when `iteration >= maxIterations`)

When entering this step, DO NOT create any posts. Instead:

1. Read `data/telemetry/post-runs.jsonl` (one JSON object per line).
2. Read `data/telemetry/state.json` for `startedAt` and `pricing`.
3. For each logged iteration, compute:
   - `cost_input   = (input_tokens / 1_000_000) * pricing.input_per_mtok_usd`
   - `cost_output  = (output_tokens / 1_000_000) * pricing.output_per_mtok_usd`
   - `cost_cache_w = (cache_creation_input_tokens / 1_000_000) * pricing.cache_write_per_mtok_usd`
   - `cost_cache_r = (cache_read_input_tokens / 1_000_000) * pricing.cache_read_per_mtok_usd`
   - `cost_total = sum`
4. Compute totals and per-iteration averages.
5. Write the full report to `data/telemetry/report-<timestamp>.md` AND print it to the chat as a Markdown table with:
   - Row per iteration: iteration #, input_tokens, output_tokens, cache_read, cache_write, cost_total_usd
   - Summary row: totals
   - Averages row: means
   - Notes: `startedAt`, `endedAt`, total elapsed wall time, pricing disclaimer (long-context tier above 200k applies 2× rates)
   - **Cost-per-post**: divide total cost by number of posts actually produced across all batches (iterations × 10 − any failures), so the per-post figure is honest.
6. Also list each iteration's generated slugs/titles (read from `data/queue.json`, the last `iterations × 10` entries) so the reader can see what was produced.

After printing, set `state.mode = "done"`, `state.hookShouldLog = false`, write state, and **do NOT reschedule**. End the turn.

---

## Override Behavior

If the user supplies arguments to `/create-post`, parse what they gave and apply to the batch as a shared constraint (e.g. same tone, same format, or a specific category focus). Never ask follow-up questions.

## Reset

If the user explicitly asks to reset or restart the loop, set `iteration: 0`, `mode: "idle"`, `startedAt: null`, `hookShouldLog: false` in state.json, truncate `post-runs.jsonl`, and confirm — do not auto-start a new run unless instructed.

## Notes on the 10x Fan-Out

- **Race safety:** sub-agents each write a unique MDX file (keyed by slug) and a unique thumbnail file. They never touch `queue.json`. Only the parent writes `queue.json` once per batch.
- **Cost:** each iteration now produces 10 posts instead of 1, so total cost per batch is roughly 10× — but each sub-agent runs with a fresh, small context (no cache accumulation), so per-post cost is typically lower than the sequential version.
- **Telemetry:** the Stop hook fires on the parent's turn end. Sub-agent token usage rolls up into the parent's transcript and is captured by the existing hook without modification.
