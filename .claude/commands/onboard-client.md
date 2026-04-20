# /onboard-client

Run the end-to-end customization pipeline for a new fitness-influencer
client. Use when the operator has a populated `client.config.json` at
the repo root (usually pasted from the Apps Script exporter — see
`docs/ONBOARDING_FORM.md`).

**Default mode is autonomous** — don't ask the operator questions
unless a required field is missing, the Amazon gate needs a decision,
or something downstream fails. Run every automatable step without
pausing, then hand back a short personalized checklist of the
irreducibly-human items.

---

## Step 0a — Refuse to run against the template repo

Run:

```bash
git remote get-url origin
```

If the origin URL matches any of `nathankhoang/fitlife-hub`,
`nathankhoang/seo-articles`, or `nathankhoang/leanbodyengine` (with or
without `.git`), **stop immediately**. Print:

> ⚠ You're about to onboard a client in the **template / flagship
> repo**. That would rebrand leanbodyengine.com and clear its content.
> Clone the template into a new directory for this client first:
>
> ```
> gh repo fork nathankhoang/fitlife-hub --clone --fork-name <client-slug>
> cd <client-slug>
> # drop client.config.json, then /onboard-client
> ```

The destructive scripts have their own guard, but this pre-check
catches the mistake earlier.

---

## Step 0 — Locate and validate the config

Read `client.config.json` from the repo root. If missing, stop and tell
the operator to paste the form exporter output there first.

Validate that every required field has a value:

- `name`, `shortName`, `tagline`, `description`, `legalName` — non-empty
- `author.name`, `author.bio`, `author.profileUrl` — non-empty
- `author.emitPersonSchema` — boolean
- `contact.email` — valid email shape
- `affiliates.amazonTag` — non-empty
- `socials` — array (may be empty)

Also inspect `_operator` — these aren't validated (the form's UI
constraints handle that) but they drive the rest of the flow:

- `_operator.domain`, `_operator.amazonApproved`,
  `_operator.headshotSourceUrl`, `_operator.audience`,
  `_operator.activeCategories`, `_operator.starterTopics`,
  `_operator.starterProducts`, `_operator.cadence`,
  `_operator.vercelEmail`, `_operator.ga4Id`, `_operator.newsletter`,
  `_operator.launchDate`, `_operator.notes`, `_operator.avoidTopics`

Report the exact missing field if any required value is blank, and stop.

---

## Step 1 — Amazon Associates gate

If `_operator.amazonApproved` does not start with "Yes", show:

> ⚠ Amazon Associates is not yet approved. Setup can continue, but
> affiliate links earn nothing until approval (1–3 days), and Amazon
> requires real traffic within 180 days of approval.
>
> Proceed anyway? (yes / no)

Wait for the operator's answer. This is the **only question you ask**
in the normal path.

---

## Step 2 — Run rebrand

```bash
npm run rebrand
```

`rebrand.mjs` writes `lib/brand.ts`. Show the diff afterwards for
sanity-check.

---

## Step 3 — Reset editorial content

Unless `_operator.notes` or `_operator.existingContent` explicitly says
to keep the LeanBodyEngine seed content, run:

```bash
npm run reset:content -- --yes
```

This clears `lib/affiliates.ts` to an empty products map,
`lib/comparisons.ts` to an empty array, and `data/queue.json` to `[]`.

The script requires a clean worktree for the `--yes` apply, so commit
the rebrand diff first if needed:

```bash
git add lib/brand.ts && git commit -m "Apply brand config"
```

---

## Step 4 — Download author headshot

```bash
node scripts/onboarding/download-author-photo.mjs
```

Reads `_operator.headshotSourceUrl`, downloads through Drive/Dropbox
auto-normalization, resizes to 600×600 webp, saves to the path in
`author.photoUrl`.

If the script fails (private Drive link, file too big, etc.), report
the exact error message and add "operator downloads headshot manually"
to the final checklist. Don't block on it.

---

## Step 5 — Seed affiliate catalog

```bash
node scripts/onboarding/seed-affiliates-from-form.mjs --apply
```

Parses `_operator.starterProducts` line-by-line (format:
`Name · Amazon URL · reason`), appends new entries to
`lib/affiliates.ts`. Skips duplicates. Uses placeholder image paths —
the catalog is live but will show `placeholder.svg` until the operator
drops real product photos at `public/images/products/<id>.webp`.

The script prints a summary of added / skipped / duplicate products —
include that summary in your final report.

---

## Step 6 — Stage initial content

The proposal commits to "20 articles at launch." `/create-post`
generates 10 per invocation, so the plan is: paste batch 1 today,
batch 2 within 24–48h. See `docs/CLIENT_WORKFLOW.md` §3 for the full
pacing rationale.

Using `_operator.starterTopics` (one topic per line), produce a block
of ready-to-paste `/create-post` commands — one per topic, using
`_operator.audience` and `_operator.activeCategories`. Format each as
its own line in a single fenced code block so the operator can paste a
few at a time:

```
/create-post <topic> — audience: <audience> — categories: <active>
```

If `starterTopics` has fewer than 15 entries, tell the operator:
> After batch 1 is reviewed, ask Claude in this repo to suggest 10
> more cornerstone topics for the niche, avoiding duplicates of
> `_operator.starterTopics`. Then paste those as the second batch.

**Do NOT run `/create-post` automatically.** Each invocation generates
10 posts via ScheduleWakeup — running several in sequence could spiral
before the operator has reviewed any output. Staging the commands lets
them pace.

---

## Step 7 — Commit the onboarding changes

Collect the changes so far (brand config, content reset, headshot,
affiliate seed) into a single clean commit:

```bash
git add -A
git commit -m "Onboard <client-name>: apply brand config, seed content"
```

Report the commit SHA so the operator knows what got staged.

**Do NOT push yet.** The next step provisions Vercel so the domain
and env vars are ready *before* the first deploy.

---

## Step 7.5 — Provision Vercel infrastructure

Preview what the provisioner will do, then apply:

```bash
npm run onboard:provision           # dry-run plan
npm run onboard:provision -- --apply
```

`provision-client-infra.mjs` wraps `gh` + `vercel` CLIs to:
- create the Vercel project (`vercel project add <slug>`)
- link this dir and connect the GitHub origin
- create a Blob store (auto-wires `BLOB_READ_WRITE_TOKEN`)
- upload a ping file to derive and push `BLOB_PUBLIC_BASE`
- push `NEXT_PUBLIC_SITE_URL`, optional `NEXT_PUBLIC_GA_ID`,
  a generated `CRON_SECRET`, a generated `ADMIN_PASSWORD`,
  `RESEND_API_KEY` (if exported and newsletter=yes),
  `BEEHIIV_PUBLICATION_ID` (from `_operator.beehiivPublicationId` or
  env — without it, newsletters land in LBE's publication as a
  fallback), and `REPORT_RECIPIENT` (from `_operator.reportRecipient`
  or env — without it, monthly reports go to the client's public
  email)
- attach the custom domain and print the DNS records the operator
  must set at the registrar

**Preconditions:**
- `gh` and `vercel` must both be on `PATH` (on Windows the GitHub CLI
  installer does **not** add itself — see `docs/CLIENT_SETUP.md` for
  the one-time PATH fix).
- `gh auth login` and `vercel login` have both been run once on this
  machine.

If any of these are missing, the provisioner's preflight fails with a
clear message — surface it to the operator and stop. Do not try to
work around a missing CLI by shelling to an absolute path.

Capture the printed `ADMIN_PASSWORD`, `CRON_SECRET`, and
`BLOB_PUBLIC_BASE` in your final report — they are shown once.

If the operator wants to supply their own `ADMIN_PASSWORD`, a real
`RESEND_API_KEY`, a `BEEHIIV_PUBLICATION_ID`, or a `REPORT_RECIPIENT`,
they can export those before running:

```bash
ADMIN_PASSWORD='pick-your-own' \
  RESEND_API_KEY='re_...' \
  BEEHIIV_PUBLICATION_ID='pub_xxxxx' \
  REPORT_RECIPIENT='ops@yourfirm.com' \
  npm run onboard:provision -- --apply
```

Alternatively, add `beehiivPublicationId` and `reportRecipient` to
`_operator` in `client.config.json` — the provisioner reads from
there first, then env, then skips (with a checklist reminder).

**Do NOT push after this step.** Pushing triggers the first Vercel
deploy — the operator should still eyeball the dashboard first.

---

## Step 8 — Personalized checklist

Print a concise checklist of the remaining human-gated work, sourced
from the specific client's answers. Env vars, the domain attachment,
the Blob store, and the team-member invite are already done by
Step 7.5 — don't re-list them. Cover at minimum:

1. **DNS forwarding** — paste the DNS records printed by Step 7.5 to
   the client's registrar (only human-gated piece of the domain setup).
2. **RESEND_API_KEY** — if newsletter was requested and the operator
   didn't export the key before Step 7.5, add it now:
   `vercel env add RESEND_API_KEY production`
3. **Starter articles** — paste the `/create-post` commands from Step 6.
   Target 20 articles at launch: first batch today, second batch within
   24–48h. See `docs/CLIENT_WORKFLOW.md` §3.
4. **Product images** — for each product added in Step 5, drop a photo
   at `public/images/products/<id>.webp` and update priceRange + rating
5. **About page body** — `app/about/page.tsx` editorial copy may want
   light tweaks to match the client's voice
6. **Category descriptions** — `app/category/[category]/page.tsx` →
   `categoryMeta` may want tweaks
7. **First push** — once DNS is propagating and the operator has
   eyeballed the Vercel dashboard: `git push`
8. **Post-deploy sitemap submission** — once the site is reachable:
   `npm run onboard:submit-sitemap`. Pings Bing, submits to Bing
   Webmaster + IndexNow if keys are exported, and prints the one-time
   Google Search Console setup (OAuth verification, always human).
9. **Rich Results Test** — drop a sample article URL into
   https://search.google.com/test/rich-results to confirm schema
   renders correctly.

At the bottom, print the context block:

- Launch date target: `_operator.launchDate`
- Cadence: `_operator.cadence`
- Avoid topics: `_operator.avoidTopics`
- Client notes: `_operator.notes`

If the headshot download failed in Step 4, add "manually download from
`<_operator.headshotSourceUrl>`" at the top of the checklist.

Finally, remind the operator about the **ongoing** workflows (content
submission, revisions, launch batch pacing) documented in
`docs/CLIENT_WORKFLOW.md` — that doc is the reference for everything
that happens after onboarding.

---

## Rules

- **Don't ask questions unless genuinely blocked.** The Amazon gate is
  the one exception — every other decision defaults as specified.
- **Don't push, deploy, or run `/create-post` autonomously.** These
  have external consequences (the public site, 10-post generation).
- **Preserve `_operator` in `client.config.json`.** It's metadata the
  flow reads multiple times. Scripts ignore it; keep it for
  re-entrancy.
- **Report crisply.** Show each step's outcome as you go. The operator
  is about to hand this site to a customer — they need to trust what
  ran.
