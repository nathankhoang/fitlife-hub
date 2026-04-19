import Link from "next/link";
import { brand } from "@/lib/brand";

const categories = [
  { slug: "home-workouts", label: "Home Workouts" },
  { slug: "supplements", label: "Supplement Reviews" },
  { slug: "diet-nutrition", label: "Diet & Nutrition" },
  { slug: "weight-loss", label: "Weight Loss" },
  { slug: "muscle-building", label: "Muscle Building" },
  { slug: "wellness", label: "Wellness" },
];

const topReviews = [
  { href: "/blog/best-protein-powders-2025", label: "Best Protein Powders" },
  { href: "/blog/best-creatine-supplements", label: "Best Creatine" },
  { href: "/blog/best-pre-workout-supplements", label: "Best Pre-Workouts" },
  { href: "/blog/best-multivitamins-athletes", label: "Best Multivitamins" },
  { href: "/blog/home-gym-setup-under-200", label: "Home Gym Guide" },
];

export default function Footer() {
  return (
    <footer className="bg-[#0f172a] text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-lg bg-[#059669] flex items-center justify-center text-white text-[11px] font-bold tracking-tight">{brand.shortName}</span>
              <span className="text-lg font-bold tracking-tight">{brand.name}</span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed">
              {brand.tagline}
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide">Categories</h3>
            <ul className="space-y-2.5">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/category/${cat.slug}`}
                    className="text-white/50 hover:text-white text-sm transition-colors"
                  >
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Top Reviews */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide">Top Reviews</h3>
            <ul className="space-y-2.5">
              {topReviews.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-white/50 hover:text-white text-sm transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Explore */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide">Explore</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/blog" className="text-white/50 hover:text-white text-sm transition-colors">
                  All Articles
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-white/50 hover:text-white text-sm transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/editorial-policy" className="text-white/50 hover:text-white text-sm transition-colors">
                  Editorial Policy
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-white/50 hover:text-white text-sm transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-white/50 hover:text-white text-sm transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-4">
            <p className="text-white/30 text-xs">
              © {new Date().getFullYear()} {brand.legalName}. All rights reserved.
            </p>
            <Link href="/admin" className="text-white/20 hover:text-white/50 text-xs transition-colors">
              Admin
            </Link>
          </div>
          <p className="text-white/30 text-xs text-center md:text-right max-w-xl">
            <strong className="text-white/50">Affiliate disclosure:</strong>{" "}
            {brand.name} participates in Amazon Associates. We may earn a commission
            on purchases made through our links at no extra cost to you.
          </p>
        </div>
      </div>
    </footer>
  );
}
