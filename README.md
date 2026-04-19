# LeanBodyEngine

An opinionated, evidence-first fitness and wellness content site. Static-first MDX articles, Vercel-hosted, with a built-in editorial queue that publishes on a schedule.

**Live:** [fitlife-hub-omega.vercel.app](https://fitlife-hub-omega.vercel.app)

> **Spinning this up for a new client?** See [`docs/CLIENT_SETUP.md`](docs/CLIENT_SETUP.md) — the end-to-end onboarding checklist. Rebranding is driven by `client.config.json` + `npm run rebrand`; everything identity-related reads from `lib/brand.ts`.

## Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Content**: MDX via `next-mdx-remote/rsc`, frontmatter via `gray-matter`
- **Storage**: [Vercel Blob](https://vercel.com/docs/vercel-blob) for articles, drafts, and the queue JSON
- **Caching**: tag-based via `fetch({ next: { tags } })` + `revalidateTag`
- **Styling**: Tailwind CSS v4
- **Scheduled publishing**: Vercel Cron hitting `/api/cron/process-scheduled`
- **Newsletter**: Resend (`/api/subscribe`)
- **Types**: TypeScript 5

## Architecture

- `content/articles/*.mdx` — source of truth for local dev and initial seed
- `content/drafts/*.mdx` — same, for unpublished work
- `data/queue.json` — array of `QueueEntry` rows tracking publish status
- `lib/articles.ts` — reads articles; uses Blob when `BLOB_PUBLIC_BASE` is set, falls back to local filesystem otherwise
- `lib/queue.ts` — reads queue via cached `fetch`; writes via `@vercel/blob` `put()` and `revalidateTag("queue", "max")`
- `lib/scheduler.ts` — `publishSlug` moves a draft from `drafts/` to `articles/` in Blob, updates queue status
- `app/admin/queue/*` — server components + server actions to publish, schedule, unschedule, and delete entries
- `app/api/cron/process-scheduled/route.ts` — Bearer-auth route invoked by Vercel Cron

### Read path (production)

```
GET /blog/[slug]
  → getArticleBySlug(slug)
    → fetch(`${BLOB_PUBLIC_BASE}/articles/${slug}.mdx`, { tags: [`article:${slug}`] })
    → gray-matter → <MDXRemote>
```

### Write path (admin publish)

```
publishPost(slug) [server action]
  → publishSlug(slug)
    → fetch draft blob → put('articles/${slug}.mdx') → del('drafts/${slug}.mdx')
    → updateQueueEntry(slug, { status: 'published', publishedDate })
    → revalidateTag('article:slug', 'draft:slug', 'queue', 'max')
  → revalidatePath('/', '/blog', '/blog/${slug}')
```

## Getting started

### Prerequisites

- Node 20 or later
- An account on [Vercel](https://vercel.com) (only if you want the full Blob-backed workflow)

### Local development (no Vercel required)

```bash
npm install
npm run dev
```

Without `BLOB_PUBLIC_BASE` set, `lib/articles.ts` and `lib/queue.ts` fall back to reading `content/` and `data/queue.json` from disk. Admin mutation actions will throw — use the CLI or the Blob-connected flow below for publishing.

### Full setup (Blob-backed)

```bash
npm install
vercel link                    # link to a Vercel project
# Create a Blob Store in the Vercel dashboard and connect it to the project.
vercel env pull .env.local     # pulls BLOB_READ_WRITE_TOKEN
npm run seed:blob              # uploads content/articles, content/drafts, data/queue.json
# Copy the printed Blob base URL into the BLOB_PUBLIC_BASE env var:
vercel env add BLOB_PUBLIC_BASE production --value "https://<hash>.public.blob.vercel-storage.com"
vercel env add BLOB_PUBLIC_BASE development --value "https://<hash>.public.blob.vercel-storage.com"
vercel env pull .env.local     # re-pull to get BLOB_PUBLIC_BASE locally
npm run dev
```

### Environment variables

| Variable | Required | Scope | Purpose |
|---|---|---|---|
| `BLOB_READ_WRITE_TOKEN` | prod + dev | auto-injected by Vercel Blob integration | authenticate `@vercel/blob` writes |
| `BLOB_PUBLIC_BASE` | prod (dev optional) | `https://<hash>.public.blob.vercel-storage.com` | base origin for Blob fetches |
| `CRON_SECRET` | prod | random 32-byte hex | Bearer token for `/api/cron/process-scheduled` |
| `RESEND_API_KEY` | optional | Resend API key | newsletter signups via `/api/subscribe` |
| `RESEND_AUDIENCE_ID` | optional | Resend audience ID | newsletter list target |
| `PEXELS_API_KEY` | optional | local tooling only | stock photos for `scripts/generate-thumbnail.mjs` |
| `ANTHROPIC_API_KEY` | optional | local tooling only | Claude vision ranking in thumbnail script |

## Scripts

```bash
npm run dev        # Next.js dev server
npm run build      # production build (requires BLOB_PUBLIC_BASE for generateStaticParams)
npm run start      # serve production build
npm run lint       # ESLint
npm run seed:blob  # one-shot: upload local content/ + queue.json to Blob (idempotent)
```

## Deploying

The project is wired to deploy via Vercel CLI:

```bash
vercel --prod
```

If connected to a GitHub repo, `git push` to the linked branch also triggers production deploys. Preview deploys run on every PR.

## Editorial workflow

1. Draft MDX files go in `content/drafts/` with frontmatter (`title`, `description`, `category`, `date`, `readTime`, `featured`, image fields).
2. A queue entry is added to `data/queue.json` with `status: "draft"` or `status: "scheduled"` and a scheduled date.
3. Run `npm run seed:blob` (or let the admin UI handle it) to push drafts + queue to Blob.
4. In `/admin/queue`, click Publish Now or schedule for later.
5. Vercel Cron at `/api/cron/process-scheduled` auto-publishes expired scheduled posts once per day (Hobby tier).

## Known limitations

- `/admin/queue` is currently unauthenticated. Add auth middleware before exposing to untrusted networks.
- Draft MDX blobs are stored under `access: 'public'` — slugs are guessable. Move to signed URLs or private access if drafts are sensitive.
- Vercel Hobby plan caps cron jobs at once per day, so scheduled-publish granularity is daily.

## License

[MIT](./LICENSE)
