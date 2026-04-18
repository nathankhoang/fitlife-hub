// Posts an image + caption to the LeanBodyEngine Instagram Business account
// using the Instagram Graph API.
//
// Two-step flow:
//   1. POST /{ig-user-id}/media        → creates a media container (returns container id)
//   2. POST /{ig-user-id}/media_publish → publishes the container (returns media id)
//
// Notes:
//   - Instagram requires the image_url to be publicly reachable JPEG or PNG.
//     WebP is NOT accepted (at time of writing). The worker uploads a JPEG
//     version to Blob for this reason.
//   - The IG Business account must be linked to the FB Page whose access
//     token is in META_PAGE_ACCESS_TOKEN.
//
// Docs: https://developers.facebook.com/docs/instagram-platform/content-publishing

import { AdapterError, type AdapterContext, type PlatformAdapter, type PostResult } from "./types";

const GRAPH_VERSION = "v21.0";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new AdapterError(`${name} is not set`, "instagram");
  return v;
}

async function createContainer(
  igUserId: string,
  token: string,
  imageUrl: string,
  caption: string,
): Promise<string> {
  const endpoint = `https://graph.facebook.com/${GRAPH_VERSION}/${igUserId}/media`;
  const body = new URLSearchParams({
    image_url: imageUrl,
    caption,
    access_token: token,
  });
  const res = await fetch(endpoint, { method: "POST", body });
  const json = (await res.json()) as { id?: string; error?: { message: string } };
  if (!res.ok || !json.id) {
    throw new AdapterError(
      json.error?.message ?? `IG create-container failed: ${res.status}`,
      "instagram",
      res.status,
      json,
    );
  }
  return json.id;
}

async function publishContainer(
  igUserId: string,
  token: string,
  containerId: string,
): Promise<string> {
  const endpoint = `https://graph.facebook.com/${GRAPH_VERSION}/${igUserId}/media_publish`;
  const body = new URLSearchParams({
    creation_id: containerId,
    access_token: token,
  });
  const res = await fetch(endpoint, { method: "POST", body });
  const json = (await res.json()) as { id?: string; error?: { message: string } };
  if (!res.ok || !json.id) {
    throw new AdapterError(
      json.error?.message ?? `IG publish failed: ${res.status}`,
      "instagram",
      res.status,
      json,
    );
  }
  return json.id;
}

async function getPermalink(mediaId: string, token: string): Promise<string | null> {
  // Best-effort fetch of the public permalink. If this fails we still return a
  // constructed URL from media id.
  try {
    const endpoint = `https://graph.facebook.com/${GRAPH_VERSION}/${mediaId}?fields=permalink&access_token=${encodeURIComponent(token)}`;
    const res = await fetch(endpoint);
    if (!res.ok) return null;
    const json = (await res.json()) as { permalink?: string };
    return json.permalink ?? null;
  } catch {
    return null;
  }
}

export const instagramAdapter: PlatformAdapter = {
  async post({ entry, imageUrl }: AdapterContext): Promise<PostResult> {
    const igUserId = requireEnv("IG_USER_ID");
    const token = requireEnv("META_PAGE_ACCESS_TOKEN");
    if (!entry.caption) throw new AdapterError("caption missing", "instagram");

    const containerId = await createContainer(igUserId, token, imageUrl, entry.caption);
    const mediaId = await publishContainer(igUserId, token, containerId);
    const permalink = await getPermalink(mediaId, token);

    return {
      platformPostId: mediaId,
      platformPostUrl: permalink ?? `https://www.instagram.com/p/${mediaId}/`,
    };
  },
};
