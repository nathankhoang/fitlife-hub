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

## Step 1 — Plan 10 Distinct Assignments

Read `data/queue.json`. For the current batch, plan **10 distinct (topic, category, format) assignments** that:
- Do NOT duplicate any existing `slug` or `title` in `data/queue.json`
- Collectively cover as many of the 6 categories as possible (home-workouts, supplements, diet-nutrition, weight-loss, muscle-building, wellness) — aim for ~2 per category across the batch if feasible
- Use varied formats (Review, How-to Guide, Listicle, Comparison, Beginner Guide, Deep Dive)
- Mix article lengths: ~4 posts at 1,500–2,000 words (8–10 min read), ~4 posts at 2,500–3,500 words (12–18 min), ~2 posts at 4,000+ words (20+ min deep dives)

For each assignment, pre-decide: **topic, slug, category, format, audience (default Beginner), tone (default Balanced), target word count, and 3–5 affiliate product IDs**.

**Product IDs MUST be chosen AFTER reasoning about what the specific article topic needs** — see the Product Selection Rules section below.

Print the full 10-row plan as a numbered list (include target word count and chosen product IDs) so the run is auditable before dispatch.

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

1. **Assignment:** topic, slug, category, format, audience, tone, target word count, and the 3–5 product IDs selected.

2. **Scope restrictions — HARD RULES. Violating any of these fails the task.**

   **You MAY write to ONLY these files:**
   - `content/drafts/<slug>.mdx` (your one and only MDX file, using the exact slug in your assignment)
   - `content/articles/<slug>.mdx` (only as a copy of the draft above, in the publish step)

   **You MAY read (but NOT modify) these files when needed:**
   - `lib/affiliates.ts` — to confirm the productIds in your assignment are valid
   - `data/queue.json` — if you need to confirm your slug doesn't collide

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
   - Run `node scripts/generate-thumbnail.mjs --slug "<slug>" --title "<title>" --category <category>` from the project root. The script pulls real stock photography from **Pexels** (requires `PEXELS_API_KEY` env var) and uses **Claude Haiku 4.5 vision** to pick the best of 4 candidates (requires `ANTHROPIC_API_KEY` env var). It writes hero/OG/Pinterest WebPs and updates frontmatter `image:`, `imageOg:`, `imagePinterest:`, plus `photoCredit:` / `photoCreditUrl:` for Pexels attribution.
   - **Image generation is required.** If the command exits non-zero or returns `"ok": false`, retry up to **2 more times** (3 attempts total) before giving up. On final failure, set `"image_status": "missing"` in the returned JSON so the parent can flag it — but still complete the post. Do **not** proceed with an empty `image:` field without attempting all retries.
   - Copy `content/drafts/<slug>.mdx` to `content/articles/<slug>.mdx` (publish).
   - **Do NOT touch `data/queue.json`** — race-unsafe with 10 parallel agents.
   - **Return** (as the final message to the parent) a single JSON object with shape:
     ```json
     {"id": "<short-unique-id>", "slug": "<slug>", "title": "<title>", "description": "<150-160 chars>", "category": "<category>", "status": "published", "scheduledDate": null, "publishedDate": "<ISO now>", "createdAt": "<ISO now>", "featured": false, "readTime": <int>, "affiliateProductIds": ["..."]}
     ```
     and nothing else (no prose, no markdown fences).

4. **Content Rules (Sub-step D):**

   **Frontmatter:**
   - `title`, `description` (150–160 chars), `category`, `date` (today YYYY-MM-DD), `readTime`, `featured: false`, `image: ""`
   - Primary keyword in H1, first paragraph, ≥2 H2s, and meta description

   **Length & depth:**
   - Write to the target word count in your assignment — do not truncate early
   - Every major claim must be backed by a real statistic, study name, or expert guideline (cite inline, e.g. "A 2022 meta-analysis in the *Journal of Strength and Conditioning Research* found…")
   - Include ≥1 comparison table, numbered step list, or data-backed callout per major section
   - Avoid generic filler sentences — each paragraph must add specific, actionable information

   **Product placement — follow all 6 Product Selection Rules provided above:**
   - Each `<AffiliateProductCard productId="..." />` must appear inside the specific section where that product is discussed
   - Introduce the product naturally: "If you're looking for [specific use case], [Product Name] delivers [specific reason]. Here's our pick:" — then place the card
   - NEVER place a card as a standalone block after an unrelated paragraph
   - NEVER recommend a product that isn't directly relevant to the article's topic

   **Structure:**
   - Open with a hook — a relatable problem, surprising stat, or myth-busting statement
   - Use H2s for major sections, H3s for subsections
   - Include a "Key Takeaways" or "Quick Summary" box near the top for skimmers (use a markdown blockquote or bold list)
   - End with `## Final Thoughts` + soft CTA to related LeanBodyEngine articles or the newsletter

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
