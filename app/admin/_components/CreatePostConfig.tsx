"use client";

import { useState } from "react";

const CATEGORIES = [
  { id: "home-workouts", label: "Home Workouts" },
  { id: "supplements", label: "Supplements" },
  { id: "diet-nutrition", label: "Diet & Nutrition" },
  { id: "weight-loss", label: "Weight Loss" },
  { id: "muscle-building", label: "Muscle Building" },
  { id: "wellness", label: "Wellness" },
];

const RANDOM = "__random__";
const RANDOM_LABEL = "🎲 Randomize per article";

const FORMATS = [
  "Review",
  "How-to Guide",
  "Listicle",
  "Comparison",
  "Beginner Guide",
  "Deep Dive",
];
const TONES = ["Balanced", "Educational", "Conversational", "Authoritative"];
const AUDIENCES = ["Any", "Beginner", "Intermediate", "Advanced"];
const LENGTHS = [
  { id: "short", label: "Short (~800 words)" },
  { id: "standard", label: "Standard (~1500 words)" },
  { id: "long", label: "Long-form (~2500+ words)" },
];

type Mode = "topic" | "video" | "draft";

interface State {
  iteration: number;
  maxIterations: number;
  mode: string;
  startedAt: string | null;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export default function CreatePostConfig({
  initialState,
}: {
  initialState: State | null;
}) {
  // Shared
  const [mode, setMode] = useState<Mode>("topic");
  const [copied, setCopied] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  // Topic mode
  const [maxIterations, setMaxIterations] = useState(
    initialState?.maxIterations ?? 1,
  );
  const [categories, setCategories] = useState<string[]>([]);
  const [format, setFormat] = useState("");
  const [tone, setTone] = useState("");
  const [audience, setAudience] = useState("Any");
  const [length, setLength] = useState("standard");
  const [primaryKeyword, setPrimaryKeyword] = useState("");
  const [topic, setTopic] = useState("");

  // Video mode
  const [videoUrl, setVideoUrl] = useState("");
  const [videoCategory, setVideoCategory] = useState("supplements");
  const [videoSlug, setVideoSlug] = useState("");
  const [skipFrame, setSkipFrame] = useState(false);

  // Draft mode
  const [draftText, setDraftText] = useState("");
  const [draftCategory, setDraftCategory] = useState("supplements");
  const [draftSlug, setDraftSlug] = useState("");

  function encode(value: string): string {
    // The /create-post slash command treats `random` as "pick a different
    // value per iteration". The sentinel __random__ is purely UI-internal.
    return value === RANDOM ? "random" : value;
  }

  function buildTopicCommand() {
    const parts = ["/create-post"];
    if (topic.trim()) parts.push(topic.trim());
    if (primaryKeyword.trim())
      parts.push(`primary-keyword: ${primaryKeyword.trim()}`);
    if (categories.length) parts.push(`categories: ${categories.join(", ")}`);
    if (format) parts.push(`format: ${encode(format)}`);
    if (tone) parts.push(`tone: ${encode(tone)}`);
    if (audience !== "Any") parts.push(`audience: ${encode(audience)}`);
    parts.push(`length: ${encode(length)}`);
    return parts.join(" — ");
  }

  function buildVideoCommand() {
    if (!videoUrl.trim()) return "";
    const parts = [
      `npm run video:article --`,
      JSON.stringify(videoUrl.trim()),
      `--category ${videoCategory}`,
    ];
    if (videoSlug.trim()) parts.push(`--slug ${slugify(videoSlug.trim())}`);
    if (skipFrame) parts.push(`--skip-frame`);
    return parts.join(" ");
  }

  function buildDraftCommand() {
    if (!draftText.trim()) return "";
    const slug = draftSlug.trim() ? slugify(draftSlug.trim()) : "";
    const slugArg = slug ? ` --slug ${slug}` : "";
    // Heredoc-style — works in bash/zsh. Single-quoted EOF prevents shell
    // expansion of anything in the pasted text.
    return [
      `cat <<'EOF' | npm run text:article -- --category ${draftCategory}${slugArg}`,
      draftText.trim(),
      `EOF`,
    ].join("\n");
  }

  const currentCommand =
    mode === "topic"
      ? buildTopicCommand()
      : mode === "video"
        ? buildVideoCommand()
        : buildDraftCommand();

  const commandValid = currentCommand.trim().length > 0;

  async function copyCommand() {
    if (!commandValid) return;
    if (mode === "topic") {
      try {
        await fetch("/api/admin/state", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ maxIterations }),
        });
      } catch {
        /* silent */
      }
    }
    await navigator.clipboard.writeText(currentCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function resetState() {
    setResetting(true);
    try {
      await fetch("/api/admin/state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          iteration: 0,
          mode: "idle",
          startedAt: null,
          hookShouldLog: false,
        }),
      });
      setResetDone(true);
      setTimeout(() => setResetDone(false), 3000);
    } catch {
      /* silent */
    } finally {
      setResetting(false);
    }
  }

  function toggleCategory(id: string) {
    setCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  const pasteTarget =
    mode === "topic" ? "Claude Code terminal" : "your terminal (bash/zsh)";

  return (
    <div className="space-y-6">
      {/* Current state (Topic-only) */}
      {mode === "topic" && initialState && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center gap-6 text-sm">
          <div>
            <div className="text-white/40 text-xs mb-0.5">Status</div>
            <div
              className={`font-medium ${initialState.mode === "generate" ? "text-green-400" : "text-white/60"}`}
            >
              {initialState.mode}
            </div>
          </div>
          <div>
            <div className="text-white/40 text-xs mb-0.5">Progress</div>
            <div className="text-white font-medium">
              {initialState.iteration} / {initialState.maxIterations} iterations
            </div>
          </div>
          <div>
            <div className="text-white/40 text-xs mb-0.5">Posts generated</div>
            <div className="text-white font-medium">
              {initialState.iteration * 10}
            </div>
          </div>
          <div className="ml-auto">
            <button
              onClick={resetState}
              disabled={resetting}
              className="text-xs text-red-400/70 hover:text-red-400 border border-red-400/20 hover:border-red-400/40 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
            >
              {resetting ? "Resetting…" : resetDone ? "✓ Reset" : "Reset state"}
            </button>
          </div>
        </div>
      )}

      {/* Mode tabs */}
      <div className="flex gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
        <ModeTab id="topic" current={mode} onClick={setMode} label="Topic" hint="Autonomous — Claude picks the angle" />
        <ModeTab id="video" current={mode} onClick={setMode} label="Video" hint="YouTube / TikTok / Reel URL → article" />
        <ModeTab id="draft" current={mode} onClick={setMode} label="Draft" hint="Paste creator's raw text → article" />
      </div>

      {/* TOPIC mode */}
      {mode === "topic" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-white/60 text-xs font-medium mb-2">
                Batches (iterations) — {maxIterations * 10} posts total
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={maxIterations}
                  onChange={(e) => setMaxIterations(Number(e.target.value))}
                  className="flex-1 accent-[var(--color-primary)]"
                />
                <span className="text-white font-bold w-6 text-center">
                  {maxIterations}
                </span>
              </div>
            </div>

            <Field label="Topic override (optional)">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. focus on creatine reviews this batch"
                className={INPUT}
              />
            </Field>

            <Field label="Primary keyword (SEO target, optional)">
              <input
                type="text"
                value={primaryKeyword}
                onChange={(e) => setPrimaryKeyword(e.target.value)}
                placeholder="e.g. best creatine for beginners"
                className={INPUT}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Format">
                <select value={format} onChange={(e) => setFormat(e.target.value)} className={INPUT}>
                  <option value="">Any</option>
                  {FORMATS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                  <option value={RANDOM}>{RANDOM_LABEL}</option>
                </select>
              </Field>
              <Field label="Tone">
                <select value={tone} onChange={(e) => setTone(e.target.value)} className={INPUT}>
                  <option value="">Any</option>
                  {TONES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                  <option value={RANDOM}>{RANDOM_LABEL}</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Audience">
                <select value={audience} onChange={(e) => setAudience(e.target.value)} className={INPUT}>
                  {AUDIENCES.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                  <option value={RANDOM}>{RANDOM_LABEL}</option>
                </select>
              </Field>
              <Field label="Length">
                <select value={length} onChange={(e) => setLength(e.target.value)} className={INPUT}>
                  {LENGTHS.map((l) => (
                    <option key={l.id} value={l.id}>{l.label}</option>
                  ))}
                  <option value={RANDOM}>{RANDOM_LABEL}</option>
                </select>
              </Field>
            </div>

            <p className="text-xs text-white/40 leading-relaxed">
              Use <span className="text-white/60">🎲 Randomize</span> on any
              field to have <code className="bg-white/10 px-1 rounded">/create-post</code> pick a different value per article across a multi-batch run — useful for varying the editorial mix without repeating the same angle.
            </p>
          </div>

          <div>
            <label className="block text-white/60 text-xs font-medium mb-2">
              Category focus (optional)
            </label>
            <div className="space-y-1.5">
              {CATEGORIES.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={categories.includes(cat.id)}
                    onChange={() => toggleCategory(cat.id)}
                    className="accent-[var(--color-primary)] w-3.5 h-3.5"
                  />
                  <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                    {cat.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIDEO mode */}
      {mode === "video" && (
        <div className="space-y-4 max-w-2xl">
          <Field label="Video URL (YouTube, TikTok, Instagram, etc.)">
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className={INPUT}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select value={videoCategory} onChange={(e) => setVideoCategory(e.target.value)} className={INPUT}>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Slug (optional)">
              <input
                type="text"
                value={videoSlug}
                onChange={(e) => setVideoSlug(e.target.value)}
                placeholder="Auto-derived from video title"
                className={INPUT}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={skipFrame}
              onChange={(e) => setSkipFrame(e.target.checked)}
              className="accent-[var(--color-primary)] w-3.5 h-3.5"
            />
            <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
              Skip hero-frame extraction (use a custom image instead)
            </span>
          </label>
          <p className="text-xs text-white/40 leading-relaxed">
            Requires <code className="bg-white/10 px-1 rounded">yt-dlp</code> installed locally, plus{" "}
            <code className="bg-white/10 px-1 rounded">OPENAI_API_KEY</code> and{" "}
            <code className="bg-white/10 px-1 rounded">ANTHROPIC_API_KEY</code> in{" "}
            <code className="bg-white/10 px-1 rounded">.env.local</code>.
          </p>
        </div>
      )}

      {/* DRAFT mode */}
      {mode === "draft" && (
        <div className="space-y-4 max-w-3xl">
          <Field label="Creator-provided text">
            <textarea
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              placeholder="Paste what the creator wrote — captions, email, newsletter, rough draft, whatever. Aim for at least 200 words."
              rows={12}
              className={`${INPUT} font-mono text-xs leading-relaxed`}
            />
          </Field>
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>
              {draftText.trim().split(/\s+/).filter(Boolean).length} words
            </span>
            <span>Minimum 50 words for meaningful structuring</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select value={draftCategory} onChange={(e) => setDraftCategory(e.target.value)} className={INPUT}>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Slug (optional)">
              <input
                type="text"
                value={draftSlug}
                onChange={(e) => setDraftSlug(e.target.value)}
                placeholder="Auto-generated random slug"
                className={INPUT}
              />
            </Field>
          </div>
          <p className="text-xs text-white/40 leading-relaxed">
            Requires <code className="bg-white/10 px-1 rounded">ANTHROPIC_API_KEY</code> in{" "}
            <code className="bg-white/10 px-1 rounded">.env.local</code>. Claude preserves the creator&apos;s voice and adds SEO structure — it will never add claims they didn&apos;t write.
          </p>
        </div>
      )}

      {/* Generated command */}
      <div className="bg-black/40 border border-white/10 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/40 text-xs">
            Paste this into {pasteTarget}
          </span>
          <button
            onClick={copyCommand}
            disabled={!commandValid}
            className="text-xs bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:bg-white/10 disabled:text-white/30 text-white px-3 py-1.5 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
          >
            {copied ? "✓ Copied!" : "Copy command"}
          </button>
        </div>
        <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap break-words">
          {commandValid
            ? currentCommand
            : mode === "video"
              ? "(paste a video URL above)"
              : mode === "draft"
                ? "(paste creator text above)"
                : ""}
        </pre>
      </div>
    </div>
  );
}

const INPUT =
  "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] [&>option]:bg-[#0f172a] [&>option]:text-white";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-white/60 text-xs font-medium mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

function ModeTab({
  id,
  current,
  onClick,
  label,
  hint,
}: {
  id: Mode;
  current: Mode;
  onClick: (m: Mode) => void;
  label: string;
  hint: string;
}) {
  const active = current === id;
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={
        "flex-1 px-4 py-2.5 rounded-md text-left transition-colors " +
        (active ? "bg-[var(--color-primary)] text-white" : "text-white/60 hover:text-white/90 hover:bg-white/5")
      }
    >
      <div className="text-sm font-semibold">{label}</div>
      <div className={`text-xs mt-0.5 ${active ? "text-white/80" : "text-white/40"}`}>
        {hint}
      </div>
    </button>
  );
}
