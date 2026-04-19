"use client";

import Link from "next/link";
import { useState } from "react";
import { brand } from "@/lib/brand";

const categories = [
  { slug: "home-workouts", label: "Workouts" },
  { slug: "supplements", label: "Supplements" },
  { slug: "diet-nutrition", label: "Diet & Nutrition" },
  { slug: "weight-loss", label: "Weight Loss" },
  { slug: "muscle-building", label: "Muscle Building" },
  { slug: "wellness", label: "Wellness" },
];

const NAV_LINK =
  "text-sm font-medium text-[#525252] hover:text-[#0A0A0A] transition-colors";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E5E5E5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="w-8 h-8 rounded-lg bg-[#059669] flex items-center justify-center text-white text-[11px] font-bold tracking-tight">
              {brand.shortName}
            </span>
            <span className="text-lg font-bold text-[#0A0A0A] tracking-tight">
              {brand.name}
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-5">
            {/* All Articles with hover dropdown */}
            <div className="group relative py-4 -my-4">
              <Link
                href="/blog"
                className={`${NAV_LINK} inline-flex items-center gap-1`}
              >
                All Articles
                <svg
                  className="w-3.5 h-3.5 text-[#A3A3A3] transition-transform group-hover:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </Link>

              <div
                className="invisible opacity-0 translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-150 absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 rounded-xl border border-[#E5E5E5] bg-white shadow-lg overflow-hidden"
                role="menu"
              >
                <ul className="py-2">
                  {categories.map((cat) => (
                    <li key={cat.slug}>
                      <Link
                        href={`/category/${cat.slug}`}
                        className="block px-4 py-2 text-sm font-medium text-[#0A0A0A] hover:bg-[#FAFAFA] hover:text-[#059669] transition-colors"
                        role="menuitem"
                      >
                        {cat.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-[#F5F5F5] py-2">
                  <Link
                    href="/blog"
                    className="block px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#525252] hover:bg-[#FAFAFA] hover:text-[#059669] transition-colors"
                    role="menuitem"
                  >
                    Browse all →
                  </Link>
                </div>
              </div>
            </div>

            <Link href="/tools" className={NAV_LINK}>
              Tools
            </Link>
            <Link href="/compare" className={NAV_LINK}>
              Compare
            </Link>
            <Link href="/about" className={NAV_LINK}>
              About
            </Link>
            <Link
              href="/#newsletter"
              className="text-sm font-semibold bg-[#059669] hover:bg-[#047857] text-white px-4 py-2 rounded-lg transition-colors"
            >
              Subscribe
            </Link>
          </div>

          <button
            className="md:hidden p-2 rounded-md text-[#525252] hover:text-[#0A0A0A] hover:bg-[#FAFAFA]"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-[#E5E5E5] py-3">
            <div className="flex flex-col gap-1">
              <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#A3A3A3]">
                Categories
              </p>
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2 text-sm font-medium text-[#525252] hover:text-[#0A0A0A] hover:bg-[#FAFAFA] rounded-md transition-colors"
                >
                  {cat.label}
                </Link>
              ))}
              <div className="border-t border-[#F5F5F5] my-2" />
              <Link
                href="/blog"
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-[#525252] hover:text-[#0A0A0A] hover:bg-[#FAFAFA] rounded-md transition-colors"
              >
                All Articles
              </Link>
              <Link
                href="/tools"
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-[#525252] hover:text-[#0A0A0A] hover:bg-[#FAFAFA] rounded-md transition-colors"
              >
                Tools
              </Link>
              <Link
                href="/compare"
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-[#525252] hover:text-[#0A0A0A] hover:bg-[#FAFAFA] rounded-md transition-colors"
              >
                Compare
              </Link>
              <Link
                href="/about"
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-[#525252] hover:text-[#0A0A0A] hover:bg-[#FAFAFA] rounded-md transition-colors"
              >
                About
              </Link>
              <Link
                href="/#newsletter"
                onClick={() => setMenuOpen(false)}
                className="mx-3 mt-2 text-sm font-semibold text-center bg-[#059669] hover:bg-[#047857] text-white px-4 py-2 rounded-lg transition-colors"
              >
                Subscribe
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
