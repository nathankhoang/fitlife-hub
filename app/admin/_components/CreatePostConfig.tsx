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

const FORMATS = ["Review", "How-to Guide", "Listicle", "Comparison", "Beginner Guide", "Deep Dive"];
const TONES = ["Balanced", "Educational", "Conversational", "Authoritative"];

interface State {
  iteration: number;
  maxIterations: number;
  mode: string;
  startedAt: string | null;
}

export default function CreatePostConfig({ initialState }: { initialState: State | null }) {
  const [maxIterations, setMaxIterations] = useState(initialState?.maxIterations ?? 1);
  const [categories, setCategories] = useState<string[]>([]);
  const [format, setFormat] = useState("");
  const [tone, setTone] = useState("");
  const [topic, setTopic] = useState("");
  const [copied, setCopied] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  function buildCommand() {
    const parts = ["/create-post"];
    if (topic.trim()) parts.push(topic.trim());
    if (categories.length) parts.push(`categories: ${categories.join(", ")}`);
    if (format) parts.push(`format: ${format}`);
    if (tone) parts.push(`tone: ${tone}`);
    return parts.join(" — ");
  }

  async function copyCommand() {
    // First update maxIterations in state.json
    try {
      await fetch("/api/admin/state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxIterations }),
      });
    } catch {
      // silent — API may not be available in production
    }
    await navigator.clipboard.writeText(buildCommand());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function resetState() {
    setResetting(true);
    try {
      await fetch("/api/admin/state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iteration: 0, mode: "idle", startedAt: null, hookShouldLog: false }),
      });
      setResetDone(true);
      setTimeout(() => setResetDone(false), 3000);
    } catch {
      // silent
    } finally {
      setResetting(false);
    }
  }

  function toggleCategory(id: string) {
    setCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  return (
    <div className="space-y-6">
      {/* Current state */}
      {initialState && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center gap-6 text-sm">
          <div>
            <div className="text-white/40 text-xs mb-0.5">Status</div>
            <div className={`font-medium ${initialState.mode === "generate" ? "text-green-400" : "text-white/60"}`}>
              {initialState.mode}
            </div>
          </div>
          <div>
            <div className="text-white/40 text-xs mb-0.5">Progress</div>
            <div className="text-white font-medium">{initialState.iteration} / {initialState.maxIterations} iterations</div>
          </div>
          <div>
            <div className="text-white/40 text-xs mb-0.5">Posts generated</div>
            <div className="text-white font-medium">{initialState.iteration * 10}</div>
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

      {/* Config */}
      <div className="grid grid-cols-2 gap-6">
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
                className="flex-1 accent-[#059669]"
              />
              <span className="text-white font-bold w-6 text-center">{maxIterations}</span>
            </div>
          </div>

          <div>
            <label className="block text-white/60 text-xs font-medium mb-2">Topic override (optional)</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. focus on creatine reviews this batch"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#059669]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-white/60 text-xs font-medium mb-2">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#059669]"
              >
                <option value="">Any</option>
                {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-white/60 text-xs font-medium mb-2">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#059669]"
              >
                <option value="">Any</option>
                {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-white/60 text-xs font-medium mb-2">Category focus (optional)</label>
          <div className="space-y-1.5">
            {CATEGORIES.map((cat) => (
              <label key={cat.id} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={categories.includes(cat.id)}
                  onChange={() => toggleCategory(cat.id)}
                  className="accent-[#059669] w-3.5 h-3.5"
                />
                <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                  {cat.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Generated command */}
      <div className="bg-black/40 border border-white/10 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/40 text-xs">Paste this into Claude Code terminal</span>
          <button
            onClick={copyCommand}
            className="text-xs bg-[#059669] hover:bg-[#047857] text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            {copied ? "✓ Copied!" : "Copy command"}
          </button>
        </div>
        <code className="text-green-400 text-sm font-mono">{buildCommand()}</code>
      </div>
    </div>
  );
}
