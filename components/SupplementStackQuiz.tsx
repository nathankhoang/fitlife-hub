"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { affiliateProducts } from "@/lib/affiliates";

type Goal = "muscle" | "fatLoss" | "performance" | "sleep" | "general";
type Training = "lt3" | "three4" | "fivePlus";
type Diet = "none" | "vegan" | "lactoseSensitive";
type Sleep = "fine" | "couldBeBetter" | "problem";
type Budget = "under50" | "fifty100" | "over100";

type Answers = {
  goal?: Goal;
  training?: Training;
  diet?: Diet;
  sleep?: Sleep;
  budget?: Budget;
};

type Option<T extends string> = {
  value: T;
  label: string;
  hint?: string;
};

type Question<K extends keyof Answers> = {
  id: K;
  prompt: string;
  options: Option<NonNullable<Answers[K]>>[];
};

const QUESTIONS: [
  Question<"goal">,
  Question<"training">,
  Question<"diet">,
  Question<"sleep">,
  Question<"budget">,
] = [
  {
    id: "goal",
    prompt: "What's your main goal right now?",
    options: [
      { value: "muscle", label: "Build muscle", hint: "Add size and strength" },
      { value: "fatLoss", label: "Lose fat", hint: "Cut while holding muscle" },
      { value: "performance", label: "Improve performance", hint: "Get stronger, recover faster" },
      { value: "sleep", label: "Sleep & recovery", hint: "Deeper sleep, less soreness" },
      { value: "general", label: "General health", hint: "Insurance + longevity" },
    ],
  },
  {
    id: "training",
    prompt: "How often do you train?",
    options: [
      { value: "lt3", label: "Less than 3×/week", hint: "Casual or just starting" },
      { value: "three4", label: "3–4×/week", hint: "Consistent, moderate volume" },
      { value: "fivePlus", label: "5+×/week", hint: "Serious — high volume" },
    ],
  },
  {
    id: "diet",
    prompt: "Any dietary considerations?",
    options: [
      { value: "none", label: "None", hint: "Eat everything" },
      { value: "lactoseSensitive", label: "Lactose-sensitive", hint: "Dairy bothers me" },
      { value: "vegan", label: "Vegan or plant-based", hint: "No animal products" },
    ],
  },
  {
    id: "sleep",
    prompt: "How's your sleep?",
    options: [
      { value: "fine", label: "Fine, no issues", hint: "7+ hours, falls asleep easily" },
      { value: "couldBeBetter", label: "Could be better", hint: "Restless or light sleep" },
      { value: "problem", label: "Real problem", hint: "Trouble falling or staying asleep" },
    ],
  },
  {
    id: "budget",
    prompt: "What's your monthly supplement budget?",
    options: [
      { value: "under50", label: "Under $50", hint: "Just the essentials" },
      { value: "fifty100", label: "$50–$100", hint: "Room for extras" },
      { value: "over100", label: "$100+", hint: "Full stack" },
    ],
  },
];

type Pick = {
  productId: string;
  tier: "essential" | "optional";
  reason: string;
};

function computeStack(a: Answers): Pick[] {
  const picks: Pick[] = [];
  const add = (p: Pick) => {
    if (!picks.some((x) => x.productId === p.productId)) picks.push(p);
  };

  // Protein powder — almost always an essential except for pure "sleep" goal
  if (a.goal !== "sleep") {
    if (a.diet === "vegan") {
      add({
        productId: "orgain-organic-protein",
        tier: "essential",
        reason:
          "Vegan-friendly plant blend. Pea + rice gives a complete amino acid profile — close enough to whey for muscle building at your daily protein target.",
      });
    } else if (a.diet === "lactoseSensitive") {
      add({
        productId: "myprotein-impact-whey",
        tier: "essential",
        reason:
          "Whey isolate strips out nearly all lactose, so you get the fast-absorbing protein hit without the GI trade-off.",
      });
    } else {
      add({
        productId: "optimum-nutrition-gold-standard",
        tier: "essential",
        reason:
          "Cheapest per gram of complete protein and covers 95% of use cases. The default choice unless a specific reason says otherwise.",
      });
    }
  }

  // Creatine — essential for muscle/performance + 3+x/week training
  const trainsEnough = a.training === "three4" || a.training === "fivePlus";
  if (
    (a.goal === "muscle" || a.goal === "performance") &&
    trainsEnough
  ) {
    add({
      productId: "creatine-monohydrate-bulk",
      tier: "essential",
      reason:
        "The single most-researched performance supplement. 3–5 g/day adds measurable strength and lean mass within 4–8 weeks of consistent training.",
    });
  } else if (a.goal === "fatLoss" && trainsEnough) {
    add({
      productId: "creatine-monohydrate-bulk",
      tier: "optional",
      reason:
        "Helps preserve strength during a cut. Cheap enough (~$20/month) that it's worth keeping in a fat-loss phase.",
    });
  }

  // Sleep supplements
  if (a.sleep === "problem") {
    add({
      productId: "magnesium-glycinate",
      tier: "essential",
      reason:
        "Deepens sleep quality by supporting GABA and muscle relaxation. Works best with 1–2 weeks of consistent nightly use.",
    });
    add({
      productId: "melatonin-natrol",
      tier: "optional",
      reason:
        "Useful for trouble falling asleep or shifting a drifted schedule. Start with the smallest split dose (1–3 mg) to avoid morning grogginess.",
    });
    add({
      productId: "ashwagandha-ksm66",
      tier: "optional",
      reason:
        "KSM-66 reduces cortisol and subjective stress. Helpful if racing thoughts are part of what's keeping you up.",
    });
  } else if (a.sleep === "couldBeBetter") {
    add({
      productId: "magnesium-glycinate",
      tier: a.goal === "sleep" ? "essential" : "optional",
      reason:
        "A low-risk add for better sleep depth. Doesn't shorten sleep onset — deepens it. Safe for indefinite nightly use.",
    });
  }

  // Pre-workout — for high frequency training with budget room
  if (a.training === "fivePlus" && a.budget !== "under50") {
    add({
      productId: "legion-pulse-preworkout",
      tier: "optional",
      reason:
        "Clinically-dosed ingredients that actually move the needle on high-volume training days. Skip on rest and light days to prevent tolerance.",
    });
  }

  // Insurance picks scale with budget
  if (a.budget === "over100" || a.goal === "general") {
    add({
      productId: "vitamin-d3-sports-research",
      tier: "essential",
      reason:
        "A large share of adults are deficient, especially anyone training indoors or living north of ~37° latitude. Cheapest high-leverage insurance pick available.",
    });
    add({
      productId: "fish-oil-nordic-naturals",
      tier: a.budget === "over100" ? "optional" : "essential",
      reason:
        "Omega-3s (EPA + DHA) are under-consumed in most Western diets. Supports recovery, joint health, and long-term cardiovascular markers.",
    });
  } else if (a.budget === "fifty100") {
    add({
      productId: "vitamin-d3-sports-research",
      tier: "optional",
      reason:
        "Low cost, high leverage. If you can only add one insurance supplement on this budget, D3 has the strongest deficiency case in the general population.",
    });
  }

  // Multi — reserved for high budget or general-health goal
  if (a.budget === "over100" && (a.goal === "general" || a.goal === "performance")) {
    add({
      productId: "thorne-multivitamin",
      tier: "optional",
      reason:
        "Safety net for gaps in a real-food diet. NSF Certified for Sport, uses bioavailable forms. Not a replacement for food — a hedge.",
    });
  }

  // Fat loss specific
  if (a.goal === "fatLoss" && trainsEnough && a.budget !== "under50") {
    add({
      productId: "bcaa-xtend",
      tier: "optional",
      reason:
        "Minor help if you train fasted — preserves lean mass around the workout. Skip if you eat before training; protein powder covers you.",
    });
  }

  return picks;
}

const FIELD_LABEL =
  "text-xs font-semibold uppercase tracking-[0.12em] text-[#525252]";

type Stage = "intro" | "question" | "results";

export default function SupplementStackQuiz() {
  const [stage, setStage] = useState<Stage>("intro");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [copied, setCopied] = useState(false);

  const picks = useMemo(
    () => (stage === "results" ? computeStack(answers) : []),
    [stage, answers],
  );

  const essentials = picks.filter((p) => p.tier === "essential");
  const optional = picks.filter((p) => p.tier === "optional");

  const totalQuestions = QUESTIONS.length;
  const answeredValue = <K extends keyof Answers>(id: K) => answers[id];

  const handleAnswer = <K extends keyof Answers>(
    id: K,
    value: NonNullable<Answers[K]>,
  ) => {
    const next: Answers = { ...answers, [id]: value };
    setAnswers(next);
    if (qIndex + 1 < totalQuestions) {
      setQIndex(qIndex + 1);
    } else {
      setStage("results");
    }
  };

  const handleBack = () => {
    if (qIndex > 0) {
      setQIndex(qIndex - 1);
    } else {
      setStage("intro");
    }
  };

  const reset = () => {
    setStage("intro");
    setQIndex(0);
    setAnswers({});
  };

  const onCopy = async () => {
    const lines = [
      "My supplement stack (from LeanBodyEngine):",
      "",
      "ESSENTIALS:",
      ...essentials.map(
        (p) => `- ${affiliateProducts[p.productId]?.name ?? p.productId}`,
      ),
    ];
    if (optional.length > 0) {
      lines.push("", "OPTIONAL:");
      for (const p of optional) {
        lines.push(
          `- ${affiliateProducts[p.productId]?.name ?? p.productId}`,
        );
      }
    }
    lines.push("", "Build yours: https://leanbodyengine.com/quiz/supplement-stack");
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  if (stage === "intro") {
    return (
      <div className="rounded-2xl border border-[#E5E5E5] bg-white overflow-hidden">
        <div className="p-6 md:p-10 text-center">
          <p className={`${FIELD_LABEL} text-[#059669] mb-3`}>5 questions · 30 seconds</p>
          <h2 className="text-2xl md:text-3xl font-bold text-[#0A0A0A] tracking-tight mb-3">
            Build your supplement stack
          </h2>
          <p className="text-[#525252] leading-relaxed max-w-xl mx-auto mb-6 text-[15px]">
            Tell us about your goal, training, and budget. We&apos;ll recommend the
            handful of supplements with the strongest evidence for your specific
            situation — and skip the rest.
          </p>
          <button
            type="button"
            onClick={() => setStage("question")}
            className="inline-flex items-center gap-2 bg-[#059669] hover:bg-[#047857] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Start the quiz
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    );
  }

  if (stage === "question") {
    const q = QUESTIONS[qIndex];
    const current = answeredValue(q.id);
    return (
      <div className="rounded-2xl border border-[#E5E5E5] bg-white overflow-hidden">
        {/* Progress */}
        <div className="px-5 md:px-7 pt-5 pb-3 flex items-center justify-between gap-4 border-b border-[#F5F5F5]">
          <button
            type="button"
            onClick={handleBack}
            className="text-sm text-[#525252] hover:text-[#0A0A0A] transition-colors inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#A3A3A3]">
            Question {qIndex + 1} of {totalQuestions}
          </p>
        </div>
        <div className="h-1 bg-[#F5F5F5]">
          <div
            className="h-full bg-[#059669] transition-all duration-300"
            style={{ width: `${((qIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>

        <div className="p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0A0A0A] tracking-tight mb-6">
            {q.prompt}
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {q.options.map((opt) => {
              const active = current === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    handleAnswer(q.id, opt.value as NonNullable<Answers[typeof q.id]>)
                  }
                  className={
                    "text-left rounded-xl border p-4 transition-colors " +
                    (active
                      ? "border-[#059669] bg-[#059669]/5"
                      : "border-[#E5E5E5] bg-white hover:border-[#0A0A0A]")
                  }
                >
                  <div className="font-bold text-[#0A0A0A] leading-snug">{opt.label}</div>
                  {opt.hint && (
                    <div className="mt-1 text-sm text-[#525252]">{opt.hint}</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Results
  return (
    <div className="rounded-2xl border border-[#E5E5E5] bg-white overflow-hidden">
      <div className="p-6 md:p-8 border-b border-[#F5F5F5] flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className={`${FIELD_LABEL} text-[#059669]`}>Your recommended stack</p>
          <h2 className="text-2xl md:text-3xl font-bold text-[#0A0A0A] tracking-tight mt-1">
            {picks.length === 0
              ? "Nothing essential for your inputs"
              : `${essentials.length} essential${essentials.length === 1 ? "" : "s"}${optional.length > 0 ? ` + ${optional.length} optional` : ""}`}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCopy}
            className="text-sm font-semibold text-[#059669] hover:text-[#047857] transition-colors inline-flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Copied
              </>
            ) : (
              <>Copy my stack</>
            )}
          </button>
          <button
            type="button"
            onClick={reset}
            className="text-sm font-semibold text-[#525252] hover:text-[#0A0A0A] transition-colors"
          >
            Retake
          </button>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-8">
        {essentials.length > 0 && (
          <StackSection
            eyebrow="Essentials"
            description="The highest-confidence picks for your goal — start here."
            picks={essentials}
          />
        )}
        {optional.length > 0 && (
          <StackSection
            eyebrow="Optional add-ons"
            description="Situational picks — add these if your budget allows or the reason fits."
            picks={optional}
          />
        )}
        {picks.length === 0 && (
          <div className="rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] p-6 text-center text-[#525252]">
            Based on your answers, you don&apos;t need any supplements right now.
            Stick to whole food, sleep, and consistent training — that covers 90%
            of the outcome.
          </div>
        )}

        <div className="rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] p-5">
          <p className={`${FIELD_LABEL} text-[#A3A3A3] mb-2`}>Keep learning</p>
          <ul className="space-y-1.5 text-sm">
            <li>
              <Link
                href="/tools/macro-calculator"
                className="font-semibold text-[#059669] hover:text-[#047857]"
              >
                Calculate your macros →
              </Link>{" "}
              <span className="text-[#A3A3A3]">protein target to pair with your stack</span>
            </li>
            <li>
              <Link
                href="/compare"
                className="font-semibold text-[#059669] hover:text-[#047857]"
              >
                Compare specific products →
              </Link>{" "}
              <span className="text-[#A3A3A3]">whey vs isolate, stim vs non-stim, etc.</span>
            </li>
            <li>
              <Link
                href="/category/supplements"
                className="font-semibold text-[#059669] hover:text-[#047857]"
              >
                Deep-dive supplement reviews →
              </Link>{" "}
              <span className="text-[#A3A3A3]">full breakdowns of every pick above</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function StackSection({
  eyebrow,
  description,
  picks,
}: {
  eyebrow: string;
  description: string;
  picks: Pick[];
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#059669] mb-1.5">
        {eyebrow}
      </p>
      <p className="text-sm text-[#525252] mb-4">{description}</p>
      <div className="space-y-3">
        {picks.map((p) => (
          <PickCard key={p.productId} pick={p} />
        ))}
      </div>
    </div>
  );
}

function PickCard({ pick }: { pick: Pick }) {
  const product = affiliateProducts[pick.productId];
  if (!product) return null;
  const imageUrl = product.imageUrl ?? "/images/products/placeholder.svg";
  const ctaLabel =
    product.source === "amazon" ? "Check price on Amazon" : "View deal";

  return (
    <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 md:p-5 flex flex-col sm:flex-row gap-4">
      <div className="relative w-16 h-16 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] flex-shrink-0 overflow-hidden">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          sizes="64px"
          className="object-contain"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-[#0A0A0A] leading-snug">{product.name}</p>
        <div className="flex items-baseline gap-3 mt-0.5 text-sm text-[#525252]">
          <span>{product.rating.toFixed(1)} / 5</span>
          <span>·</span>
          <span>{product.priceRange}</span>
        </div>
        <p className="mt-2 text-[15px] leading-relaxed text-[#525252]">
          <span className="font-semibold text-[#0A0A0A]">Why this pick:</span>{" "}
          {pick.reason}
        </p>
      </div>
      <a
        href={product.url}
        target="_blank"
        rel="noopener noreferrer nofollow sponsored"
        className="sm:self-center inline-flex items-center justify-center gap-1.5 bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
      >
        {ctaLabel}
        <span aria-hidden>→</span>
      </a>
    </div>
  );
}
