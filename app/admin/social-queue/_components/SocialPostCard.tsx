import type { SocialPostEntry } from "@/lib/social/types";
import { SOCIAL_APPROVAL_TTL_HOURS, SOCIAL_REGENERATE_CAP } from "@/lib/social/types";
import { STRATEGIES } from "@/lib/social/strategies";
import {
  approvePostAction,
  regenerateAction,
  rejectAction,
} from "../actions";

function statusMeta(status: SocialPostEntry["status"]) {
  const map: Record<SocialPostEntry["status"], { label: string; className: string }> = {
    pending:           { label: "Generating…",      className: "bg-gray-100 text-gray-700" },
    generating:        { label: "Generating…",      className: "bg-gray-100 text-gray-700" },
    awaiting_approval: { label: "Awaiting approval", className: "bg-yellow-100 text-yellow-800" },
    approved:          { label: "Approved",          className: "bg-blue-100 text-blue-700" },
    posting:           { label: "Posting…",          className: "bg-blue-100 text-blue-700" },
    posted:            { label: "Posted",            className: "bg-green-100 text-green-700" },
    failed:            { label: "Failed",            className: "bg-red-100 text-red-700" },
    expired:           { label: "Expired",           className: "bg-gray-100 text-gray-500" },
  };
  return map[status];
}

function hoursSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60));
}

function isExpired(entry: SocialPostEntry): boolean {
  return (
    entry.status === "awaiting_approval" &&
    hoursSince(entry.updatedAt) >= SOCIAL_APPROVAL_TTL_HOURS
  );
}

export function SocialPostCard({ entry }: { entry: SocialPostEntry }) {
  const strategy = STRATEGIES[entry.platform];
  const expired = isExpired(entry);
  const effectiveStatus = expired ? "expired" : entry.status;
  const meta = statusMeta(effectiveStatus);
  const charCount = entry.caption?.length ?? 0;
  const overLimit = charCount > strategy.caption.maxChars;
  const regenDisabled = entry.regenerateCount >= SOCIAL_REGENERATE_CAP;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {strategy.label}
          </span>
          <span className="text-xs text-gray-300">·</span>
          <span className="text-xs text-gray-400">
            {strategy.image.width}×{strategy.image.height}
          </span>
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${meta.className}`}>
          {meta.label}
        </span>
      </div>

      <div className="aspect-[4/3] bg-gray-50 border-b border-gray-100 flex items-center justify-center">
        {entry.imageBlobUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.imageBlobUrl}
            alt=""
            className="w-full h-full object-contain"
          />
        ) : (
          <p className="text-xs text-gray-400">
            {entry.status === "pending" || entry.status === "generating"
              ? "rendering image…"
              : "no image yet"}
          </p>
        )}
      </div>

      <div className="p-4 space-y-3 flex-1 flex flex-col">
        {entry.hookLine && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
              Hook
            </p>
            <p className="text-sm text-gray-900 leading-snug">{entry.hookLine}</p>
          </div>
        )}

        {entry.caption && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Caption
              </p>
              <span className={`text-[10px] tabular-nums ${overLimit ? "text-red-600 font-semibold" : "text-gray-400"}`}>
                {charCount} / {strategy.caption.maxChars}
              </span>
            </div>
            <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 border border-gray-100 rounded p-2 max-h-48 overflow-y-auto">
              {entry.caption}
            </pre>
          </div>
        )}

        {entry.firstComment && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
              First comment (IG hashtag dump)
            </p>
            <p className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded p-2 break-words">
              {entry.firstComment}
            </p>
          </div>
        )}

        {entry.lastError && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">
            <strong className="font-semibold">Error:</strong> {entry.lastError.slice(0, 240)}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2 mt-auto">
          {entry.status === "awaiting_approval" && !expired && (
            <form action={approvePostAction.bind(null, entry.id)}>
              <button
                type="submit"
                className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 font-medium"
              >
                ✓ Approve
              </button>
            </form>
          )}

          {(entry.status === "awaiting_approval" || entry.status === "failed") && (
            <form action={regenerateAction.bind(null, entry.id)}>
              <button
                type="submit"
                disabled={regenDisabled}
                title={regenDisabled ? `Regenerate cap reached (${SOCIAL_REGENERATE_CAP}/${SOCIAL_REGENERATE_CAP})` : undefined}
                className={`text-xs px-3 py-1.5 rounded-md font-medium border ${
                  regenDisabled
                    ? "text-gray-400 border-gray-200 cursor-not-allowed"
                    : "text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                ♻ Regenerate ({entry.regenerateCount}/{SOCIAL_REGENERATE_CAP})
              </button>
            </form>
          )}

          {entry.status !== "posted" && (
            <form action={rejectAction.bind(null, entry.id)}>
              <button
                type="submit"
                className="text-xs text-red-600 hover:text-red-800 px-2 py-1.5"
              >
                Reject
              </button>
            </form>
          )}

          {entry.platformPostUrl && (
            <a
              href={entry.platformPostUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 underline ml-auto"
            >
              View on {strategy.label} →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
