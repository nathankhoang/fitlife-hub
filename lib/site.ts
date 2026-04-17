// Resolution order:
//   1. NEXT_PUBLIC_SITE_URL        — set this when a custom domain is live
//   2. VERCEL_PROJECT_PRODUCTION_URL — auto-set by Vercel to the project's
//      stable production hostname (e.g. fitlife-hub-omega.vercel.app)
//   3. http://localhost:3000        — local dev fallback
function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();
