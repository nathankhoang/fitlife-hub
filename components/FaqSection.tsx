import type { FaqItem } from "@/lib/articles";

type Props = {
  items: FaqItem[];
};

export default function FaqSection({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="mt-16 border-t border-[#E5E5E5] pt-12"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#059669] mb-3">
        Frequently asked
      </p>
      <h2
        id="faq-heading"
        className="text-2xl md:text-3xl font-bold text-[#0A0A0A] tracking-tight mb-8"
      >
        Questions people ask about this
      </h2>

      <div className="rounded-2xl border border-[#E5E5E5] bg-white overflow-hidden divide-y divide-[#E5E5E5]">
        {items.map(({ question, answer }, i) => (
          <details
            key={i}
            className="group [&[open]>summary>.faq-chevron]:rotate-180"
          >
            <summary className="flex items-start gap-4 cursor-pointer list-none px-5 py-5 hover:bg-[#FAFAFA] transition-colors">
              <span className="flex-1 text-base md:text-lg font-semibold text-[#0A0A0A] leading-snug">
                {question}
              </span>
              <svg
                className="faq-chevron w-5 h-5 text-[#A3A3A3] flex-shrink-0 mt-1 transition-transform duration-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </summary>
            <div className="px-5 pb-5 -mt-1">
              <p className="text-[#525252] leading-relaxed text-[15px]">
                {answer}
              </p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
