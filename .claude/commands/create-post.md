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
- Use varied formats (Review, How-to Guide, Listicle, Comparison, Beginner Guide)

For each assignment, pre-decide: **topic, slug, category, format, audience (default Beginner), tone (default Balanced), 3–5 affiliate product IDs**.

Print the full 10-row plan as a numbered list so the run is auditable before dispatch.

**Valid productId values** (copy this into each sub-agent briefing):
- `optimum-nutrition-gold-standard`, `myprotein-impact-whey`, `creatine-monohydrate-bulk`, `cellucor-c4-preworkout`, `legion-pulse-preworkout`, `thorne-multivitamin`, `garden-of-life-multivitamin`, `resistance-bands-set`, `adjustable-dumbbells`, `pull-up-bar`, `yoga-mat`, `foam-roller`

**Product-to-topic scoring guide** (also copy into each sub-agent briefing):
- ON Gold Standard Whey → protein intake, muscle building, post-workout recovery, supplements
- Dymatize ISO100 (`myprotein-impact-whey` slot) → lean muscle, cutting, protein isolate
- BulkSupplements Creatine → creatine, strength, power, muscle building
- Cellucor C4 → pre-workout, energy, performance, supplements
- Legion Pulse → pre-workout, clean ingredients, natural, performance
- Thorne Multivitamin → overall health, vitamins, athlete nutrition, wellness
- Garden of Life Multivitamin → organic, whole food, wellness
- Fit Simplify Bands → home workouts, resistance training, bodyweight, rehab
- Bowflex Dumbbells → home gym, strength training, upper body
- Iron Gym Pull-Up Bar → pull-ups, back, upper body, bodyweight
- Manduka Yoga Mat → yoga, stretching, flexibility, floor workouts
- TriggerPoint Foam Roller → recovery, muscle soreness, mobility

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

1. **Assignment:** topic, slug, category, format, audience, tone, and the 3–5 product IDs selected.

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
   - Write the MDX article (1,000–2,000 words) to `content/drafts/<slug>.mdx` with `image: ""` initially. Follow the exact frontmatter + content structure in §Sub-step D below.
   - Run `node scripts/generate-thumbnail.mjs --slug "<slug>" --title "<title>" --category <category>` from the project root. The script pulls real stock photography from **Pexels** (requires `PEXELS_API_KEY` env var) and uses **Claude Haiku 4.5 vision** to pick the best of 4 candidates (requires `ANTHROPIC_API_KEY` env var). It writes hero/OG/Pinterest WebPs and updates frontmatter `image:`, `imageOg:`, `imagePinterest:`, plus `photoCredit:` / `photoCreditUrl:` for Pexels attribution.
   - **Image generation is required.** If the command exits non-zero or returns `"ok": false`, retry up to **2 more times** (3 attempts total) before giving up. On final failure, set `"image_status": "missing"` in the returned JSON so the parent can flag it — but still complete the post. Do **not** proceed with an empty `image:` field without attempting all retries.
   - Copy `content/drafts/<slug>.mdx` to `content/articles/<slug>.mdx` (publish).
   - **Do NOT touch `data/queue.json`** — race-unsafe with 10 parallel agents.
   - **Return** (as the final message to the parent) a single JSON object with shape:
     ```json
     {"id": "<short-unique-id>", "slug": "<slug>", "title": "<title>", "description": "<150-160 chars>", "category": "<category>", "status": "published", "scheduledDate": null, "publishedDate": "<ISO now>", "createdAt": "<ISO now>", "featured": false, "readTime": <int>, "affiliateProductIds": ["..."]}
     ```
     and nothing else (no prose, no markdown fences).

4. **Content rules (Sub-step D):**
   - Frontmatter fields: `title`, `description` (150–160 chars), `category`, `date` (today YYYY-MM-DD), `readTime`, `featured: false`, `image: ""`.
   - Primary keyword in H1, first paragraph, ≥2 H2s, and meta description.
   - Place `<AffiliateProductCard productId="..." />` only after a paragraph that naturally leads to it; never cold-drop.
   - ≥1 comparison, statistic, or expert tip per major section.
   - Use only productIds from the valid list (provided).
   - End with `## Final Thoughts` + soft CTA to related LeanBodyEngine articles or the newsletter.

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
