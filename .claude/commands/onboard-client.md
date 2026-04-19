# /onboard-client

Run the end-to-end customization pipeline for a new fitness-influencer
client. Use when the operator has a populated `client.config.json` at the
repo root (usually pasted from the Google Form's Apps Script exporter —
see `docs/ONBOARDING_FORM.md`).

**Default mode is autonomous** — don't ask the operator questions
unless a required field is missing or something is ambiguous. The
pipeline is deterministic: validate → rebrand → reset content → seed
starter commands → report checklist.

---

## Step 0a — Refuse to run against the template repo

**Before touching anything**, run:

```bash
git remote get-url origin
```

If the origin URL matches ANY of these patterns, **stop immediately** and
refuse to proceed:

- `nathankhoang/fitlife-hub` (with or without `.git`)
- `nathankhoang/seo-articles`
- `nathankhoang/leanbodyengine`

These are the flagship / template repositories. Running `/onboard-client`
here would rebrand leanbodyengine.com to the client and clear its
editorial content — catastrophic.

When this check fails, print exactly this message and stop:

> ⚠ You're about to onboard a client in the **template / flagship repo**.
> That would rebrand leanbodyengine.com to the new client and clear its
> content. Clone the template into a new directory for this client
> first, then re-run `/onboard-client` there:
>
> ```
> gh repo fork nathankhoang/fitlife-hub --clone --fork-name <client-slug>
> cd <client-slug>
> # drop client.config.json, then /onboard-client
> ```

Only proceed past this step if the origin URL is clearly a client repo,
or if there's no git origin at all (fresh clone / scratch repo).

The destructive scripts (`rebrand`, `reset:content`) have their own
hard-coded guard that will also refuse — but this pre-check catches the
mistake before you invoke anything.

---

## Step 0 — Locate and validate the config

Read `client.config.json` from the repo root.

If the file is missing:
- Tell the operator to either paste the form exporter's JSON output into
  `client.config.json`, or walk them through filling out
  `client.config.example.json` → `client.config.json` manually.
- Stop.

If present, validate that every required field in `lib/brand.ts` has a
value (the `Brand` / `BrandAuthor` / `BrandAffiliates` / `BrandContact`
types). Specifically check:

- `name`, `shortName`, `tagline`, `description`, `legalName` — all
  non-empty strings
- `author.name`, `author.bio`, `author.profileUrl` — non-empty
- `author.emitPersonSchema` — boolean
- `contact.email` — valid email format
- `affiliates.amazonTag` — non-empty string
- `socials` — array (may be empty)

Also inspect the operator-only `_operator` block that the form exporter
adds. Extract:

- `_operator.domain` — will become `NEXT_PUBLIC_SITE_URL`
- `_operator.amazonApproved` — gate; warn if not "Yes"
- `_operator.starterTopics` — seeds initial `/create-post` commands
- `_operator.starterProducts` — seeds `lib/affiliates.ts` additions
- `_operator.activeCategories`, `_operator.audience`, `_operator.cadence`,
  `_operator.newsletter`, `_operator.ga4Id`, `_operator.notes` — inform
  the final checklist

If any required field is missing, report the exact field path and stop
before making changes.

---

## Step 1 — Check for Amazon Associates gate

If `_operator.amazonApproved` is not "Yes, approved", warn loudly:

> **Amazon Associates is not yet approved.** Setup can continue, but
> affiliate links will earn nothing until approval (1–3 days typically).
> Amazon also requires genuine traffic within 180 days of approval or
> the account gets closed. Confirm the operator wants to proceed anyway,
> or pause until approval lands.

Ask the operator "Proceed with unapproved Amazon tag?" and wait for
confirmation. This is the only question you're allowed to ask in the
happy path.

---

## Step 2 — Run rebrand

```bash
npm run rebrand
```

The `rebrand.mjs` script reads `client.config.json` and writes
`lib/brand.ts`. It will error out on missing fields — you already
pre-validated, so this should succeed. If it errors, report the error
and stop.

After it succeeds, show the diff on `lib/brand.ts` for the operator to
sanity-check.

---

## Step 3 — Decide on content reset

Check whether this is a fresh site (the default assumption) or the
operator is preserving the template seed content.

- If `_operator.notes` or `_operator.existingContent` mentions keeping
  existing content, skip the reset and tell the operator manually.
- Otherwise run:

```bash
npm run reset:content -- --yes
```

This clears `lib/affiliates.ts` to an empty products map,
`lib/comparisons.ts` to an empty array, and `data/queue.json` to `[]`.
The script also requires a clean git state, so commit the rebrand diff
first if needed.

---

## Step 4 — Seed the initial content plan

Using `_operator.starterTopics` (one topic per line), output a batch of
ready-to-paste `/create-post` commands — one per topic, using the
client's declared audience (`_operator.audience`) and active categories
(`_operator.activeCategories`). Do NOT run them automatically — the
operator decides cadence.

Format each as a separate code block so the operator can copy them
one at a time:

```
/create-post <topic> — audience: <audience> — categories: <active categories joined>
```

Using `_operator.starterProducts`, output a list of affiliate catalog
entries (parsing each line as `Product name · Amazon URL · reason`). For
each, show the exact object the operator should paste into
`lib/affiliates.ts`. Do not modify that file automatically — the
operator needs to source images and decide IDs.

---

## Step 5 — Final checklist

Print a numbered checklist of the remaining manual steps, personalized
to this client's answers. Cover at minimum:

1. **Headshot** — if `author.photoUrl` is set, remind the operator to
   download from `_operator.headshotSourceUrl` and save to the path in
   `author.photoUrl` (normally `public/images/author/<slug>.webp`).
2. **Favicon + icons** — `public/favicon.ico`, `apple-icon.png`,
   `icon.png` — replace if the client sent branded assets.
3. **Vercel env vars** — list each one from the `docs/CLIENT_SETUP.md`
   step 3 table, populated with what we know:
   - `NEXT_PUBLIC_SITE_URL = https://<domain>`
   - `NEXT_PUBLIC_GA_ID = <_operator.ga4Id>` if provided
   - `BLOB_PUBLIC_BASE`, `BLOB_READ_WRITE_TOKEN`, `ADMIN_PASSWORD`,
     `CRON_SECRET` — operator generates / pulls from Vercel.
   - `RESEND_API_KEY` only if `_operator.newsletter` says yes and client
     has a key.
4. **Domain / DNS** — point the domain at Vercel.
5. **Vercel project access** — share the project with
   `_operator.vercelEmail`.
6. **GitHub repo access** — invite `_operator.githubUsername` as a
   collaborator.
7. **Starter articles** — paste the `/create-post` commands from Step 4
   (one or two at a time; don't overload).
8. **Affiliate catalog** — add the seeded products from Step 4 once images
   are sourced.
9. **About page body** — `app/about/page.tsx` has editorial copy that
   may need light editing to fit the client's voice beyond the
   auto-substituted name.
10. **Category pages** — default category descriptions in
    `app/category/[category]/page.tsx` → `categoryMeta` may need tweaks
    for the client's tone.
11. **First deploy** — run `git add -A && git commit && git push`.

At the very bottom of the checklist, also print:

- Client's target launch date (`_operator.launchDate`)
- Expected cadence (`_operator.cadence`)
- Anything flagged in `_operator.notes` or `_operator.avoidTopics`

---

## Rules

- **Don't ask questions unless a required field is missing** or the
  Amazon approval gate needs a decision. Every other choice defaults as
  described above.
- **Don't push to git, don't deploy, don't run `/create-post`** on
  behalf of the operator. Stage everything; let them execute.
- **Preserve `_operator` block in `client.config.json`.** It's metadata
  for later reference — scripts ignore it, but we might need it to
  re-run pieces of onboarding if things change.
- **Report clearly.** The operator is about to hand the site to a
  customer — a sloppy handoff erodes trust. Every action you take or
  skip must be visible in the session output.
