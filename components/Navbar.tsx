"use client";

import Link from "next/link";
import { useState } from "react";

const categories = [
  { slug: "home-workouts", label: "Workouts" },
  { slug: "supplements", label: "Supplements" },
  { slug: "diet-nutrition", label: "Diet & Nutrition" },
  { slug: "weight-loss", label: "Weight Loss" },
  { slug: "muscle-building", label: "Muscle Building" },
  { slug: "wellness", label: "Wellness" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E5E5E5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="w-8 h-8 rounded-lg bg-[#059669] flex items-center justify-center text-white text-[11px] font-bold tracking-tight">LBE</span>
            <span className="text-lg font-bold text-[#0A0A0A] tracking-tight">LeanBodyEngine</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="px-3 py-2 text-sm font-medium text-[#525252] hover:text-[#0A0A0A] rounded-md transition-colors"
              >
                {cat.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/blog"
              className="text-sm font-medium text-[#525252] hover:text-[#0A0A0A] transition-colors"
            >
              All Articles
            </Link>
            <Link
              href="/tools"
              className="text-sm font-medium text-[#525252] hover:text-[#0A0A0A] transition-colors"
            >
              Tools
            </Link>
            <Link
              href="/compare"
              className="text-sm font-medium text-[#525252] hover:text-[#0A0A0A] transition-colors"
            >
              Compare
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-[#525252] hover:text-[#0A0A0A] transition-colors"
            >
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
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-[#E5E5E5] py-3">
            <div className="flex flex-col gap-1">
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
