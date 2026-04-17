import Link from "next/link";

const categories = [
  { slug: "home-workouts", label: "Home Workouts" },
  { slug: "supplements", label: "Supplement Reviews" },
  { slug: "diet-nutrition", label: "Diet & Nutrition" },
  { slug: "weight-loss", label: "Weight Loss" },
  { slug: "muscle-building", label: "Muscle Building" },
  { slug: "wellness", label: "Wellness" },
];

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0A] text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-lg bg-[#059669] flex items-center justify-center text-white text-[11px] font-bold tracking-tight">LBE</span>
              <span className="text-lg font-semibold tracking-tight">LeanBodyEngine</span>
            </div>
            <p className="text-[#A3A3A3] text-sm leading-relaxed">
              Honest, evidence-based guides on training, supplements, and
              nutrition. No fluff. No miracle promises.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4 text-sm tracking-wide">CATEGORIES</h3>
            <ul className="space-y-2.5">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/category/${cat.slug}`}
                    className="text-[#A3A3A3] hover:text-white text-sm transition-colors"
                  >
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4 text-sm tracking-wide">EXPLORE</h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/blog"
                  className="text-[#A3A3A3] hover:text-white text-sm transition-colors"
                >
                  All Articles
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-[#A3A3A3] hover:text-white text-sm transition-colors"
                >
                  About Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#262626] mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-[#737373] text-xs">
            © {new Date().getFullYear()} LeanBodyEngine. All rights reserved.
          </p>
          <p className="text-[#737373] text-xs text-center md:text-right max-w-xl">
            <strong className="text-[#A3A3A3]">Affiliate disclosure:</strong>{" "}
            LeanBodyEngine participates in Amazon Associates and other affiliate
            programs. We may earn a commission on purchases made through our
            links at no extra cost to you.
          </p>
        </div>
      </div>
    </footer>
  );
}
