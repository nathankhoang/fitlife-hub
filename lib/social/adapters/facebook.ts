// Posts a photo + caption + link to the LeanBodyEngine Facebook Page using
// the Graph API.
//
// Endpoint: POST /{page-id}/photos
// Docs: https://developers.facebook.com/docs/pages-api/posts/#publish-a-photo
//
// Env:
//   FB_PAGE_ID                — the numeric Page ID
//   META_PAGE_ACCESS_TOKEN    — long-lived Page Access Token

import { AdapterError, type AdapterContext, type PlatformAdapter, type PostResult } from "./types";

const GRAPH_VERSION = "v21.0";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new AdapterError(`${name} is not set`, "facebook");
  return v;
}

export const facebookAdapter: PlatformAdapter = {
  async post({ entry, imageUrl }: AdapterContext): Promise<PostResult> {
    const pageId = requireEnv("FB_PAGE_ID");
    const token = requireEnv("META_PAGE_ACCESS_TOKEN");
    if (!entry.caption) throw new AdapterError("caption missing", "facebook");

    const endpoint = `https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/photos`;
    const body = new URLSearchParams({
      url: imageUrl,
      message: entry.caption,
      access_token: token,
      published: "true",
    });

    const res = await fetch(endpoint, { method: "POST", body });
    const json = (await res.json()) as {
      post_id?: string;
      id?: string;
      error?: { message: string; code: number; type: string };
    };
    if (!res.ok || json.error) {
      throw new AdapterError(
        json.error?.message ?? `Facebook post failed: ${res.status}`,
        "facebook",
        res.status,
        json.error,
      );
    }

    // post_id is the canonical "<pageId>_<postId>" we can link to.
    const postId = json.post_id ?? json.id;
    if (!postId) throw new AdapterError("Facebook returned no post id", "facebook", res.status, json);

    return {
      platformPostId: postId,
      platformPostUrl: `https://www.facebook.com/${postId.includes("_") ? postId.replace("_", "/posts/") : `${pageId}/posts/${postId}`}`,
    };
  },
};
