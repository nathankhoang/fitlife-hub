import { brand } from "./brand";

export type AffiliateProduct = {
  id: string;
  name: string;
  description: string;
  rating: number;
  reviewCount?: number;
  priceRange: string;
  url: string;
  source: "amazon" | "clickbank" | "shareasale";
  imageUrl?: string;
  bestFor?: string;
  pros?: string[];
  cons?: string[];
  secondaryUrl?: string;
  secondaryLabel?: string;
};

const amz = (asin: string) =>
  `https://www.amazon.com/dp/${asin}?tag=${brand.affiliates.amazonTag}`;
const img = (id: string, ext: "webp" | "svg" = "webp") => `/images/products/${id}.${ext}`;

export const affiliateProducts: Record<string, AffiliateProduct> = {
  // ── PROTEIN / WHEY ──────────────────────────────────────────────────────────
  "optimum-nutrition-gold-standard": {
    id: "optimum-nutrition-gold-standard",
    name: "Optimum Nutrition Gold Standard 100% Whey",
    description:
      "The world's best-selling whey protein powder. 24g protein per serving, low sugar, mixes easily.",
    rating: 4.8,
    priceRange: "$30–$60",
    url: amz("B000QSNYGI"),
    source: "amazon",
    imageUrl: img("optimum-nutrition-gold-standard"),
  },
  "myprotein-impact-whey": {
    id: "myprotein-impact-whey",
    name: "Dymatize ISO100 Whey Protein Isolate",
    description:
      "Fast-absorbing whey isolate with 25g protein and under 1g of fat and sugar per serving. Great for post-workout.",
    rating: 4.7,
    priceRange: "$35–$60",
    url: amz("B099HXNRKK"),
    source: "amazon",
    imageUrl: img("myprotein-impact-whey"),
  },
  "orgain-organic-protein": {
    id: "orgain-organic-protein",
    name: "Orgain Organic Protein Powder (Plant-Based)",
    description:
      "21g of organic plant protein per serving. Dairy-free, soy-free, non-GMO. Great for vegans and those with lactose intolerance.",
    rating: 4.5,
    priceRange: "$20–$35",
    url: amz("B00J074W7Q"),
    source: "amazon",
    imageUrl: img("orgain-organic-protein"),
  },
  "quest-protein-bars": {
    id: "quest-protein-bars",
    name: "Quest Nutrition Protein Bars (12-Pack)",
    description:
      "20–21g protein, low net carbs, and high fiber. A convenient on-the-go snack that fits most diet plans.",
    rating: 4.6,
    priceRange: "$20–$30",
    url: amz("B01BKG830Q"),
    source: "amazon",
    imageUrl: img("quest-protein-bars"),
  },
  "rxbar-protein-bars": {
    id: "rxbar-protein-bars",
    name: "RXBAR Whole Food Protein Bars (12-Pack)",
    description:
      "12g protein with no artificial additives. Made from egg whites, dates, and nuts — whole-food ingredients only.",
    rating: 4.5,
    priceRange: "$18–$28",
    url: amz("B018H3LFJG"),
    source: "amazon",
    imageUrl: img("rxbar-protein-bars"),
  },

  // ── CREATINE / PRE-WORKOUT ───────────────────────────────────────────────────
  "creatine-monohydrate-bulk": {
    id: "creatine-monohydrate-bulk",
    name: "BulkSupplements Creatine Monohydrate",
    description:
      "Pure micronized creatine monohydrate. No fillers, no additives. Lab-tested for purity.",
    rating: 4.7,
    priceRange: "$20–$40",
    url: amz("B00E9M4XEE"),
    source: "amazon",
    imageUrl: img("creatine-monohydrate-bulk"),
  },
  "cellucor-c4-preworkout": {
    id: "cellucor-c4-preworkout",
    name: "Cellucor C4 Original Pre-Workout",
    description:
      "America's #1 pre-workout brand. Energy, focus, and pump to power through your toughest sessions.",
    rating: 4.5,
    priceRange: "$30–$45",
    url: amz("B01N272UAI"),
    source: "amazon",
    imageUrl: img("cellucor-c4-preworkout"),
  },
  "legion-pulse-preworkout": {
    id: "legion-pulse-preworkout",
    name: "Legion Pulse Pre-Workout",
    description:
      "Clinically dosed, naturally sweetened pre-workout. No artificial dyes. 350mg caffeine from two sources.",
    rating: 4.7,
    priceRange: "$45–$50",
    url: amz("B00QYZ6MLG"),
    source: "amazon",
    imageUrl: img("legion-pulse-preworkout"),
  },
  "bcaa-xtend": {
    id: "bcaa-xtend",
    name: "Xtend Original BCAA Powder",
    description:
      "7g BCAAs per serving in the proven 2:1:1 ratio. Zero sugar, hydration minerals, and 14 flavors. Supports muscle recovery and endurance.",
    rating: 4.6,
    priceRange: "$25–$40",
    url: amz("B005CH0EM0"),
    source: "amazon",
    imageUrl: img("bcaa-xtend"),
  },

  // ── VITAMINS / SUPPLEMENTS ───────────────────────────────────────────────────
  "thorne-multivitamin": {
    id: "thorne-multivitamin",
    name: "Thorne Basic Nutrients 2/Day",
    description:
      "NSF Certified multivitamin for athletes. Highly bioavailable forms of key vitamins and minerals.",
    rating: 4.8,
    priceRange: "$35–$45",
    url: amz("B09YJ2Q2D1"),
    source: "amazon",
    imageUrl: img("thorne-multivitamin"),
  },
  "garden-of-life-multivitamin": {
    id: "garden-of-life-multivitamin",
    name: "Garden of Life Sport Multivitamin",
    description:
      "Certified organic whole food multivitamin for athletes. Includes probiotics and antioxidants.",
    rating: 4.6,
    priceRange: "$30–$40",
    url: amz("B00K5NEKT4"),
    source: "amazon",
    imageUrl: img("garden-of-life-multivitamin"),
  },
  "fish-oil-nordic-naturals": {
    id: "fish-oil-nordic-naturals",
    name: "Nordic Naturals Ultimate Omega",
    description:
      "1,280mg of EPA+DHA per serving. Third-party tested for purity and freshness. Reduces inflammation and supports heart health.",
    rating: 4.7,
    priceRange: "$30–$55",
    url: amz("B002CQU564"),
    source: "amazon",
    imageUrl: img("fish-oil-nordic-naturals"),
  },
  "vitamin-d3-sports-research": {
    id: "vitamin-d3-sports-research",
    name: "Sports Research Vitamin D3 + K2 (5000 IU)",
    description:
      "Bioavailable D3 paired with K2 for calcium regulation. Supports bone density, immunity, and testosterone levels.",
    rating: 4.7,
    priceRange: "$15–$22",
    url: amz("B07255MPRN"),
    source: "amazon",
    imageUrl: img("vitamin-d3-sports-research"),
  },
  "magnesium-glycinate": {
    id: "magnesium-glycinate",
    name: "Doctor's Best High Absorption Magnesium Glycinate",
    description:
      "Highly bioavailable magnesium chelate. Supports muscle relaxation, deep sleep, stress reduction, and recovery.",
    rating: 4.7,
    priceRange: "$12–$22",
    url: amz("B000BD0RT0"),
    source: "amazon",
    imageUrl: img("magnesium-glycinate"),
  },
  "ashwagandha-ksm66": {
    id: "ashwagandha-ksm66",
    name: "Jarrow Formulas Ashwagandha (KSM-66)",
    description:
      "300mg KSM-66 ashwagandha root extract. Clinically studied to reduce cortisol, improve sleep quality, and boost strength.",
    rating: 4.6,
    priceRange: "$15–$25",
    url: amz("B0013OQEO8"),
    source: "amazon",
    imageUrl: img("ashwagandha-ksm66"),
  },
  "melatonin-natrol": {
    id: "melatonin-natrol",
    name: "Natrol Melatonin 5mg Fast Dissolve (90ct)",
    description:
      "Drug-free sleep aid that helps you fall asleep faster. Strawberry flavor, dissolves instantly — no water needed.",
    rating: 4.6,
    priceRange: "$8–$14",
    url: amz("B07S38C5WW"),
    source: "amazon",
    imageUrl: img("melatonin-natrol"),
  },
  "collagen-vital-proteins": {
    id: "collagen-vital-proteins",
    name: "Vital Proteins Collagen Peptides",
    description:
      "20g collagen per serving. Supports joint health, skin elasticity, and connective tissue repair. Unflavored, mixes into any beverage.",
    rating: 4.7,
    priceRange: "$25–$45",
    url: amz("B07H85ZDLG"),
    source: "amazon",
    imageUrl: img("collagen-vital-proteins"),
  },
  "turmeric-curcumin": {
    id: "turmeric-curcumin",
    name: "Sports Research Turmeric Curcumin with BioPerine",
    description:
      "500mg curcuminoids with 95% standardized extract. BioPerine increases absorption by 2,000%. Anti-inflammatory for joint and recovery support.",
    rating: 4.7,
    priceRange: "$18–$28",
    url: amz("B00A39MPNI"),
    source: "amazon",
    imageUrl: img("turmeric-curcumin"),
  },

  // ── SLEEP ────────────────────────────────────────────────────────────────────
  "sleep-mask-alaska-bear": {
    id: "sleep-mask-alaska-bear",
    name: "Alaska Bear Natural Silk Sleep Mask",
    description:
      "Ultra-soft 100% natural mulberry silk. Blocks 100% of light without putting pressure on eyes. Includes earplugs.",
    rating: 4.5,
    priceRange: "$8–$15",
    url: amz("B07L91H64N"),
    source: "amazon",
    imageUrl: img("sleep-mask-alaska-bear"),
  },
  "white-noise-machine": {
    id: "white-noise-machine",
    name: "LectroFan High Fidelity White Noise Machine",
    description:
      "20 non-looping fan and white noise sounds. Masks disruptive sounds for deeper, uninterrupted sleep. Used in sleep clinics.",
    rating: 4.6,
    priceRange: "$45–$60",
    url: amz("B00E6D6LQY"),
    source: "amazon",
    imageUrl: img("white-noise-machine"),
  },

  // ── CARDIO / FAT LOSS ────────────────────────────────────────────────────────
  "jump-rope-wod-nation": {
    id: "jump-rope-wod-nation",
    name: "WOD Nation Speed Jump Rope",
    description:
      "Ball-bearing speed rope for HIIT and double-unders. Adjustable cable, lightweight aluminum handles. Burns 400+ calories per 30 min.",
    rating: 4.6,
    priceRange: "$10–$18",
    url: amz("B06XPH9TCZ"),
    source: "amazon",
    imageUrl: img("jump-rope-wod-nation"),
  },
  "fitness-tracker-fitbit": {
    id: "fitness-tracker-fitbit",
    name: "Fitbit Charge 6 Fitness Tracker",
    description:
      "Built-in GPS, heart rate monitoring, sleep tracking, and 40+ exercise modes. Google Maps and Wallet integration.",
    rating: 4.4,
    priceRange: "$100–$160",
    url: amz("B0CBLKJ3KC"),
    source: "amazon",
    imageUrl: img("fitness-tracker-fitbit"),
  },

  // ── RECOVERY ────────────────────────────────────────────────────────────────
  "foam-roller": {
    id: "foam-roller",
    name: "TriggerPoint GRID Foam Roller",
    description:
      "Multi-density foam roller for muscle recovery and myofascial release. Used by pro athletes.",
    rating: 4.7,
    priceRange: "$30–$40",
    url: amz("B0040EGNIU"),
    source: "amazon",
    imageUrl: img("foam-roller"),
  },
  "massage-gun-renpho": {
    id: "massage-gun-renpho",
    name: "RENPHO R3 Mini Massage Gun",
    description:
      "5 speeds, 6 interchangeable heads, 50 lbs of percussion force. Ultra-quiet motor. Reaches deep tissue in 15 minutes.",
    rating: 4.5,
    priceRange: "$40–$65",
    url: amz("B09TXCY8RW"),
    source: "amazon",
    imageUrl: img("massage-gun-renpho"),
  },
  "compression-socks": {
    id: "compression-socks",
    name: "Physix Gear Sport Compression Socks (3-Pack)",
    description:
      "20-30 mmHg graduated compression. Reduces soreness, swelling, and fatigue during and after exercise.",
    rating: 4.6,
    priceRange: "$14–$22",
    url: amz("B08N1HRWWQ"),
    source: "amazon",
    imageUrl: img("compression-socks"),
  },
  "epsom-salt-dr-teals": {
    id: "epsom-salt-dr-teals",
    name: "Dr Teal's Pure Epsom Salt Soak (6 lbs)",
    description:
      "Pure magnesium sulfate soak. Relieves sore muscles, reduces inflammation, and promotes relaxation post-workout.",
    rating: 4.8,
    priceRange: "$8–$16",
    url: amz("B00A9GNA3E"),
    source: "amazon",
    imageUrl: img("epsom-salt-dr-teals"),
  },

  // ── HOME GYM / EQUIPMENT ────────────────────────────────────────────────────
  "resistance-bands-set": {
    id: "resistance-bands-set",
    name: "Fit Simplify Resistance Loop Bands (5-Pack)",
    description:
      "Premium latex resistance bands for all fitness levels. Perfect for home workouts, stretching, and rehab.",
    rating: 4.7,
    priceRange: "$10–$15",
    url: amz("B01AVDVHTI"),
    source: "amazon",
    imageUrl: img("resistance-bands-set"),
  },
  "adjustable-dumbbells": {
    id: "adjustable-dumbbells",
    name: "Bowflex SelectTech 552 Adjustable Dumbbells",
    description:
      "Replace 15 sets of weights. Dial adjusts from 5 to 52.5 lbs. Space-saving design for home gyms.",
    rating: 4.8,
    priceRange: "$300–$400",
    url: amz("B0FRNG2N5H"),
    source: "amazon",
    imageUrl: img("adjustable-dumbbells"),
  },
  "pull-up-bar": {
    id: "pull-up-bar",
    name: "Iron Gym Total Upper Body Workout Bar",
    description:
      "Doorframe pull-up bar with no screws required. Supports up to 300 lbs. Doubles as a dip station.",
    rating: 4.5,
    priceRange: "$25–$35",
    url: amz("B001EJMS6K"),
    source: "amazon",
    imageUrl: img("pull-up-bar"),
  },
  "yoga-mat": {
    id: "yoga-mat",
    name: "Manduka PRO Yoga Mat",
    description:
      "Lifetime guarantee yoga mat with supreme cushioning. 6mm thick, non-slip surface, eco-friendly.",
    rating: 4.8,
    priceRange: "$80–$120",
    url: amz("B01CGLCGRA"),
    source: "amazon",
    imageUrl: img("yoga-mat"),
  },
  "yoga-mat-budget": {
    id: "yoga-mat-budget",
    name: "Gaiam Essentials Thick Yoga Mat (10mm)",
    description:
      "10mm extra-thick comfort mat with non-slip texture. Includes carrying strap. Great entry-level option for beginners.",
    rating: 4.5,
    priceRange: "$20–$30",
    url: amz("B07J9WSQFZ"),
    source: "amazon",
    imageUrl: img("yoga-mat-budget"),
  },
  "ab-roller": {
    id: "ab-roller",
    name: "Perfect Fitness Ab Carver Pro",
    description:
      "Carbon steel spring provides resistance on the way out and assists on the way back. Works abs, obliques, and arms simultaneously.",
    rating: 4.5,
    priceRange: "$25–$40",
    url: amz("B0DNNT8RXY"),
    source: "amazon",
    imageUrl: img("ab-roller"),
  },
  "kettlebell-cap": {
    id: "kettlebell-cap",
    name: "CAP Barbell Cast Iron Kettlebell",
    description:
      "Single-piece cast iron construction. Flat base for stability. Available in multiple weights from 5 to 80 lbs. Budget-friendly.",
    rating: 4.7,
    priceRange: "$15–$60",
    url: amz("B00ACVQF34"),
    source: "amazon",
    imageUrl: img("kettlebell-cap"),
  },
  "push-up-handles": {
    id: "push-up-handles",
    name: "Perfect Fitness Push-Up Handles",
    description:
      "Rotating handles reduce wrist strain and increase chest activation. Includes workout guide.",
    rating: 4.4,
    priceRange: "$15–$25",
    url: amz("B00006IUWB"),
    source: "amazon",
    imageUrl: img("push-up-handles"),
  },
  "weight-bench-flybird": {
    id: "weight-bench-flybird",
    name: "Flybird Adjustable Weight Bench",
    description:
      "7 back-pad positions, folds flat for storage. 620 lb weight capacity. Great for dumbbell chest, shoulder, and incline press at home.",
    rating: 4.6,
    priceRange: "$140–$200",
    url: amz("B07DNYSJ8W"),
    source: "amazon",
    imageUrl: img("weight-bench-flybird"),
  },

  // ── NUTRITION / KITCHEN ──────────────────────────────────────────────────────
  "meal-prep-containers": {
    id: "meal-prep-containers",
    name: "Prep Naturals Glass Meal Prep Containers (10-Pack)",
    description:
      "1-cup and 2-cup borosilicate glass containers. Oven, microwave, freezer, and dishwasher safe. Ideal for weekly meal prep.",
    rating: 4.7,
    priceRange: "$35–$50",
    url: amz("B07RL66KCF"),
    source: "amazon",
    imageUrl: img("meal-prep-containers"),
  },
  "food-scale-etekcity": {
    id: "food-scale-etekcity",
    name: "Etekcity Digital Food Scale (0.1g precision)",
    description:
      "Measures in grams, ounces, pounds, and milliliters. Tare function, backlit display, auto-off. Essential for accurate macro tracking.",
    rating: 4.7,
    priceRange: "$10–$16",
    url: amz("B0113UZJE2"),
    source: "amazon",
    imageUrl: img("food-scale-etekcity"),
  },
  "nutribullet-blender": {
    id: "nutribullet-blender",
    name: "NutriBullet Pro 900W Personal Blender",
    description:
      "900-watt motor pulverizes whole foods into smooth shakes and smoothies. Includes 32oz and 24oz cups. Dishwasher-safe.",
    rating: 4.6,
    priceRange: "$60–$90",
    url: amz("B06Y3PS25W"),
    source: "amazon",
    imageUrl: img("nutribullet-blender"),
  },
};
