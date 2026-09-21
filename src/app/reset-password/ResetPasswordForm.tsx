"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 10) return setError("Use at least 10 characters.");
    if (password !== confirmation) return setError("The passwords do not match.");
    setSaving(true);
    setError(null);
    const { error: updateError } = await createClient().auth.updateUser({ password });
    setSaving(false);
    if (updateError) return setError("This reset link is invalid or expired. Request a fresh link from sign in.");
    setSaved(true);
  };

  if (saved) return <div className="rounded-3xl border-2 border-emerald-200 bg-white p-8 space-y-4"><h2 className="font-display font-black text-2xl">Password updated</h2><Link href="/login" className="inline-block rounded-xl bg-forest-900 px-5 py-3 text-sm font-black text-white">Continue to sign in</Link></div>;

  return (
    <form onSubmit={submit} className="rounded-3xl border-2 border-stone-200 bg-white p-6 sm:p-8 space-y-4">
      <label className="block text-sm font-bold text-stone-900">New password<input type="password" autoComplete="new-password" required minLength={10} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-xl border-2 border-stone-200 p-3" /></label>
      <label className="block text-sm font-bold text-stone-900">Confirm password<input type="password" autoComplete="new-password" required minLength={10} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-1 w-full rounded-xl border-2 border-stone-200 p-3" /></label>
      {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
      <button type="submit" disabled={saving} className="w-full rounded-xl bg-forest-900 px-5 py-3 text-sm font-black text-white disabled:opacity-50">{saving ? "Saving…" : "Save new password"}</button>
    </form>
  );
}
