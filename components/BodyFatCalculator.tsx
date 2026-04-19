"use client";

import { useMemo, useState } from "react";

type Sex = "male" | "female";
type Units = "imperial" | "metric";

const IN_PER_CM = 0.3937008;
const CM_PER_IN = 2.54;
const LB_PER_KG = 2.20462;

function toCm(v: number, units: Units): number {
  return units === "metric" ? v : v * CM_PER_IN;
}

function toKg(v: number, units: Units): number {
  return units === "metric" ? v : v / LB_PER_KG;
}

function navyBodyFatPct(opts: {
  sex: Sex;
  heightCm: number;
  neckCm: number;
  waistCm: number;
  hipCm: number | null;
}): number {
  const { sex, heightCm, neckCm, waistCm, hipCm } = opts;
  if (sex === "male") {
    const inner =
      1.0324 -
      0.19077 * Math.log10(waistCm - neckCm) +
      0.15456 * Math.log10(heightCm);
    return 495 / inner - 450;
  }
  if (hipCm === null) return NaN;
  const inner =
    1.29579 -
    0.35004 * Math.log10(waistCm + hipCm - neckCm) +
    0.22100 * Math.log10(heightCm);
  return 495 / inner - 450;
}

type Category = {
  label: string;
  range: string;
  color: string;
};

function classifyMale(bfPct: number): Category {
  if (bfPct < 6) return { label: "Essential fat", range: "2–5%", color: "#DC2626" };
  if (bfPct < 14) return { label: "Athletes", range: "6–13%", color: "#059669" };
  if (bfPct < 18) return { label: "Fitness", range: "14–17%", color: "#059669" };
  if (bfPct < 25) return { label: "Average", range: "18–24%", color: "#F59E0B" };
  return { label: "Obese", range: "25%+", color: "#DC2626" };
}

function classifyFemale(bfPct: number): Category {
  if (bfPct < 14) return { label: "Essential fat", range: "10–13%", color: "#DC2626" };
  if (bfPct < 21) return { label: "Athletes", range: "14–20%", color: "#059669" };
  if (bfPct < 25) return { label: "Fitness", range: "21–24%", color: "#059669" };
  if (bfPct < 32) return { label: "Average", range: "25–31%", color: "#F59E0B" };
  return { label: "Obese", range: "32%+", color: "#DC2626" };
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

function round(n: number, digits = 1): number {
  const m = 10 ** digits;
  return Math.round(n * m) / m;
}

export default function BodyFatCalculator() {
  const [sex, setSex] = useState<Sex>("male");
  const [units, setUnits] = useState<Units>("imperial");
  const [height, setHeight] = useState("70");
  const [heightCm, setHeightCm] = useState("178");
  const [weightLb, setWeightLb] = useState("180");
  const [weightKg, setWeightKg] = useState("82");
  const [neck, setNeck] = useState("15");
  const [neckCm, setNeckCm] = useState("38");
  const [waist, setWaist] = useState("34");
  const [waistCm, setWaistCm] = useState("86");
  const [hip, setHip] = useState("40");
  const [hipCm, setHipCm] = useState("102");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const h = units === "imperial" ? Number(height) : Number(heightCm);
    const n = units === "imperial" ? Number(neck) : Number(neckCm);
    const w = units === "imperial" ? Number(waist) : Number(waistCm);
    const hip_ = sex === "female"
      ? units === "imperial" ? Number(hip) : Number(hipCm)
      : null;
    const bw = units === "imperial" ? Number(weightLb) : Number(weightKg);

    const heightC = toCm(h, units);
    const neckC = toCm(n, units);
    const waistC = toCm(w, units);
    const hipC = hip_ !== null ? toCm(hip_, units) : null;

    if (
      !Number.isFinite(heightC) || heightC < 120 || heightC > 230 ||
      !Number.isFinite(neckC) || neckC < 20 || neckC > 60 ||
      !Number.isFinite(waistC) || waistC < 40 || waistC > 200
    ) {
      return null;
    }
    if (sex === "female" && (!Number.isFinite(hipC ?? NaN) || (hipC ?? 0) < 60 || (hipC ?? 0) > 200)) {
      return null;
    }
    if (sex === "male" && waistC <= neckC) {
      return { error: "Waist must be larger than neck — check your measurements." };
    }
    if (sex === "female" && hipC !== null && waistC + hipC <= neckC) {
      return { error: "Waist + hip must exceed neck — check your measurements." };
    }

    const bf = navyBodyFatPct({
      sex,
      heightCm: heightC,
      neckCm: neckC,
      waistCm: waistC,
      hipCm: hipC,
    });
    if (!Number.isFinite(bf) || bf < 2 || bf > 60) {
      return { error: "Result is outside a realistic range — re-check measurements." };
    }
    const category = sex === "male" ? classifyMale(bf) : classifyFemale(bf);
    const weightKgN = toKg(bw, units);
    const leanMassKg = Number.isFinite(weightKgN) ? weightKgN * (1 - bf / 100) : NaN;
    const leanMassLb = Number.isFinite(leanMassKg) ? leanMassKg * LB_PER_KG : NaN;

    return {
      bf,
      category,
      leanMassKg,
      leanMassLb,
      hasWeight: Number.isFinite(weightKgN),
    };
  }, [sex, units, height, heightCm, neck, neckCm, waist, waistCm, hip, hipCm, weightLb, weightKg]);

  const onUnitsChange = (next: Units) => {
    if (next === units) return;
    if (next === "metric") {
      const h = Number(height);
      const n = Number(neck);
      const w = Number(waist);
      const hp = Number(hip);
      const wl = Number(weightLb);
      if (Number.isFinite(h)) setHeightCm(round(h * CM_PER_IN, 0).toString());
      if (Number.isFinite(n)) setNeckCm(round(n * CM_PER_IN, 1).toString());
      if (Number.isFinite(w)) setWaistCm(round(w * CM_PER_IN, 1).toString());
      if (Number.isFinite(hp)) setHipCm(round(hp * CM_PER_IN, 1).toString());
      if (Number.isFinite(wl)) setWeightKg(round(wl / LB_PER_KG, 0).toString());
    } else {
      const h = Number(heightCm);
      const n = Number(neckCm);
      const w = Number(waistCm);
      const hp = Number(hipCm);
      const wk = Number(weightKg);
      if (Number.isFinite(h)) setHeight(round(h * IN_PER_CM, 0).toString());
      if (Number.isFinite(n)) setNeck(round(n * IN_PER_CM, 1).toString());
      if (Number.isFinite(w)) setWaist(round(w * IN_PER_CM, 1).toString());
      if (Number.isFinite(hp)) setHip(round(hp * IN_PER_CM, 1).toString());
      if (Number.isFinite(wk)) setWeightLb(round(wk * LB_PER_KG, 0).toString());
    }
    setUnits(next);
  };

  const lenUnit = units === "imperial" ? "in" : "cm";
  const weightUnit = units === "imperial" ? "lb" : "kg";

  const onCopy = async () => {
    if (!result || "error" in result) return;
    const parts = [
      `${round(result.bf, 1)}% body fat (${result.category.label})`,
    ];
    if (result.hasWeight) {
      parts.push(
        `lean mass ${Math.round(units === "imperial" ? result.leanMassLb : result.leanMassKg)} ${weightUnit}`,
      );
    }
    try {
      await navigator.clipboard.writeText(parts.join(" · "));
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
            Your body fat estimate
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
            The Navy formula uses different coefficients and measurement points
            for men and women.
          </p>
        </div>

        <div>
          <label htmlFor="bf-height" className={FIELD_LABEL}>
            Height ({lenUnit})
          </label>
          <input
            id="bf-height"
            type="number"
            inputMode="decimal"
            value={units === "imperial" ? height : heightCm}
            onChange={(e) =>
              units === "imperial" ? setHeight(e.target.value) : setHeightCm(e.target.value)
            }
            className={INPUT_BASE}
          />
        </div>

        <div>
          <label htmlFor="bf-weight" className={FIELD_LABEL}>
            Weight ({weightUnit}){" "}
            <span className="text-[#A3A3A3] font-normal normal-case tracking-normal">
              (optional — for lean mass)
            </span>
          </label>
          <input
            id="bf-weight"
            type="number"
            inputMode="decimal"
            value={units === "imperial" ? weightLb : weightKg}
            onChange={(e) =>
              units === "imperial"
                ? setWeightLb(e.target.value)
                : setWeightKg(e.target.value)
            }
            className={INPUT_BASE}
          />
        </div>

        <div>
          <label htmlFor="bf-neck" className={FIELD_LABEL}>
            Neck circumference ({lenUnit})
          </label>
          <input
            id="bf-neck"
            type="number"
            inputMode="decimal"
            step={0.1}
            value={units === "imperial" ? neck : neckCm}
            onChange={(e) =>
              units === "imperial" ? setNeck(e.target.value) : setNeckCm(e.target.value)
            }
            className={INPUT_BASE}
          />
          <p className="mt-2 text-xs text-[#A3A3A3]">
            Measure just below the larynx, tape angled slightly downward. Don&apos;t
            flex.
          </p>
        </div>

        <div>
          <label htmlFor="bf-waist" className={FIELD_LABEL}>
            Waist circumference ({lenUnit})
          </label>
          <input
            id="bf-waist"
            type="number"
            inputMode="decimal"
            step={0.1}
            value={units === "imperial" ? waist : waistCm}
            onChange={(e) =>
              units === "imperial" ? setWaist(e.target.value) : setWaistCm(e.target.value)
            }
            className={INPUT_BASE}
          />
          <p className="mt-2 text-xs text-[#A3A3A3]">
            {sex === "male"
              ? "Measure at the navel, relaxed. Don't suck in."
              : "Measure at the narrowest point, usually just above the navel."}
          </p>
        </div>

        {sex === "female" && (
          <div className="md:col-span-2">
            <label htmlFor="bf-hip" className={FIELD_LABEL}>
              Hip circumference ({lenUnit})
            </label>
            <input
              id="bf-hip"
              type="number"
              inputMode="decimal"
              step={0.1}
              value={units === "imperial" ? hip : hipCm}
              onChange={(e) =>
                units === "imperial" ? setHip(e.target.value) : setHipCm(e.target.value)
              }
              className={INPUT_BASE}
            />
            <p className="mt-2 text-xs text-[#A3A3A3]">
              Measure at the largest circumference around the hips and glutes.
            </p>
          </div>
        )}
      </div>

      <div className="px-5 md:px-7 py-6 border-t border-[#F5F5F5] bg-[#FAFAFA]">
        {!result ? (
          <p className="text-[#525252] text-sm">
            Fill in valid measurements to see your estimate.
          </p>
        ) : "error" in result ? (
          <div className="text-sm text-[#92400e] bg-[#FEF3C7] border border-[#FDE68A] rounded-lg px-3 py-2">
            {result.error}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 mb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#525252]">
                  Estimated body fat
                </p>
                <p className="text-4xl md:text-5xl font-bold text-[#0A0A0A] tracking-tight leading-none mt-1">
                  {round(result.bf, 1)}
                  <span className="text-[#A3A3A3] text-xl font-semibold">%</span>
                </p>
              </div>
              <div className="text-sm text-[#525252]">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: result.category.color }}
                    aria-hidden
                  />
                  <span className="font-semibold text-[#0A0A0A]">
                    {result.category.label}
                  </span>
                  <span className="text-[#A3A3A3]">
                    ({result.category.range})
                  </span>
                </div>
                {result.hasWeight && (
                  <div className="mt-1">
                    Lean mass:{" "}
                    <span className="font-semibold text-[#0A0A0A]">
                      {Math.round(
                        units === "imperial" ? result.leanMassLb : result.leanMassKg,
                      )}{" "}
                      {weightUnit}
                    </span>
                  </div>
                )}
              </div>
            </div>

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
