"use client";

export default function NewsletterCTA() {
  return (
    <section className="bg-gradient-to-r from-[#16A34A] to-[#15803D] rounded-2xl p-8 md:p-12 text-center text-white">
      <h2 className="text-2xl md:text-3xl font-bold mb-3">
        Get Weekly Fitness Tips
      </h2>
      <p className="text-green-100 mb-6 max-w-md mx-auto text-sm md:text-base">
        Join thousands of readers getting evidence-based workout tips, supplement
        guides, and diet advice every week. No spam, ever.
      </p>
      <form
        className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          type="email"
          placeholder="your@email.com"
          className="flex-1 px-4 py-3 rounded-lg text-[#111827] text-sm outline-none focus:ring-2 focus:ring-white/50 bg-white"
          required
        />
        <button
          type="submit"
          className="bg-[#F97316] hover:bg-[#EA6C0A] text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm whitespace-nowrap"
        >
          Subscribe Free
        </button>
      </form>
      <p className="text-green-200 text-xs mt-3">
        No spam. Unsubscribe at any time.
      </p>
    </section>
  );
}
