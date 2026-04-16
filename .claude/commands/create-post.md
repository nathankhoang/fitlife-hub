# /create-post

You are helping the user create a new fitness blog post for FitLife Hub. Follow this exact sequence.

## Step 1 — Gather Requirements (ask all at once)

Ask the user these 6 questions in a single message. Number them clearly:

1. **Topic** — What is this post about? Give me the main keyword or topic (e.g. "best creatine for beginners", "HIIT workout plan", "keto diet guide")
2. **Post type** — Which format?
   - Review (in-depth product review)
   - How-to Guide (step-by-step instructions)
   - Listicle (Best X / Top X list)
   - Comparison (X vs Y)
   - Beginner Guide (comprehensive intro topic)
3. **Target audience** — Beginner / Intermediate / Advanced
4. **Tone** — Authoritative & data-driven / Conversational & motivating / Balanced
5. **Specific products** — Any specific products from the affiliate catalog you want featured? Or type "auto" to let me select based on the topic. Available products: Optimum Nutrition Gold Standard Whey, Dymatize ISO100, BulkSupplements Creatine, Cellucor C4 Pre-Workout, Legion Pulse Pre-Workout, Thorne Basic Nutrients Multivitamin, Garden of Life Sport Multivitamin, Fit Simplify Resistance Bands, Bowflex SelectTech Dumbbells, Iron Gym Pull-Up Bar, Manduka PRO Yoga Mat, TriggerPoint Foam Roller
6. **Publish timing** — Draft (save for later) / Schedule (give me a date: YYYY-MM-DD) / Publish Now

Wait for the user's answers before continuing.

---

## Step 2 — Select Affiliate Products

Using the user's topic and category, select the 3–5 most relevant affiliate products using this scoring guide:

**Product → Best-fit topics/categories:**
- ON Gold Standard Whey → protein intake, muscle building, post-workout recovery, supplements
- Dymatize ISO100 → lean muscle, cutting, protein isolate, post-workout, supplements
- BulkSupplements Creatine → creatine, strength, power, muscle building, bulking
- Cellucor C4 → pre-workout, energy, gym motivation, performance, supplements
- Legion Pulse → pre-workout, clean ingredients, natural, performance, supplements
- Thorne Multivitamin → overall health, vitamins, athlete nutrition, wellness, diet
- Garden of Life Multivitamin → organic, whole food, wellness, vitamins, athlete nutrition
- Fit Simplify Bands → home workouts, resistance training, bodyweight, rehab, glutes
- Bowflex Dumbbells → home gym, strength training, upper body, weightlifting
- Iron Gym Pull-Up Bar → pull-ups, back, upper body, bodyweight, home gym, calisthenics
- Manduka Yoga Mat → yoga, stretching, flexibility, floor workouts, wellness, pilates
- TriggerPoint Foam Roller → recovery, muscle soreness, mobility, wellness, stretching

If the user specified products in question 5, use those. Otherwise auto-select top 3–5 by relevance.

Show the user the selected products and their Amazon links. Ask: "These products will be featured in the post — proceed or would you like to swap any out?"

Wait for confirmation before writing.

---

## Step 3 — Generate the MDX Article

Write a complete, high-quality MDX blog post (1,000–2,000 words). Use this structure:

```
---
title: "[Full SEO Title]"
description: "[150-160 char meta description with primary keyword]"
category: "[one of: home-workouts | supplements | diet-nutrition | weight-loss | muscle-building | wellness]"
date: "[today's date as YYYY-MM-DD]"
readTime: [estimated minutes to read]
featured: false
image: "/images/articles/[slug].jpg"
---

[Intro paragraph — hook, promise, primary keyword in first 100 words]

## [H2 Section]

[Body text]

<AffiliateProductCard productId="[product-id]" />

## [H2 Section]

...

## Final Thoughts

[Conclusion with soft CTA to related articles or newsletter]
```

**Content rules:**
- Include the primary keyword in the H1 (title), first paragraph, at least 2 H2s, and meta description
- Place `<AffiliateProductCard productId="..." />` after a paragraph that naturally leads to the product (never cold-drop a card)
- Use H3s for sub-points within H2 sections
- No keyword stuffing — write for humans first
- Include at least one comparison, statistic, or expert tip per major section
- End with a clear next step for the reader

**Valid productId values:**
- `optimum-nutrition-gold-standard`
- `myprotein-impact-whey`
- `creatine-monohydrate-bulk`
- `cellucor-c4-preworkout`
- `legion-pulse-preworkout`
- `thorne-multivitamin`
- `garden-of-life-multivitamin`
- `resistance-bands-set`
- `adjustable-dumbbells`
- `pull-up-bar`
- `yoga-mat`
- `foam-roller`

---

## Step 4 — Write the Draft File

Generate a URL-friendly slug from the title (lowercase, hyphens, no special chars, max 60 chars).

Write the MDX content to: `content/drafts/[slug].mdx`

---

## Step 5 — Add to Queue

Add an entry to `data/queue.json` using this exact structure. Read the current file first, append the new entry, and write it back.

```json
{
  "id": "[generate a short unique id, e.g. timestamp-based: Date.now().toString(36)]",
  "slug": "[slug]",
  "title": "[post title]",
  "description": "[meta description]",
  "category": "[category]",
  "status": "[draft | scheduled | published]",
  "scheduledDate": "[ISO date string if scheduled, else null]",
  "publishedDate": "[ISO date string if published now, else null]",
  "createdAt": "[current ISO timestamp]",
  "featured": false,
  "readTime": [number],
  "affiliateProductIds": ["product-id-1", "product-id-2"]
}
```

If "Publish Now" was selected:
- Copy the MDX from `content/drafts/[slug].mdx` to `content/articles/[slug].mdx`
- Set `status: "published"` and `publishedDate` to now

---

## Step 6 — Report Back

Tell the user:

```
Post created: [title]
Status: [draft/scheduled/published]
Draft file: content/drafts/[slug].mdx
Queue: data/queue.json ✓
Admin view: localhost:3000/admin/queue
[If published]: Live at: localhost:3000/blog/[slug]
```
