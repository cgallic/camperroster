"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";

/**
 * "Book a walkthrough" lead form for the marketing pages. Posts to /api/leads.
 * On a failed save it shows the email address instead of pretending it worked.
 */
export default function WalkthroughForm({ source, tone = "light" }: { source: string; tone?: "light" | "dark" }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setError(null);
    const form = new FormData(e.currentTarget);
    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    params.forEach((v, k) => {
      if (k.startsWith("utm_")) utm[k] = v;
    });
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          campName: form.get("campName"),
          camperCount: form.get("camperCount"),
          currentTool: form.get("currentTool"),
          message: form.get("message"),
          website: form.get("website"),
          sourcePath: `${window.location.pathname}#${source}`,
          utm,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setError(data?.error || "Something went wrong. Please email director@camperroster.com.");
        setState("error");
        return;
      }
      track("lead_submitted", { source });
      setState("sent");
    } catch {
      setError("Could not reach the server. Please email director@camperroster.com.");
      setState("error");
    }
  }

  const dark = tone === "dark";
  const input = dark
    ? "w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-sm text-white placeholder:text-stone-400 focus:outline-none focus:border-emerald-400"
    : "w-full rounded-xl bg-white border border-stone-300 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-emerald-500";

  if (state === "sent") {
    return (
      <div className={`rounded-2xl p-6 text-center ${dark ? "bg-white/10 text-white" : "bg-emerald-50 text-stone-900"}`}>
        <p className="font-black text-lg">Thanks, we got it.</p>
        <p className={`text-sm mt-1 ${dark ? "text-stone-300" : "text-stone-600"}`}>
          We will email you within one business day to set up a time.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 text-left max-w-xl mx-auto w-full">
      <div className="grid sm:grid-cols-2 gap-3">
        <input name="name" required placeholder="Your name" autoComplete="name" className={input} />
        <input name="email" type="email" required placeholder="Email" autoComplete="email" className={input} />
        <input name="campName" placeholder="Camp name" className={input} />
        <select name="camperCount" defaultValue="" className={input} aria-label="Campers per summer">
          <option value="" disabled>Campers per summer</option>
          <option>Under 100</option>
          <option>100 to 300</option>
          <option>300 to 1,000</option>
          <option>Over 1,000</option>
        </select>
      </div>
      <input name="currentTool" placeholder="What do you use today? (Google Forms, UltraCamp, paper...)" className={input} />
      <textarea name="message" rows={3} placeholder="Anything we should know? (optional)" className={input} />
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      {error && <p className={`text-sm font-semibold ${dark ? "text-red-300" : "text-red-600"}`}>{error}</p>}
      <button
        type="submit"
        disabled={state === "sending"}
        className="w-full py-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-60 text-stone-950 font-black text-sm shadow-xl"
      >
        {state === "sending" ? "Sending..." : "Book a 20-minute walkthrough"}
      </button>
    </form>
  );
}
