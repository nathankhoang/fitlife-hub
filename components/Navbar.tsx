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
    <header className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-[#16A34A]">FitLife</span>
            <span className="text-2xl font-bold text-[#111827]">Hub</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="px-3 py-2 text-sm font-medium text-[#6B7280] hover:text-[#16A34A] hover:bg-[#F8FAFC] rounded-md transition-colors"
              >
                {cat.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/blog"
              className="text-sm font-medium text-[#6B7280] hover:text-[#16A34A] transition-colors"
            >
              All Articles
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-[#6B7280] hover:text-[#16A34A] transition-colors"
            >
              About
            </Link>
          </div>

          <button
            className="md:hidden p-2 rounded-md text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAFC]"
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
          <div className="md:hidden border-t border-[#E5E7EB] py-3">
            <div className="flex flex-col gap-1">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2 text-sm font-medium text-[#6B7280] hover:text-[#16A34A] hover:bg-[#F8FAFC] rounded-md transition-colors"
                >
                  {cat.label}
                </Link>
              ))}
              <Link
                href="/blog"
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-[#6B7280] hover:text-[#16A34A] hover:bg-[#F8FAFC] rounded-md transition-colors"
              >
                All Articles
              </Link>
              <Link
                href="/about"
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-[#6B7280] hover:text-[#16A34A] hover:bg-[#F8FAFC] rounded-md transition-colors"
              >
                About
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
