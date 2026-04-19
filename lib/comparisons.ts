import { affiliateProducts, type AffiliateProduct } from "./affiliates";

export type ComparisonPick = {
  label: string;
  productId: string;
  reason: string;
};

export type ComparisonSide = {
  productId: string;
  heading: string;
  summary: string;
  pros: string[];
  cons: string[];
};

export type Comparison = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  category: string;
  a: ComparisonSide;
  b: ComparisonSide;
  picks: ComparisonPick[];
  verdict: string;
  faq: { question: string; answer: string }[];
};

export const comparisons: Comparison[] = [
  {
    slug: "whey-concentrate-vs-isolate",
    title: "Whey Concentrate vs Whey Isolate",
    metaTitle: "Whey Concentrate vs Isolate — Which Protein Powder Wins?",
    metaDescription:
      "Whey concentrate vs isolate compared head-to-head. Protein per serving, lactose, price, mixability, and who each one is actually best for.",
    intro:
      "Both are whey-based, both deliver fast-absorbing complete protein, and both get the job done for most lifters. The differences come down to processing, lactose content, protein density per scoop, and price per gram of actual protein — which matters more for some goals than others.",
    category: "Protein powders",
    a: {
      productId: "optimum-nutrition-gold-standard",
      heading: "Best overall whey concentrate",
      summary:
        "The world's best-selling whey protein. 24g protein per serving, good mixability, excellent flavor range, and one of the lowest costs per gram on the market. Contains some lactose and fat — fine for most, potentially an issue for lactose-sensitive users.",
      pros: [
        "24g protein per serving",
        "Low cost per gram of protein",
        "Trusted brand, decades of track record",
        "Wide flavor selection and easy to find",
      ],
      cons: [
        "Contains lactose (3–4g per serving)",
        "Slightly higher in fat and carbs than isolates",
        "Can taste sweet — some find flavors over-sweetened",
      ],
    },
    b: {
      productId: "myprotein-impact-whey",
      heading: "Best whey isolate (ISO100)",
      summary:
        "Dymatize ISO100 — whey protein isolate filtered to remove most lactose and fat. 25g protein per serving with <1g fat and <1g carbs. Premium price, premium macros. The go-to if you're lactose-sensitive or cutting.",
      pros: [
        "25g protein, <1g fat, <1g carbs",
        "Lactose-free (hydrolyzed + isolated)",
        "Mixes faster than concentrate",
        "Best choice for aggressive cuts",
      ],
      cons: [
        "~30–50% higher cost per serving than concentrate",
        "Slightly thinner mouthfeel than concentrate",
        "Fewer flavor options in some markets",
      ],
    },
    picks: [
      {
        label: "Best overall value",
        productId: "optimum-nutrition-gold-standard",
        reason:
          "Cheaper per gram of protein and covers 95% of use cases. If you don't have a specific reason to pay more, pick this.",
      },
      {
        label: "Best for cutting phases",
        productId: "myprotein-impact-whey",
        reason:
          "Lower fat and carbs mean more protein per calorie — useful when every macro counts.",
      },
      {
        label: "Best if lactose sensitive",
        productId: "myprotein-impact-whey",
        reason:
          "Isolates filter out nearly all lactose. Concentrate will bother lactose-sensitive users.",
      },
    ],
    verdict:
      "For most people training 3–5 days a week with no special dietary constraints, whey concentrate (Optimum Nutrition Gold Standard) wins — same protein hit, half the price. Reach for isolate only if you're cutting aggressively, tracking every macro, or lactose-sensitive.",
    faq: [
      {
        question: "Is isolate actually better than concentrate for building muscle?",
        answer:
          "Not meaningfully. Both hit the leucine threshold (~2.5g per serving) needed to trigger muscle protein synthesis in a 25g scoop. Gain data favor whichever you'll actually drink consistently — adherence beats protein-powder optimization every time.",
      },
      {
        question: "Which one is better for weight loss?",
        answer:
          "Isolate has a slight edge on a calorie-for-calorie basis — roughly 110 kcal per 25g scoop vs. 130 for concentrate. Over a 4-scoop day that's 80 kcal, which matters at the margins of a cut. Not life-changing.",
      },
      {
        question: "Can I mix concentrate and isolate?",
        answer:
          "Yes. Many pre-made 'whey blends' do exactly that — concentrate for value and flavor, isolate for macro profile. You can also buy both and mix scoops yourself.",
      },
      {
        question: "What about hydrolyzed whey?",
        answer:
          "Hydrolyzed whey (pre-digested isolate) absorbs marginally faster than regular isolate, but the difference is irrelevant outside of peri-workout timing. Costs 2x as much for a negligible real-world edge for almost everyone.",
      },
    ],
  },
  {
    slug: "whey-vs-plant-protein",
    title: "Whey Protein vs Plant Protein",
    metaTitle: "Whey vs Plant Protein — Which Is Better for Muscle?",
    metaDescription:
      "Whey vs plant protein powders compared: amino acid profile, muscle-building effectiveness, digestion, and taste. Honest verdict for both goals and diets.",
    intro:
      "The short version: whey is slightly better for muscle building on a gram-for-gram basis, but a well-formulated plant blend is close enough that the gap disappears at higher doses. Plant protein wins on digestive comfort for lactose-sensitive users and on fit with vegan diets — whey wins on price and leucine density.",
    category: "Protein powders",
    a: {
      productId: "optimum-nutrition-gold-standard",
      heading: "Whey — Optimum Nutrition Gold Standard",
      summary:
        "Fast-absorbing dairy-based protein with the most favorable amino acid profile for muscle protein synthesis. High leucine, cheap per gram, well-studied. The default choice unless a specific reason says otherwise.",
      pros: [
        "Highest leucine per scoop of any protein type",
        "Cheapest per gram of complete protein",
        "Fast absorption (peaks ~30 min)",
        "Decades of research backing muscle-building effects",
      ],
      cons: [
        "Contains lactose",
        "Not suitable for vegan or dairy-free diets",
        "Some users report bloating or GI discomfort",
      ],
    },
    b: {
      productId: "orgain-organic-protein",
      heading: "Plant — Orgain Organic Protein",
      summary:
        "Pea + brown rice + chia blend. 21g protein per serving, dairy-free, soy-free, non-GMO. Complete amino acid profile via the pea/rice combo, though slightly lower leucine than whey.",
      pros: [
        "Vegan and dairy-free",
        "Easier on the stomach for lactose-sensitive users",
        "Complete amino profile (pea + rice combo)",
        "Certified organic ingredients",
      ],
      cons: [
        "Lower leucine per scoop (~1.8g vs ~2.7g in whey)",
        "Higher cost per gram of protein",
        "Chalkier texture that some dislike",
        "21g protein per serving (slightly less than whey)",
      ],
    },
    picks: [
      {
        label: "Best for pure muscle building",
        productId: "optimum-nutrition-gold-standard",
        reason:
          "More leucine per scoop and stronger research base. If diet allows, whey is the higher-leverage pick.",
      },
      {
        label: "Best for vegans or lactose-sensitive users",
        productId: "orgain-organic-protein",
        reason:
          "Fits the diet, digests more comfortably, and closes 90% of the muscle-building gap at adequate daily protein intake.",
      },
      {
        label: "Best value per gram of protein",
        productId: "optimum-nutrition-gold-standard",
        reason:
          "Whey concentrate wins on cost per gram by a clear margin. Plant blends pay a premium for the sourcing.",
      },
    ],
    verdict:
      "If you can tolerate dairy and have no ethical objection, whey wins on cost and muscle-building output. If you're vegan, dairy-free, or lactose-sensitive, a quality plant blend like Orgain closes most of the gap — the real determinant is whether you hit your total daily protein target, not which powder you chose.",
    faq: [
      {
        question: "Can you build muscle on plant protein alone?",
        answer:
          "Yes. Studies comparing whey and well-formulated plant blends at matched doses show similar muscle gains when total daily protein hits 1.6–2.2 g/kg. The main caveat: plant proteins are lower in leucine per gram, so you may need slightly larger doses (30g vs 25g) to hit the same muscle-protein-synthesis trigger.",
      },
      {
        question: "Is pea protein as good as whey?",
        answer:
          "Nearly — pea protein is the most leucine-rich plant option and the closest single-source analog to whey. A 2015 study (Babault et al.) showed pea and whey produced equivalent strength and muscle thickness gains over 12 weeks of resistance training. Pairing pea with rice improves the amino acid profile further.",
      },
      {
        question: "Which one is easier to digest?",
        answer:
          "Depends on the person. Plant proteins cause less GI discomfort for lactose-sensitive users but can cause bloating from the legume base for others. Whey isolates are well-tolerated by most but can bother users with dairy sensitivity. Try a small bag of each before committing to a big tub.",
      },
    ],
  },
  {
    slug: "stim-vs-non-stim-pre-workout",
    title: "Stim vs Non-Stim Pre-Workout",
    metaTitle: "Stim vs Non-Stim Pre-Workout — Which Fits Your Training?",
    metaDescription:
      "Stimulant pre-workouts vs caffeine-free pumps: what each does, who they're best for, and whether you can stack them. Real verdict, no hype.",
    intro:
      "Pre-workouts split into two camps: stim-based (caffeine + focus stimulants for energy and drive) and non-stim (pump, performance, and endurance without the jitters). They solve different problems, so the right question isn't \"which is better\" — it's \"what do you need to fix in your training?\"",
    category: "Pre-workouts",
    a: {
      productId: "cellucor-c4-preworkout",
      heading: "Stim — Cellucor C4",
      summary:
        "America's #1 pre-workout brand. Caffeine + beta-alanine + creatine + arginine blend for energy, focus, and pump. Cheaper than clinically-dosed alternatives, available everywhere, reliable.",
      pros: [
        "150mg caffeine — moderate stim hit, not overwhelming",
        "Tingly beta-alanine 'feels like it's working'",
        "Inexpensive and widely available",
        "Good flavor selection",
      ],
      cons: [
        "Proprietary blend (doses aren't disclosed)",
        "Can cause jitters or sleep disruption late in the day",
        "Tolerance builds; need cycling or breaks",
        "Some ingredients sub-clinical dose",
      ],
    },
    b: {
      productId: "legion-pulse-preworkout",
      heading: "Clinically dosed stim — Legion Pulse",
      summary:
        "Transparent-label pre-workout with clinically-dosed active ingredients — 350mg caffeine from two sources, 2.6g beta-alanine, 2.5g betaine, 6g citrulline malate. Premium price, premium execution.",
      pros: [
        "Fully disclosed ingredient doses",
        "Clinically effective doses (not sprinkled)",
        "Stronger and longer-lasting than typical pre-workouts",
        "Naturally sweetened, no artificial dyes",
      ],
      cons: [
        "Expensive (~$45 per tub)",
        "350mg caffeine is a lot — not for mid-day or evening lifts",
        "Some users find the flavors less indulgent than mass-market brands",
      ],
    },
    picks: [
      {
        label: "Best on a budget",
        productId: "cellucor-c4-preworkout",
        reason:
          "Half the price of clinically-dosed competitors, gets 70% of the result for most lifters.",
      },
      {
        label: "Best for serious lifters who want real effects",
        productId: "legion-pulse-preworkout",
        reason:
          "Ingredients are at evidence-backed doses and the label shows exactly what you're getting. You feel the difference.",
      },
      {
        label: "Best for evening training",
        productId: "cellucor-c4-preworkout",
        reason:
          "Lower caffeine (150mg) means less sleep disruption after a late-afternoon or evening session.",
      },
    ],
    verdict:
      "Cellucor C4 is the right call if you want a cheap, reliable stim pre-workout and don't need disclosed doses. Legion Pulse earns the higher price by putting effective ingredient amounts on a transparent label — if you're past the beginner phase and want a pre-workout that measurably moves the needle, it's worth the jump.",
    faq: [
      {
        question: "Can I just drink coffee instead of pre-workout?",
        answer:
          "For the energy effect, yes — 150–300mg caffeine from coffee gets most of the way there for half the cost. What pre-workouts add beyond caffeine: beta-alanine for muscle-endurance (the tingles), citrulline malate for blood flow and pump, and creatine in some blends. If you already supplement those separately, black coffee is a fine stand-in.",
      },
      {
        question: "Should I cycle off pre-workouts?",
        answer:
          "Worth considering every 6–8 weeks if you take it daily. Caffeine tolerance builds fast, and a one-week off-cycle restores most of the sensitivity. Beta-alanine doesn't need cycling — its effect comes from saturation and persists as long as you keep taking it.",
      },
      {
        question: "Are pre-workouts safe long-term?",
        answer:
          "For healthy adults taking them as directed, yes. The main concerns are caffeine tolerance, sleep disruption if taken too close to bedtime, and stacking caffeine with other sources unknowingly. Skip pre-workouts entirely if you have cardiovascular issues, high blood pressure, or pregnancy.",
      },
    ],
  },
];

export function getComparison(slug: string): Comparison | null {
  return comparisons.find((c) => c.slug === slug) ?? null;
}

export function getProduct(productId: string): AffiliateProduct | null {
  return affiliateProducts[productId] ?? null;
}
