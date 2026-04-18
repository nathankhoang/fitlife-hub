"use client";

import { useState, useEffect } from "react";

export type TocHeading = { level: number; text: string; id: string };

export default function TableOfContents({ headings }: { headings: TocHeading[] }) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "0px 0px -70% 0px" }
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="bg-[#FAFAFA] rounded-xl border border-[#E5E5E5] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#A3A3A3] mb-4">
        In this article
      </p>
      <ul className="space-y-2.5">
        {headings.map(({ level, text, id }) => (
          <li key={id} className={level >= 3 ? "pl-3" : ""}>
            <a
              href={`#${id}`}
              className={`block text-sm leading-snug transition-colors ${
                activeId === id
                  ? "text-[#059669] font-semibold"
                  : "text-[#525252] hover:text-[#0A0A0A]"
              }`}
            >
              {text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
