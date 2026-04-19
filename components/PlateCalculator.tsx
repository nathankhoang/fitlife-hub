"use client";

import { useMemo, useState } from "react";

type Units = "lb" | "kg";

type PlateSpec = {
  weight: number;
  color: string;
  label: string;
  height: number; // px, for the visual
};

const PLATES_LB: PlateSpec[] = [
  { weight: 45, color: "#1e3a8a", label: "45", height: 96 },
  { weight: 35, color: "#475569", label: "35", height: 82 },
  { weight: 25, color: "#047857", label: "25", height: 68 },
  { weight: 10, color: "#ffffff", label: "10", height: 52 },
  { weight: 5, color: "#0891b2", label: "5", height: 38 },
  { weight: 2.5, color: "#dc2626", label: "2.5", height: 26 },
];

const PLATES_KG: PlateSpec[] = [
  { weight: 25, color: "#dc2626", label: "25", height: 96 },
  { weight: 20, color: "#1e3a8a", label: "20", height: 88 },
  { weight: 15, color: "#f59e0b", label: "15", height: 78 },
  { weight: 10, color: "#047857", label: "10", height: 64 },
  { weight: 5, color: "#ffffff", label: "5", height: 50 },
  { weight: 2.5, color: "#475569", label: "2.5", height: 36 },
  { weight: 1.25, color: "#a3a3a3", label: "1.25", height: 26 },
];

const BAR_PRESETS_LB = [
  { value: 45, label: '45 lb — Men\'s Olympic (20 kg)' },
  { value: 35, label: '35 lb — Women\'s Olympic (15 kg)' },
  { value: 33, label: "33 lb — Technique bar" },
  { value: 25, label: "25 lb — Short/training bar" },
  { value: 15, label: "15 lb — EZ-curl bar" },
];

const BAR_PRESETS_KG = [
  { value: 20, label: "20 kg — Men's Olympic (45 lb)" },
  { value: 15, label: "15 kg — Women's Olympic (33 lb)" },
  { value: 10, label: "10 kg — Technique bar" },
  { value: 7, label: "7 kg — EZ-curl bar" },
];

type LoadResult = {
  perSide: number;
  plates: { plate: PlateSpec; count: number }[];
  remainder: number;
  reached: number;
  isExact: boolean;
  belowBar: boolean;
};

function computeLoad(
  target: number,
  bar: number,
  plates: PlateSpec[],
): LoadResult | null {
  if (!Number.isFinite(target) || !Number.isFinite(bar)) return null;
  if (target < bar) {
    return {
      perSide: 0,
      plates: [],
      remainder: 0,
      reached: bar,
      isExact: target === bar,
      belowBar: true,
    };
  }
  const perSide = (target - bar) / 2;
  let remaining = perSide;
  const stack: { plate: PlateSpec; count: number }[] = [];
  for (const p of plates) {
    if (remaining < p.weight) continue;
    const count = Math.floor((remaining + 1e-9) / p.weight);
    if (count > 0) {
      stack.push({ plate: p, count });
      remaining -= count * p.weight;
    }
  }
  const reached = bar + 2 * (perSide - remaining);
  return {
    perSide,
    plates: stack,
    remainder: remaining,
    reached,
    isExact: Math.abs(remaining) < 1e-6,
    belowBar: false,
  };
}

const FIELD_LABEL =
  "block text-xs font-semibold uppercase tracking-[0.1em] text-[#525252] mb-2";
const INPUT_BASE =
  "w-full rounded-lg border border-[#E5E5E5] bg-white px-4 py-2.5 text-[15px] text-[#0A0A0A] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/20";

function SegToggle<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] p-1"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={
              "px-3.5 py-1.5 text-sm font-semibold rounded-md transition-colors " +
              (active
                ? "bg-white text-[#0A0A0A] shadow-sm"
                : "text-[#525252] hover:text-[#0A0A0A]")
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default function PlateCalculator() {
  const [units, setUnits] = useState<Units>("lb");
  const [target, setTarget] = useState("225");
  const [bar, setBar] = useState("45");
  const [disabledPlates, setDisabledPlates] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  const allPlates = units === "lb" ? PLATES_LB : PLATES_KG;
  const activePlates = allPlates.filter((p) => !disabledPlates[`${units}-${p.weight}`]);
  const barPresets = units === "lb" ? BAR_PRESETS_LB : BAR_PRESETS_KG;

  const result = useMemo(
    () => computeLoad(Number(target), Number(bar), activePlates),
    [target, bar, activePlates],
  );

  const onUnitsChange = (next: Units) => {
    if (next === units) return;
    const t = Number(target);
    const b = Number(bar);
    if (next === "kg") {
      if (Number.isFinite(t)) setTarget((t / 2.20462).toFixed(1));
      if (Number.isFinite(b)) setBar((b / 2.20462).toFixed(1));
    } else {
      if (Number.isFinite(t)) setTarget(Math.round(t * 2.20462).toString());
      if (Number.isFinite(b)) setBar(Math.round(b * 2.20462).toString());
    }
    setUnits(next);
  };

  const togglePlate = (weight: number) => {
    const key = `${units}-${weight}`;
    setDisabledPlates((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const onCopy = async () => {
    if (!result || result.belowBar) return;
    const perSide = result.plates
      .map(({ plate, count }) => `${count}×${plate.label}`)
      .join(" + ") || "(just the bar)";
    const text = `${target} ${units} = ${bar} ${units} bar + per side: ${perSide}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  const targetNum = Number(target);
  const barNum = Number(bar);
  const validInput =
    Number.isFinite(targetNum) && Number.isFinite(barNum) && targetNum > 0 && barNum > 0;

  return (
    <div className="rounded-2xl border border-[#E5E5E5] bg-white overflow-hidden">
      <div className="px-5 md:px-7 pt-6 pb-4 flex items-center justify-between gap-4 border-b border-[#F5F5F5]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#059669]">
            Calculator
          </p>
          <h2 className="text-xl md:text-2xl font-bold text-[#0A0A0A] tracking-tight mt-1">
            Load the bar
          </h2>
        </div>
        <SegToggle
          value={units}
          onChange={onUnitsChange}
          ariaLabel="Units"
          options={[
            { value: "lb", label: "lb" },
            { value: "kg", label: "kg" },
          ]}
        />
      </div>

      <div className="px-5 md:px-7 py-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="pc-target" className={FIELD_LABEL}>
            Target weight ({units})
          </label>
          <input
            id="pc-target"
            type="number"
            inputMode="decimal"
            min={0}
            step={units === "lb" ? 5 : 2.5}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className={INPUT_BASE}
          />
        </div>

        <div>
          <label htmlFor="pc-bar" className={FIELD_LABEL}>
            Bar weight ({units})
          </label>
          <select
            id="pc-bar"
            value={bar}
            onChange={(e) => setBar(e.target.value)}
            className={INPUT_BASE + " appearance-none"}
          >
            {barPresets.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <p className={FIELD_LABEL}>Available plates at your gym</p>
          <div className="flex flex-wrap gap-2">
            {allPlates.map((p) => {
              const key = `${units}-${p.weight}`;
              const disabled = disabledPlates[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => togglePlate(p.weight)}
                  aria-pressed={!disabled}
                  className={
                    "px-3 py-1.5 text-sm font-semibold rounded-lg border transition-colors " +
                    (disabled
                      ? "bg-[#FAFAFA] text-[#A3A3A3] border-[#E5E5E5] line-through"
                      : "bg-white text-[#0A0A0A] border-[#E5E5E5] hover:border-[#0A0A0A]")
                  }
                >
                  {p.label} {units}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-[#A3A3A3]">
            Click to exclude plates your gym doesn&apos;t stock — the calculator
            will reload using only what&apos;s left.
          </p>
        </div>
      </div>

      <div className="px-5 md:px-7 py-6 border-t border-[#F5F5F5] bg-[#FAFAFA]">
        {!validInput ? (
          <p className="text-[#525252] text-sm">
            Enter a positive target weight and bar weight to see the plate
            stack.
          </p>
        ) : result?.belowBar ? (
          <div className="text-sm text-[#92400e] bg-[#FEF3C7] border border-[#FDE68A] rounded-lg px-3 py-2">
            Target ({target} {units}) is lighter than the bar ({bar} {units}).
            Use an unloaded bar or drop to a lighter bar.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 mb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#525252]">
                  Per side
                </p>
                <p className="text-4xl md:text-5xl font-bold text-[#0A0A0A] tracking-tight leading-none mt-1">
                  {(result?.perSide ?? 0).toLocaleString()}{" "}
                  <span className="text-[#A3A3A3] text-xl font-semibold">
                    {units}
                  </span>
                </p>
              </div>
              <div className="text-sm text-[#525252]">
                <div>
                  Bar:{" "}
                  <span className="font-semibold text-[#0A0A0A]">
                    {bar} {units}
                  </span>
                </div>
                <div>
                  Target total:{" "}
                  <span className="font-semibold text-[#0A0A0A]">
                    {target} {units}
                  </span>
                </div>
              </div>
            </div>

            {/* Plate stack list */}
            {result && result.plates.length > 0 ? (
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#525252] mb-3">
                  Load per side
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.plates.map(({ plate, count }) => (
                    <div
                      key={plate.weight}
                      className="rounded-lg border border-[#E5E5E5] bg-white px-3 py-2 text-sm"
                    >
                      <span className="font-bold text-[#0A0A0A]">
                        {count}×
                      </span>{" "}
                      <span className="text-[#525252]">
                        {plate.label} {units}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mb-5 text-sm text-[#525252]">
                Just the bar — no plates needed.
              </p>
            )}

            {/* Side-view visual */}
            {result && result.plates.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#525252] mb-3">
                  What it looks like on the bar
                </p>
                <BarVisual plates={result.plates} />
              </div>
            )}

            {/* Rounding warning */}
            {result && !result.isExact && (
              <div className="mb-5 text-xs text-[#92400e] bg-[#FEF3C7] border border-[#FDE68A] rounded-lg px-3 py-2">
                Exact target isn&apos;t reachable with your available plates —
                loaded to{" "}
                <strong>
                  {result.reached.toLocaleString()} {units}
                </strong>{" "}
                ({(result.remainder * 2).toFixed(2)} {units} short). Add or
                enable smaller plates to hit exactly.
              </div>
            )}

            <button
              type="button"
              onClick={onCopy}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#059669] hover:text-[#047857] transition-colors"
            >
              {copied ? (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                    />
                  </svg>
                  Copy summary
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function BarVisual({
  plates,
}: {
  plates: { plate: PlateSpec; count: number }[];
}) {
  const items: PlateSpec[] = [];
  for (const { plate, count } of plates) {
    for (let i = 0; i < count; i++) items.push(plate);
  }
  return (
    <div
      className="rounded-xl border border-[#E5E5E5] bg-white p-5 overflow-x-auto"
      role="img"
      aria-label="Side view of loaded plates"
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 h-4 w-12 bg-[#A3A3A3] rounded-l-sm" aria-hidden />
        <div className="flex items-center gap-[3px]">
          {items.map((p, i) => (
            <div
              key={i}
              className="rounded-sm flex items-center justify-center shadow-sm"
              style={{
                backgroundColor: p.color,
                height: `${p.height}px`,
                width: "22px",
                border: p.color === "#ffffff" ? "1px solid #E5E5E5" : "none",
              }}
            >
              <span
                className="text-[9px] font-bold tracking-tight"
                style={{
                  color: p.color === "#ffffff" ? "#525252" : "#ffffff",
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                }}
              >
                {p.label}
              </span>
            </div>
          ))}
        </div>
        <div className="flex-shrink-0 h-4 w-16 bg-[#A3A3A3]" aria-hidden />
      </div>
      <p className="mt-3 text-xs text-[#A3A3A3]">
        One side shown — both sides load identically.
      </p>
    </div>
  );
}
