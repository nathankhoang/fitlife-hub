# Ongoing client workflow

After a client is onboarded (`/onboard-client` has run, site is live), this
is the day-to-day playbook for keeping the engagement running. Three
recurring workflows:

1. **Content submission** — how the client gets their ideas into articles
2. **Revisions** — how to edit a published article at a client's request
3. **Launch batch** — how to hit "20 articles at launch" within the first week

---

## 1. Content submission

The proposal promises: *"Share your posts with us and we turn them into full
articles."* The operator-side flow for that:

### Channels

In order of preference:

1. **Email forward** — client forwards their own Instagram/TikTok post,
   podcast clip, voice memo, or a blog idea to a shared inbox
   (e.g., `content@<brand>.com` or `hello@<brand>.com`, whichever is
   the client's public email). This is the path the form collects as
   `contact.email`, so the client already knows it.
2. **Shared Google Drive folder** — for clients who generate a lot of
   voice memos or video, spin up a Drive folder `<Brand> — Content
   Inbox` and share it with the client (view + upload). Operator polls
   it 1–2× per week.
3. **Direct DM / Slack** — only for high-touch Full Management clients
   who already have a shared channel.

Pick ONE per client and tell them at onboarding. Channel-sprawl is the
fastest way to lose ideas.

### Turning content into articles

The two scripts are already wired — pick based on source type:

**Video (Instagram reel, TikTok, YouTube short, podcast clip):**
```bash
npm run video:article -- <url>
```
Runs `yt-dlp` → Whisper transcription → Claude structural pass → MDX
draft. Output lands in `content/drafts/`. Preserves the client's voice
(Claude is framed as a structural editor, not a rewriter).

**Text (voice memo transcript, email, blog idea, outline):**
```bash
npm run text:article
# then paste the text into stdin, Ctrl-D to close
# OR
npm run text:article -- --file ./input.txt
```

After either script finishes:
1. Open the draft in `content/drafts/<slug>.mdx`
2. Review — fix anything Whisper mis-transcribed, check fact claims,
   add affiliate product callouts if relevant
3. Commit the draft, push, it appears in `/admin/queue` as a draft
4. In admin: set a publish date OR click Publish to send immediately

---

## 2. Revisions

The proposal allows **up to 2 rounds of revisions** per article before
launch, and unlimited "small fixes" after. Current workflow:

### "Please rewrite the creatine article to lead with the dose"

1. Locate the article: `content/articles/<slug>.mdx` (published) or
   `content/drafts/<slug>.mdx` (pre-publish)
2. Edit directly — the MDX is plain Markdown with inline React
   components (`<AffiliateProductCard>`, `<Callout>`). Don't touch
   frontmatter unless the client asked to change the title/description.
3. Commit with a clear message:
   ```
   git commit -m "Revise creatine-timing: lead with the 3–5g dose"
   ```
4. Push. Vercel redeploys, the change goes live within a minute.

### "This article's wrong — scrap it and redo"

Use `/create-post` with the updated brief. Delete the old MDX from
`content/articles/` before pushing so you don't end up with two articles
competing for the same query.

### Tracking revision count

No built-in tracker yet. For Full Management clients who might push past
the 2-round limit, note revision requests in a `REVISIONS.md` at the
client repo root. If they hit 3+ rounds, that's a scope conversation,
not a silent workflow.

---

## 3. Launch batch — 20 articles in the first week

The proposal says "20 articles at launch." `/create-post` generates 10
per invocation. Plan for running it twice:

### Day 1 (onboarding day)

`/onboard-client` stages the first batch of `/create-post` commands
from `_operator.starterTopics`. Paste them in pairs:

```
/create-post <topic 1> — audience: <audience> — categories: <cats>
/create-post <topic 2> — audience: <audience> — categories: <cats>
```

After each batch of 5 starter topics fires, you'll have 10 articles
generating via `ScheduleWakeup`. Let them finish (30–60 min), review,
approve.

### Day 2–3 (second batch)

If `starterTopics` had fewer than 15 entries, ask Claude in the client
repo:
> Suggest 10 more cornerstone article topics for this niche — avoid
> duplicates of the starterTopics in client.config.json, and match the
> client's stated `_operator.audience`.

Then paste those as another round of `/create-post` commands. Target
20 total before DNS propagates / the first `git push` goes live.

### Why pace it

`/create-post` uses `ScheduleWakeup` with rate-limited background
generation. Firing 20+ commands in an hour can hit API quotas or
exhaust cached context. Two batches a day is the sweet spot.

---

## Quick reference

| Situation | Command / file |
|---|---|
| Client forwarded an Instagram reel | `npm run video:article -- <url>` |
| Client sent a voice memo transcript | `npm run text:article -- --file transcript.txt` |
| Small edit to a published article | Edit `content/articles/<slug>.mdx`, commit, push |
| Replace a bad article entirely | Delete MDX + regenerate via `/create-post` |
| Add/swap an affiliate product | Edit `lib/affiliates.ts`, commit, push |
| Check what's in the queue | Open `/admin/queue` on the live site |
| Monthly report | Automatic on 1st of month (via `vercel.json` cron) |
