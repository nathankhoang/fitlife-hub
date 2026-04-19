// Common interface every platform adapter implements so the dispatcher and
// admin approval action don't need to know the platform-specific wire details.

import type { SocialPostEntry } from "../types";

export type PostResult = {
  /** The platform's own ID for the post (e.g. Facebook post id, IG media id). */
  platformPostId: string;
  /** Public URL to view the post on the platform. */
  platformPostUrl: string;
};

export type AdapterContext = {
  /** Entry being posted. Caption + imageBlobUrl are populated at this point. */
  entry: SocialPostEntry;
  /** Direct URL to the already-uploaded social image in Vercel Blob. */
  imageUrl: string;
  /** The article's public URL on leanbodyengine.com (for link previews / CTAs). */
  articleUrl: string;
};

export interface PlatformAdapter {
  post(ctx: AdapterContext): Promise<PostResult>;
}

export class AdapterError extends Error {
  constructor(
    message: string,
    public readonly platform: string,
    public readonly statusCode?: number,
    public readonly detail?: unknown,
  ) {
    super(message);
    this.name = "AdapterError";
  }
}
