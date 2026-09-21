"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function AcceptInvitation() {
  const token = useSearchParams().get("token") ?? "";
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(token ? null : "This invitation link is missing its token.");
  const accept = async () => {
    setBusy(true); setError(null);
    const response = await fetch("/api/staff/invitations/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
    const body = await response.json().catch(() => ({})); setBusy(false);
    if (!response.ok) return setError(body.error ?? "This invitation could not be accepted.");
    setAccepted(true);
  };
  return <div className="rounded-3xl border-2 border-stone-200 bg-white p-8 space-y-4"><h1 className="font-display font-black text-2xl text-stone-900">Camp staff invitation</h1>{accepted ? <><p className="text-sm text-emerald-800 font-semibold">Your camp access is active.</p><Link href="/admin" className="inline-block rounded-xl bg-forest-900 px-5 py-3 text-sm font-black text-white">Open dashboard</Link></> : <><p className="text-sm text-stone-600">Accept this invitation while signed in with the email address it was sent to.</p>{error && <p className="text-sm font-semibold text-red-700">{error}</p>}<button type="button" disabled={!token || busy} onClick={accept} className="w-full rounded-xl bg-forest-900 px-5 py-3 text-sm font-black text-white disabled:opacity-50">{busy ? "Accepting…" : "Accept invitation"}</button></>}</div>;
}
