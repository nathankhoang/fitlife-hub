// Runtime data model for the social posting pipeline. The durable state
// lives in social-queue.json on Vercel Blob; this file is the single
// source of truth for the shape of entries in that file.

import type { Platform } from "./strategies";

export type SocialPostStatus =
  /** Just enqueued. Image/caption still need to be generated. */
  | "pending"
  /** Worker is mid-generation for this entry. Transient, used to avoid double-runs. */
  | "generating"
  /** Image + caption filled in. Waiting for human to approve in admin UI. */
  | "awaiting_approval"
  /** Human approved. About to post to the platform. */
  | "approved"
  /** Platform API call in flight. */
  | "posting"
  /** Terminal: successfully posted to the platform. */
  | "posted"
  /** Terminal: platform API refused or attempts exhausted. */
  | "failed"
  /** Terminal: sat in awaiting_approval beyond the TTL. */
  | "expired";

/** Max attempts by the generation worker before we mark the entry failed. */
export const SOCIAL_GEN_MAX_ATTEMPTS = 3;
/** Max times a human can click "regenerate" in the admin UI per entry. */
export const SOCIAL_REGENERATE_CAP = 3;
/** How long an awaiting_approval entry can sit before it auto-expires. */
export const SOCIAL_APPROVAL_TTL_HOURS = 48;

export type SocialPostEntry = {
  id: string;
  articleSlug: string;
  articleTitle: string;
  articleDescription: string;
  articleCategory: string;
  articleCategoryLabel: string;
  platform: Platform;
  status: SocialPostStatus;

  // Filled in by the generation worker:
  caption: string | null;
  hookLine: string | null;
  /** IG only: the comma/space-joined hashtag dump to post as the first comment. */
  firstComment: string | null;
  /** Public Blob URL for the rendered social image. */
  imageBlobUrl: string | null;

  // Counters / error tracking:
  /** How many times the generation worker has tried this entry. */
  attempts: number;
  /** How many times a human has clicked "regenerate" via the admin UI. */
  regenerateCount: number;
  lastError: string | null;

  // Filled in after posting:
  postedAt: string | null;
  /** The platform's own ID for the post (for later edits/deletes). */
  platformPostId: string | null;
  /** Public URL to view the post on the platform. */
  platformPostUrl: string | null;

  createdAt: string;
  updatedAt: string;
};

export const SOCIAL_QUEUE_PATH = "social-queue.json";
export const SOCIAL_IMAGES_PREFIX = "social-images";
