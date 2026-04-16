import { affiliateProducts, AffiliateProduct } from "./affiliates";
import { Category } from "./articles";

type ScoredProduct = AffiliateProduct & { score: number };

const productKeywords: Record<string, string[]> = {
  "optimum-nutrition-gold-standard": [
    "protein", "whey", "muscle", "recovery", "shake", "post-workout",
    "build muscle", "lean", "bulk", "mass",
  ],
  "myprotein-impact-whey": [
    "protein", "whey", "isolate", "lean", "cut", "post-workout",
    "recovery", "muscle", "low fat", "low sugar",
  ],
  "creatine-monohydrate-bulk": [
    "creatine", "strength", "power", "muscle", "gym", "bulk",
    "performance", "lifting", "mass", "monohydrate",
  ],
  "cellucor-c4-preworkout": [
    "pre-workout", "energy", "focus", "pump", "workout", "gym",
    "performance", "caffeine", "strength", "motivation",
  ],
  "legion-pulse-preworkout": [
    "pre-workout", "energy", "focus", "pump", "natural", "clean",
    "caffeine", "performance", "gym", "strength",
  ],
  "thorne-multivitamin": [
    "multivitamin", "vitamins", "minerals", "health", "wellness",
    "immune", "energy", "athlete", "nutrition", "micronutrients",
  ],
  "garden-of-life-multivitamin": [
    "multivitamin", "vitamins", "organic", "whole food", "health",
    "wellness", "athlete", "nutrition", "probiotic",
  ],
  "resistance-bands-set": [
    "resistance bands", "home workout", "bodyweight", "stretching",
    "rehab", "glutes", "legs", "flexibility", "portable", "no equipment",
  ],
  "adjustable-dumbbells": [
    "dumbbells", "home gym", "strength training", "weights", "lifting",
    "muscle", "upper body", "home workout", "equipment",
  ],
  "pull-up-bar": [
    "pull-ups", "chin-ups", "back", "upper body", "bodyweight",
    "home gym", "doorframe", "strength", "calisthenics",
  ],
  "yoga-mat": [
    "yoga", "stretching", "flexibility", "floor workout", "core",
    "meditation", "pilates", "home workout", "recovery", "wellness",
  ],
  "foam-roller": [
    "foam roller", "recovery", "muscle soreness", "myofascial",
    "mobility", "flexibility", "stretching", "wellness", "injury prevention",
  ],
};

const categoryKeywords: Record<Category, string[]> = {
  supplements: ["protein", "creatine", "pre-workout", "multivitamin", "supplement"],
  "muscle-building": ["creatine", "protein", "dumbbells", "strength", "muscle", "bulk"],
  "home-workouts": ["resistance bands", "pull-up bar", "yoga mat", "foam roller", "home gym", "adjustable dumbbells"],
  "weight-loss": ["protein", "pre-workout", "resistance bands", "cardio", "lean"],
  "diet-nutrition": ["protein", "multivitamin", "nutrition", "vitamins"],
  wellness: ["foam roller", "yoga mat", "multivitamin", "recovery", "flexibility"],
};

export function matchAffiliates(
  topic: string,
  category: Category,
  limit = 5
): AffiliateProduct[] {
  const topicLower = topic.toLowerCase();
  const catTerms = categoryKeywords[category] ?? [];

  const scored: ScoredProduct[] = Object.entries(affiliateProducts).map(
    ([id, product]) => {
      const keywords = productKeywords[id] ?? [];
      let score = 0;

      for (const kw of keywords) {
        if (topicLower.includes(kw)) {
          score += 3;
        } else if (topicLower.split(/\s+/).some((word) => kw.includes(word) && word.length > 3)) {
          score += 1;
        }
      }

      for (const term of catTerms) {
        if (keywords.includes(term)) {
          score += 2;
        }
      }

      return { ...product, score };
    }
  );

  return scored
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ score: _score, ...product }) => product);
}
