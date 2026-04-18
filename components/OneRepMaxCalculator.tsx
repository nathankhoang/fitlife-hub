"use client";

import { useMemo, useState } from "react";

type Units = "lb" | "kg";
type Exercise = "bench" | "squat" | "deadlift" | "ohp" | "other";

const EXERCISE_LABEL: Record<Exercise, string> = {
  bench: "Bench press",
  squat: "Back squat",
  deadlift: "Deadlift",
  ohp: "Overhead press",
  other: "Other lift",
};

function epley(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

function brzycki(weight: number, reps: number): number {
  return weight * (36 / (37 - reps));
}

function lombardi(weight: number, reps: number): number {
  return weight * Math.pow(reps, 0.1);
}

function oconner(weight: number, reps: number): number {
  return weight * (1 + 0.025 * reps);
}

const PERCENT_TABLE: { pct: number; reps: number }[] = [
  { pct: 100, reps: 1 },
  { pct: 95, reps: 2 },
  { pct: 93, reps: 3 },
  { pct: 90, reps: 4 },
  { pct: 87, reps: 5 },
  { pct: 85, reps: 6 },
  { pct: 83, reps: 7 },
  { pct: 80, reps: 8 },
  { pct: 77, reps: 9 },
  { pct: 75, reps: 10 },
  { pct: 70, reps: 12 },
  { pct: 67, reps: 15 },
];

function round5(n: number): number {
  return Math.round(n / 5) * 5;
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

export default function OneRepMaxCalculator() {
  const [units, setUnits] = useState<Units>("lb");
  const [exercise, setExercise] = useState<Exercise>("bench");
  const [weight, setWeight] = useState("225");
  const [reps, setReps] = useState("5");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const w = Number(weight);
    const r = Number(reps);
    if (!Number.isFinite(w) || !Number.isFinite(r) || w <= 0 || r < 1 || r > 20) {
      return null;
    }
    if (r === 1) {
      return {
        epley: w,
        brzycki: w,
        lombardi: w,
        oconner: w,
        average: w,
        recommended: w,
        usedFormula: "actual" as const,
        repsHigh: false,
      };
    }
    const e = epley(w, r);
    const b = brzycki(w, r);
    const l = lombardi(w, r);
    const o = oconner(w, r);
    const avg = (e + b + l + o) / 4;
    const repsHigh = r > 10;
    return {
      epley: e,
      brzycki: b,
      lombardi: l,
      oconner: o,
      average: avg,
      recommended: (e + b) / 2,
      usedFormula: "estimated" as const,
      repsHigh,
    };
  }, [weight, reps]);

  const unitLabel = units === "lb" ? "lb" : "kg";

  const onCopy = async () => {
    if (!result) return;
    const text =
      `Estimated 1RM ${EXERCISE_LABEL[exercise]}: ` +
      `${Math.round(result.recommended)} ${unitLabel} ` +
      `(from ${weight} ${unitLabel} × ${reps} reps)`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="rounded-2xl border border-[#E5E5E5] bg-white overflow-hidden">
      <div className="px-5 md:px-7 pt-6 pb-4 flex items-center justify-between gap-4 border-b border-[#F5F5F5]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#059669]">
            Calculator
          </p>
          <h2 className="text-xl md:text-2xl font-bold text-[#0A0A0A] tracking-tight mt-1">
            Your estimated 1RM
          </h2>
        </div>
        <SegToggle
          value={units}
          onChange={setUnits}
          ariaLabel="Units"
          options={[
            { value: "lb", label: "lb" },
            { value: "kg", label: "kg" },
          ]}
        />
      </div>

      <div className="px-5 md:px-7 py-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <label htmlFor="orm-exercise" className={FIELD_LABEL}>
            Exercise
          </label>
          <select
            id="orm-exercise"
            value={exercise}
            onChange={(e) => setExercise(e.target.value as Exercise)}
            className={INPUT_BASE + " appearance-none"}
          >
            {(Object.keys(EXERCISE_LABEL) as Exercise[]).map((e) => (
              <option key={e} value={e}>
                {EXERCISE_LABEL[e]}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-[#A3A3A3]">
            Used for the results label only. Epley and Brzycki aren&apos;t
            exercise-specific.
          </p>
        </div>

        <div>
          <label htmlFor="orm-weight" className={FIELD_LABEL}>
            Weight lifted ({unitLabel})
          </label>
          <input
            id="orm-weight"
            type="number"
            inputMode="decimal"
            min={1}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className={INPUT_BASE}
          />
        </div>

        <div>
          <label htmlFor="orm-reps" className={FIELD_LABEL}>
            Reps completed
          </label>
          <input
            id="orm-reps"
            type="number"
            inputMode="numeric"
            min={1}
            max={20}
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className={INPUT_BASE}
          />
          <p className="mt-2 text-xs text-[#A3A3A3]">
            Best accuracy between 2 and 10 reps. 1 rep = your actual 1RM.
          </p>
        </div>
      </div>

      <div className="px-5 md:px-7 py-6 border-t border-[#F5F5F5] bg-[#FAFAFA]">
        {!result ? (
          <p className="text-[#525252] text-sm">
            Enter a valid weight and rep count (1–20) to see your estimated 1RM.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 mb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#525252]">
                  Estimated 1RM ({EXERCISE_LABEL[exercise]})
                </p>
                <p className="text-4xl md:text-5xl font-bold text-[#0A0A0A] tracking-tight leading-none mt-1">
                  {Math.round(result.recommended).toLocaleString()}{" "}
                  <span className="text-[#A3A3A3] text-xl font-semibold">
                    {unitLabel}
                  </span>
                </p>
              </div>
              <div className="text-sm text-[#525252]">
                <div>
                  Epley:{" "}
                  <span className="font-semibold text-[#0A0A0A]">
                    {Math.round(result.epley)} {unitLabel}
                  </span>
                </div>
                <div>
                  Brzycki:{" "}
                  <span className="font-semibold text-[#0A0A0A]">
                    {Math.round(result.brzycki)} {unitLabel}
                  </span>
                </div>
                <div>
                  Lombardi:{" "}
                  <span className="font-semibold text-[#0A0A0A]">
                    {Math.round(result.lombardi)} {unitLabel}
                  </span>
                </div>
                <div>
                  O&apos;Conner:{" "}
                  <span className="font-semibold text-[#0A0A0A]">
                    {Math.round(result.oconner)} {unitLabel}
                  </span>
                </div>
              </div>
            </div>

            {result.repsHigh && (
              <div className="mb-5 text-xs text-[#92400e] bg-[#FEF3C7] border border-[#FDE68A] rounded-lg px-3 py-2">
                Accuracy drops sharply above 10 reps — the estimate trends
                high. For a real 1RM, test with 3–5 reps on a heavy set.
              </div>
            )}

            <PercentTable
              oneRm={result.recommended}
              unit={unitLabel}
              repsEntered={Number(reps)}
            />

            <button
              type="button"
              onClick={onCopy}
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#059669] hover:text-[#047857] transition-colors"
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

function PercentTable({
  oneRm,
  unit,
  repsEntered,
}: {
  oneRm: number;
  unit: string;
  repsEntered: number;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#525252] mb-3">
        Training load table
      </p>
      <div className="rounded-xl border border-[#E5E5E5] bg-white overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-[#FAFAFA] text-[#525252]">
            <tr>
              <th className="text-left px-3 py-2 font-semibold w-[70px]">%</th>
              <th className="text-left px-3 py-2 font-semibold">
                Weight ({unit})
              </th>
              <th className="text-left px-3 py-2 font-semibold">Typical reps</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F5F5] text-[#0A0A0A]">
            {PERCENT_TABLE.map(({ pct, reps }) => {
              const load = round5((oneRm * pct) / 100);
              const highlight = reps === repsEntered;
              return (
                <tr
                  key={pct}
                  className={highlight ? "bg-[#059669]/5" : undefined}
                >
                  <td className="px-3 py-2 font-semibold">{pct}%</td>
                  <td className="px-3 py-2 font-semibold">{load}</td>
                  <td className="px-3 py-2 text-[#525252]">
                    {reps} {reps === 1 ? "rep" : "reps"}
                    {highlight && (
                      <span className="ml-2 text-[11px] font-semibold text-[#059669] uppercase tracking-[0.08em]">
                        your set
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-[#A3A3A3]">
        Weights rounded to the nearest 5 {unit}. Use as a starting point and
        adjust for exercise and fatigue on the day.
      </p>
    </div>
  );
}
