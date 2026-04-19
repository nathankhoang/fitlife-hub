"use client";

import { useMemo, useState } from "react";

type Sex = "male" | "female";
type Units = "imperial" | "metric";
type Activity = "sedentary" | "light" | "moderate" | "heavy" | "athlete";
type Goal =
  | "aggressiveCut"
  | "moderateCut"
  | "maintain"
  | "leanBulk"
  | "aggressiveBulk";

const ACTIVITY_MULT: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  heavy: 1.725,
  athlete: 1.9,
};

const ACTIVITY_LABEL: Record<Activity, { title: string; detail: string }> = {
  sedentary: { title: "Sedentary", detail: "Desk job, little or no exercise" },
  light: { title: "Light", detail: "Light exercise 1–3 days/week" },
  moderate: { title: "Moderate", detail: "Moderate exercise 3–5 days/week" },
  heavy: { title: "Heavy", detail: "Hard exercise 6–7 days/week" },
  athlete: { title: "Athlete", detail: "Twice-daily training or physical job" },
};

const GOAL_ADJ: Record<Goal, number> = {
  aggressiveCut: -0.25,
  moderateCut: -0.15,
  maintain: 0,
  leanBulk: 0.1,
  aggressiveBulk: 0.2,
};

const GOAL_LABEL: Record<Goal, string> = {
  aggressiveCut: "Aggressive cut (−25%)",
  moderateCut: "Moderate cut (−15%)",
  maintain: "Maintain",
  leanBulk: "Lean bulk (+10%)",
  aggressiveBulk: "Aggressive bulk (+20%)",
};

const PROTEIN_PER_LB: Record<Goal, number> = {
  aggressiveCut: 1.1,
  moderateCut: 1.0,
  maintain: 0.8,
  leanBulk: 0.8,
  aggressiveBulk: 0.7,
};

const LB_PER_KG = 2.20462;
const CM_PER_IN = 2.54;

function round(n: number, digits = 0): number {
  const m = 10 ** digits;
  return Math.round(n * m) / m;
}

function mifflinBmr(
  sex: Sex,
  weightKg: number,
  heightCm: number,
  age: number,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

function katchBmr(leanMassKg: number): number {
  return 370 + 21.6 * leanMassKg;
}

type Result = {
  bmr: number;
  tdee: number;
  targetCals: number;
  proteinG: number;
  fatG: number;
  carbG: number;
  formula: "mifflin" | "katch";
  floorApplied: boolean;
  belowBmr: boolean;
  carbsClampedToZero: boolean;
};

type Inputs = {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: Activity;
  goal: Goal;
  bodyFatPct: number | null;
};

function compute(inputs: Inputs): Result | null {
  const { sex, age, heightCm, weightKg, activity, goal, bodyFatPct } = inputs;
  if (
    !Number.isFinite(age) ||
    !Number.isFinite(heightCm) ||
    !Number.isFinite(weightKg) ||
    age < 15 ||
    age > 80 ||
    heightCm < 120 ||
    heightCm > 230 ||
    weightKg < 35 ||
    weightKg > 250
  ) {
    return null;
  }

  let bmr: number;
  let formula: "mifflin" | "katch";
  if (bodyFatPct !== null && bodyFatPct >= 3 && bodyFatPct <= 60) {
    const leanMassKg = weightKg * (1 - bodyFatPct / 100);
    bmr = katchBmr(leanMassKg);
    formula = "katch";
  } else {
    bmr = mifflinBmr(sex, weightKg, heightCm, age);
    formula = "mifflin";
  }

  const tdee = bmr * ACTIVITY_MULT[activity];
  let targetCals = tdee * (1 + GOAL_ADJ[goal]);

  const floor = sex === "male" ? 1500 : 1200;
  let floorApplied = false;
  if (targetCals < floor) {
    targetCals = floor;
    floorApplied = true;
  }

  const belowBmr = targetCals < bmr;

  const weightLb = weightKg * LB_PER_KG;
  const proteinG = weightLb * PROTEIN_PER_LB[goal];

  const fatFloorG = weightLb * 0.35;
  const fatFromPct = (targetCals * 0.25) / 9;
  const fatG = Math.max(fatFloorG, fatFromPct);

  let carbG = (targetCals - proteinG * 4 - fatG * 9) / 4;
  let carbsClampedToZero = false;
  if (carbG < 0) {
    carbG = 0;
    carbsClampedToZero = true;
  }

  return {
    bmr,
    tdee,
    targetCals,
    proteinG,
    fatG,
    carbG,
    formula,
    floorApplied,
    belowBmr,
    carbsClampedToZero,
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

export default function MacroCalculator() {
  const [units, setUnits] = useState<Units>("imperial");
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState("30");
  const [heightIn, setHeightIn] = useState("70");
  const [heightCm, setHeightCm] = useState("178");
  const [weightLb, setWeightLb] = useState("180");
  const [weightKg, setWeightKg] = useState("82");
  const [activity, setActivity] = useState<Activity>("moderate");
  const [goal, setGoal] = useState<Goal>("maintain");
  const [bodyFat, setBodyFat] = useState("");
  const [copied, setCopied] = useState(false);

  const result = useMemo<Result | null>(() => {
    const ageN = Number(age);
    const bfRaw = bodyFat.trim();
    const bfN = bfRaw === "" ? null : Number(bfRaw);
    const h =
      units === "imperial" ? Number(heightIn) * CM_PER_IN : Number(heightCm);
    const w =
      units === "imperial" ? Number(weightLb) / LB_PER_KG : Number(weightKg);
    return compute({
      sex,
      age: ageN,
      heightCm: h,
      weightKg: w,
      activity,
      goal,
      bodyFatPct: bfN === null || Number.isNaN(bfN) ? null : bfN,
    });
  }, [units, sex, age, heightIn, heightCm, weightLb, weightKg, activity, goal, bodyFat]);

  const onUnitsChange = (next: Units) => {
    if (next === units) return;
    if (next === "metric") {
      const hIn = Number(heightIn);
      const wLb = Number(weightLb);
      if (Number.isFinite(hIn)) setHeightCm(String(round(hIn * CM_PER_IN)));
      if (Number.isFinite(wLb)) setWeightKg(String(round(wLb / LB_PER_KG)));
    } else {
      const hCm = Number(heightCm);
      const wKg = Number(weightKg);
      if (Number.isFinite(hCm)) setHeightIn(String(round(hCm / CM_PER_IN)));
      if (Number.isFinite(wKg)) setWeightLb(String(round(wKg * LB_PER_KG)));
    }
    setUnits(next);
  };

  const macroPct = useMemo(() => {
    if (!result) return null;
    const total = result.proteinG * 4 + result.carbG * 4 + result.fatG * 9;
    if (total <= 0) return null;
    return {
      p: ((result.proteinG * 4) / total) * 100,
      c: ((result.carbG * 4) / total) * 100,
      f: ((result.fatG * 9) / total) * 100,
    };
  }, [result]);

  const onCopy = async () => {
    if (!result) return;
    const text =
      `${round(result.targetCals)} kcal · ` +
      `P ${round(result.proteinG)}g · ` +
      `C ${round(result.carbG)}g · ` +
      `F ${round(result.fatG)}g ` +
      `(${GOAL_LABEL[goal]})`;
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
      {/* Form header + units toggle */}
      <div className="px-5 md:px-7 pt-6 pb-4 flex items-center justify-between gap-4 border-b border-[#F5F5F5]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#059669]">
            Calculator
          </p>
          <h2 className="text-xl md:text-2xl font-bold text-[#0A0A0A] tracking-tight mt-1">
            Your numbers
          </h2>
        </div>
        <SegToggle
          value={units}
          onChange={onUnitsChange}
          ariaLabel="Units"
          options={[
            { value: "imperial", label: "Imperial" },
            { value: "metric", label: "Metric" },
          ]}
        />
      </div>

      {/* Form grid */}
      <div className="px-5 md:px-7 py-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <label className={FIELD_LABEL}>Biological sex</label>
          <SegToggle
            value={sex}
            onChange={setSex}
            ariaLabel="Biological sex"
            options={[
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
            ]}
          />
          <p className="mt-2 text-xs text-[#A3A3A3]">
            Used for BMR only — biological sex drives the formula constant.
          </p>
        </div>

        <div>
          <label htmlFor="mc-age" className={FIELD_LABEL}>
            Age
          </label>
          <input
            id="mc-age"
            type="number"
            inputMode="numeric"
            min={15}
            max={80}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className={INPUT_BASE}
          />
        </div>

        {units === "imperial" ? (
          <div>
            <label htmlFor="mc-h-in" className={FIELD_LABEL}>
              Height (in)
            </label>
            <input
              id="mc-h-in"
              type="number"
              inputMode="numeric"
              min={48}
              max={90}
              value={heightIn}
              onChange={(e) => setHeightIn(e.target.value)}
              className={INPUT_BASE}
            />
          </div>
        ) : (
          <div>
            <label htmlFor="mc-h-cm" className={FIELD_LABEL}>
              Height (cm)
            </label>
            <input
              id="mc-h-cm"
              type="number"
              inputMode="numeric"
              min={120}
              max={230}
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              className={INPUT_BASE}
            />
          </div>
        )}

        {units === "imperial" ? (
          <div>
            <label htmlFor="mc-w-lb" className={FIELD_LABEL}>
              Weight (lb)
            </label>
            <input
              id="mc-w-lb"
              type="number"
              inputMode="decimal"
              min={77}
              max={551}
              value={weightLb}
              onChange={(e) => setWeightLb(e.target.value)}
              className={INPUT_BASE}
            />
          </div>
        ) : (
          <div>
            <label htmlFor="mc-w-kg" className={FIELD_LABEL}>
              Weight (kg)
            </label>
            <input
              id="mc-w-kg"
              type="number"
              inputMode="decimal"
              min={35}
              max={250}
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className={INPUT_BASE}
            />
          </div>
        )}

        <div>
          <label htmlFor="mc-bf" className={FIELD_LABEL}>
            Body fat % <span className="text-[#A3A3A3] font-normal normal-case tracking-normal">(optional)</span>
          </label>
          <input
            id="mc-bf"
            type="number"
            inputMode="decimal"
            min={3}
            max={60}
            placeholder="e.g. 18"
            value={bodyFat}
            onChange={(e) => setBodyFat(e.target.value)}
            className={INPUT_BASE}
          />
          <p className="mt-2 text-xs text-[#A3A3A3]">
            Enables the Katch-McArdle formula (more accurate if you know it).
          </p>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="mc-activity" className={FIELD_LABEL}>
            Activity level
          </label>
          <select
            id="mc-activity"
            value={activity}
            onChange={(e) => setActivity(e.target.value as Activity)}
            className={INPUT_BASE + " appearance-none"}
          >
            {(Object.keys(ACTIVITY_LABEL) as Activity[]).map((a) => (
              <option key={a} value={a}>
                {ACTIVITY_LABEL[a].title} — {ACTIVITY_LABEL[a].detail}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="mc-goal" className={FIELD_LABEL}>
            Goal
          </label>
          <select
            id="mc-goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value as Goal)}
            className={INPUT_BASE + " appearance-none"}
          >
            {(Object.keys(GOAL_LABEL) as Goal[]).map((g) => (
              <option key={g} value={g}>
                {GOAL_LABEL[g]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="px-5 md:px-7 py-6 border-t border-[#F5F5F5] bg-[#FAFAFA]">
        {!result ? (
          <p className="text-[#525252] text-sm">
            Enter valid numbers to see your results. Age must be 15–80, and the
            other fields should fall within realistic adult ranges.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 mb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#525252]">
                  Target daily calories
                </p>
                <p className="text-4xl md:text-5xl font-bold text-[#0A0A0A] tracking-tight leading-none mt-1">
                  {round(result.targetCals).toLocaleString()}{" "}
                  <span className="text-[#A3A3A3] text-xl font-semibold">kcal</span>
                </p>
              </div>
              <div className="text-sm text-[#525252]">
                <div>
                  TDEE:{" "}
                  <span className="font-semibold text-[#0A0A0A]">
                    {round(result.tdee).toLocaleString()} kcal
                  </span>
                </div>
                <div>
                  BMR:{" "}
                  <span className="font-semibold text-[#0A0A0A]">
                    {round(result.bmr).toLocaleString()} kcal
                  </span>{" "}
                  <span className="text-[#A3A3A3]">
                    · {result.formula === "katch" ? "Katch-McArdle" : "Mifflin-St Jeor"}
                  </span>
                </div>
              </div>
            </div>

            {/* Macro cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <MacroCard
                label="Protein"
                grams={result.proteinG}
                kcal={result.proteinG * 4}
                pct={macroPct?.p}
                color="bg-[#059669]"
              />
              <MacroCard
                label="Carbs"
                grams={result.carbG}
                kcal={result.carbG * 4}
                pct={macroPct?.c}
                color="bg-[#F59E0B]"
              />
              <MacroCard
                label="Fat"
                grams={result.fatG}
                kcal={result.fatG * 9}
                pct={macroPct?.f}
                color="bg-[#DC2626]"
              />
            </div>

            {/* Stacked bar */}
            {macroPct && (
              <div
                className="h-2.5 w-full rounded-full overflow-hidden flex bg-[#E5E5E5] mb-5"
                role="img"
                aria-label={`Macro split: protein ${round(macroPct.p)}%, carbs ${round(macroPct.c)}%, fat ${round(macroPct.f)}%`}
              >
                <div className="bg-[#059669] h-full" style={{ width: `${macroPct.p}%` }} />
                <div className="bg-[#F59E0B] h-full" style={{ width: `${macroPct.c}%` }} />
                <div className="bg-[#DC2626] h-full" style={{ width: `${macroPct.f}%` }} />
              </div>
            )}

            {/* Warnings */}
            {(result.floorApplied || result.belowBmr || result.carbsClampedToZero) && (
              <div className="mb-5 text-xs text-[#92400e] bg-[#FEF3C7] border border-[#FDE68A] rounded-lg px-3 py-2 space-y-1">
                {result.floorApplied && (
                  <p>
                    Calories were adjusted up to the recommended floor (
                    {sex === "male" ? "1,500" : "1,200"} kcal) — your aggressive
                    deficit fell below safe long-term intake.
                  </p>
                )}
                {result.belowBmr && !result.floorApplied && (
                  <p>
                    Target calories are below your BMR. Holding this long term
                    isn&apos;t advisable — consider a smaller deficit or higher
                    activity.
                  </p>
                )}
                {result.carbsClampedToZero && (
                  <p>
                    Protein + fat already cover your calorie target, so carbs
                    are 0 g. Reduce protein target or pick a higher-calorie
                    goal.
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={onCopy}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#059669] hover:text-[#047857] transition-colors"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
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

function MacroCard({
  label,
  grams,
  kcal,
  pct,
  color,
}: {
  label: string;
  grams: number;
  kcal: number;
  pct: number | undefined;
  color: string;
}) {
  return (
    <div className="rounded-xl bg-white border border-[#E5E5E5] p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2 h-2 rounded-full ${color}`} aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#525252]">
          {label}
        </span>
      </div>
      <p className="text-2xl md:text-3xl font-bold text-[#0A0A0A] tracking-tight leading-none">
        {round(grams)}
        <span className="text-[#A3A3A3] text-base font-semibold"> g</span>
      </p>
      <p className="text-xs text-[#A3A3A3] mt-1.5">
        {round(kcal).toLocaleString()} kcal
        {pct !== undefined ? ` · ${round(pct)}%` : ""}
      </p>
    </div>
  );
}
