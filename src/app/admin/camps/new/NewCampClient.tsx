"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { normalizeSlug } from "@/lib/formContracts";

type Created = { campName: string; slug: string; directorEmail: string; acceptUrl: string; emailSent: boolean };

const field = "mt-1 w-full rounded-xl border-2 border-stone-200 p-3 text-base";

export default function NewCampClient() {
  const [campName, setCampName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [directorName, setDirectorName] = useState("");
  const [directorEmail, setDirectorEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);
  const [copied, setCopied] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(null);
    const response = await fetch("/api/camps/onboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ campName, slug, directorName, directorEmail }) });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return setError(body.error ?? "The camp could not be set up.");
    setCreated(body as Created);
  };

  const copy = async () => {
    if (!created) return;
    try { await navigator.clipboard.writeText(created.acceptUrl); setCopied(true); } catch { setCopied(false); }
  };

  const reset = () => { setCreated(null); setCampName(""); setSlug(""); setSlugTouched(false); setDirectorName(""); setDirectorEmail(""); setCopied(false); };

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="font-display font-black text-3xl text-stone-900">Set up a customer camp</h1>
        <p className="text-sm text-stone-600 mt-2">Creates a new, empty camp and invites its director. They accept the invite, choose a password, then add their own team, sessions and prices. You won&apos;t be a member of their camp.</p>
      </div>

      {created ? (
        <div className="rounded-2xl border-2 border-emerald-200 bg-white p-5 space-y-3">
          <p className="text-sm font-semibold text-emerald-800">{created.campName} is set up.</p>
          <p className="text-sm text-stone-700">{created.emailSent ? `An invitation was emailed to ${created.directorEmail}. If it doesn't arrive, send them this link:` : `The email to ${created.directorEmail} could not be sent. Send them this link yourself:`}</p>
          <div className="flex gap-2">
            <input readOnly value={created.acceptUrl} onFocus={(event) => event.target.select()} className="min-w-0 flex-1 rounded-lg border border-stone-200 p-2 text-xs" />
            <button type="button" onClick={copy} className="rounded-lg bg-forest-900 px-3 text-xs font-black text-white"><Copy className="w-3.5 h-3.5 inline mr-1" />{copied ? "Copied" : "Copy"}</button>
          </div>
          <p className="text-xs text-stone-500">The link works once and expires in 7 days. Their public camp page will be /c/{created.slug}.</p>
          <button type="button" onClick={reset} className="text-sm font-bold text-forest-900 underline">Set up another camp</button>
        </div>
      ) : (
        <form onSubmit={submit} className="rounded-2xl border-2 border-stone-200 bg-white p-5 space-y-4">
          <label className="block text-xs font-bold text-stone-800">Camp name<input required value={campName} onChange={(event) => { setCampName(event.target.value); if (!slugTouched) setSlug(normalizeSlug(event.target.value)); }} className={field} /></label>
          <label className="block text-xs font-bold text-stone-800">Link name<input required value={slug} onChange={(event) => { setSlugTouched(true); setSlug(event.target.value); }} className={field} /><span className="mt-1 block font-normal text-stone-500">camperroster.com/c/{normalizeSlug(slug) || "your-camp"}</span></label>
          <label className="block text-xs font-bold text-stone-800">Director&apos;s name<input required value={directorName} onChange={(event) => setDirectorName(event.target.value)} className={field} /></label>
          <label className="block text-xs font-bold text-stone-800">Director&apos;s email<input type="email" required value={directorEmail} onChange={(event) => setDirectorEmail(event.target.value)} className={field} /></label>
          {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
          <button type="submit" disabled={busy} className="w-full rounded-xl bg-forest-900 px-5 py-3 text-sm font-black text-white disabled:opacity-50">{busy ? "Setting up…" : "Create camp and invite director"}</button>
        </form>
      )}
    </main>
  );
}
