// Dispatches a SocialPostEntry to the right platform adapter.
// Currently wired: instagram + facebook.
// Deferred: twitter (paid tier required), linkedin (user deferred).

import type { SocialPostEntry } from "../types";
import { facebookAdapter } from "./facebook";
import { instagramAdapter } from "./instagram";
import { AdapterError, type AdapterContext, type PlatformAdapter, type PostResult } from "./types";

export { AdapterError } from "./types";
export type { PostResult } from "./types";

const ADAPTERS: Partial<Record<SocialPostEntry["platform"], PlatformAdapter>> = {
  instagram: instagramAdapter,
  facebook: facebookAdapter,
};

export async function postToPlatform(ctx: AdapterContext): Promise<PostResult> {
  const adapter = ADAPTERS[ctx.entry.platform];
  if (!adapter) {
    throw new AdapterError(
      `No adapter wired for platform: ${ctx.entry.platform}`,
      ctx.entry.platform,
    );
  }
  return adapter.post(ctx);
}

export function articleUrlFor(slug: string): string {
  return `https://leanbodyengine.com/blog/${slug}`;
}
