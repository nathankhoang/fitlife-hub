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
    <footer className="bg-[#111827] text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-1 mb-3">
              <span className="text-xl font-bold text-[#16A34A]">FitLife</span>
              <span className="text-xl font-bold text-white">Hub</span>
            </div>
            <p className="text-[#9CA3AF] text-sm leading-relaxed">
              Your go-to resource for fitness tips, supplement reviews, and
              evidence-based wellness content. Build a healthier you, one
              article at a time.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-3">Categories</h3>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/category/${cat.slug}`}
                    className="text-[#9CA3AF] hover:text-[#16A34A] text-sm transition-colors"
                  >
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-3">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/blog"
                  className="text-[#9CA3AF] hover:text-[#16A34A] text-sm transition-colors"
                >
                  All Articles
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-[#9CA3AF] hover:text-[#16A34A] text-sm transition-colors"
                >
                  About Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#374151] mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-[#6B7280] text-xs">
            © {new Date().getFullYear()} FitLife Hub. All rights reserved.
          </p>
          <p className="text-[#6B7280] text-xs text-center md:text-right max-w-xl">
            <strong>Affiliate Disclosure:</strong> FitLife Hub participates in
            Amazon Associates and other affiliate programs. We may earn a
            commission when you purchase through our links at no extra cost to
            you.
          </p>
        </div>
      </div>
    </footer>
  );
}
