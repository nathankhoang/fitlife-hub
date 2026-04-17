"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_email: "That doesn't look like a valid email address.",
  not_configured: "The newsletter is launching soon — check back!",
  provider_error: "Couldn't subscribe right now. Try again in a moment.",
  network_error: "Network error. Check your connection and try again.",
};

export default function NewsletterCTA() {
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState(""); // honeypot
  const [status, setStatus] = useState<Status>("idle");
  const [errorKey, setErrorKey] = useState<string>("");
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorKey("");
    setAlreadySubscribed(false);

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, hp }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        alreadySubscribed?: boolean;
      };

      if (data.ok) {
        setStatus("success");
        setAlreadySubscribed(!!data.alreadySubscribed);
        setEmail("");
      } else {
        setStatus("error");
        setErrorKey(data.error ?? "provider_error");
      }
    } catch {
      setStatus("error");
      setErrorKey("network_error");
    }
  }

  const isSubmitting = status === "submitting";
  const isSuccess = status === "success";
  const isError = status === "error";

  return (
    <section className="relative overflow-hidden bg-[#0A0A0A] rounded-3xl p-8 md:p-14 text-center text-white">
      <div className="absolute inset-0 opacity-30 pointer-events-none" aria-hidden>
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#059669] blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#10B981] blur-3xl opacity-50" />
      </div>

      <div className="relative">
        <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#10B981] mb-4">
          Subscribe
        </span>
        <h2 className="text-2xl md:text-3xl font-semibold mb-3 tracking-tight">
          Never miss a new article
        </h2>
        <p className="text-[#A3A3A3] mb-7 max-w-md mx-auto text-sm md:text-base leading-relaxed">
          Get an email whenever we publish a new fitness guide, supplement
          review, or workout plan. One short email per post — that&apos;s it.
        </p>

        {isSuccess ? (
          <div className="max-w-md mx-auto bg-[#10B981]/10 border border-[#10B981]/40 rounded-lg px-5 py-4 text-sm text-[#10B981]">
            {alreadySubscribed
              ? "You're already on the list. Thanks!"
              : "You're in. Look for the next post in your inbox."}
          </div>
        ) : (
          <form
            className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
            onSubmit={onSubmit}
            noValidate
          >
            {/* Honeypot — hidden from users, visible to bots */}
            <input
              type="text"
              name="hp"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              placeholder="you@example.com"
              className="flex-1 px-4 py-3 rounded-lg text-[#0A0A0A] text-sm outline-none focus:ring-2 focus:ring-[#10B981] bg-white disabled:opacity-60"
              aria-label="Email address"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#059669] hover:bg-[#047857] text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Subscribing…" : "Subscribe"}
            </button>
          </form>
        )}

        {isError && (
          <p className="text-[#FCA5A5] text-xs mt-3" role="alert">
            {ERROR_MESSAGES[errorKey] ?? ERROR_MESSAGES.provider_error}
          </p>
        )}

        <p className="text-[#737373] text-xs mt-3.5">
          Unsubscribe anytime. We only email when there&apos;s a new post.
        </p>
      </div>
    </section>
  );
}
