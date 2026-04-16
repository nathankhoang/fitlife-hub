export type AffiliateProduct = {
  id: string;
  name: string;
  description: string;
  rating: number;
  priceRange: string;
  url: string;
  source: "amazon" | "clickbank" | "shareasale";
  imageUrl?: string;
};

const TAG = "leanbodyengin-20";
const amz = (asin: string) =>
  `https://www.amazon.com/dp/${asin}?tag=${TAG}`;

export const affiliateProducts: Record<string, AffiliateProduct> = {
  "optimum-nutrition-gold-standard": {
    id: "optimum-nutrition-gold-standard",
    name: "Optimum Nutrition Gold Standard 100% Whey",
    description:
      "The world's best-selling whey protein powder. 24g protein per serving, low sugar, mixes easily.",
    rating: 4.8,
    priceRange: "$30–$60",
    url: amz("B000QSNYGI"),
    source: "amazon",
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
  },
  "creatine-monohydrate-bulk": {
    id: "creatine-monohydrate-bulk",
    name: "BulkSupplements Creatine Monohydrate",
    description:
      "Pure micronized creatine monohydrate. No fillers, no additives. Lab-tested for purity.",
    rating: 4.7,
    priceRange: "$20–$40",
    url: amz("B00E9M4XEE"),
    source: "amazon",
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
  },
  "thorne-multivitamin": {
    id: "thorne-multivitamin",
    name: "Thorne Basic Nutrients 2/Day",
    description:
      "NSF Certified multivitamin for athletes. Highly bioavailable forms of key vitamins and minerals.",
    rating: 4.8,
    priceRange: "$35–$45",
    url: amz("B09YJ2Q2D1"),
    source: "amazon",
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
  },
  "resistance-bands-set": {
    id: "resistance-bands-set",
    name: "Fit Simplify Resistance Loop Bands (5-Pack)",
    description:
      "Premium latex resistance bands for all fitness levels. Perfect for home workouts, stretching, and rehab.",
    rating: 4.7,
    priceRange: "$10–$15",
    url: amz("B01AVDVHTI"),
    source: "amazon",
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
  },
  "foam-roller": {
    id: "foam-roller",
    name: "TriggerPoint GRID Foam Roller",
    description:
      "Multi-density foam roller for muscle recovery and myofascial release. Used by pro athletes.",
    rating: 4.7,
    priceRange: "$30–$40",
    url: amz("B0040EGNIU"),
    source: "amazon",
  },
};
