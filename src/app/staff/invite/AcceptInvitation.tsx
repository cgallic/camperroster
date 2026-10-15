"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { homeForRole } from "@/lib/staff-navigation";
import { roleLabel } from "@/lib/team";
import type { Role } from "@/lib/auth";

type Invite = { email: string; role: Role; campName: string; status: string };

const input = "mt-1 w-full rounded-xl border-2 border-stone-200 p-3";
const primary = "w-full rounded-xl bg-forest-900 px-5 py-3 text-sm font-black text-white disabled:opacity-50";

export default function AcceptInvitation() {
  const token = useSearchParams().get("token") ?? "";
  const [invite, setInvite] = useState<Invite | null>(null);
  const [signedInAs, setSignedInAs] = useState<string | null>(null);
  const [fromEmailLink, setFromEmailLink] = useState(false);
  const [loading, setLoading] = useState(Boolean(token));
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(token ? null : "This invitation link is missing its token. Ask your director to send it again.");
  const loginHref = `/login?next=${encodeURIComponent(`/staff/invite?token=${token}`)}`;

  useEffect(() => {
    if (!token) return;
    (async () => {
      // The emailed link arrives with the session in the URL fragment. Read it
      // before the client starts, in case the client clears it.
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const supabase = createClient();
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
        setFromEmailLink(true);
      }
      const [{ data }, response] = await Promise.all([
        supabase.auth.getUser(),
        fetch(`/api/staff/invitations/accept?token=${encodeURIComponent(token)}`, { cache: "no-store" }),
      ]);
      setSignedInAs(data.user?.email?.toLowerCase() ?? null);
      const body = await response.json().catch(() => ({}));
      if (response.ok) setInvite(body as Invite);
      else setError(body.error ?? "This invitation link is not valid.");
      setLoading(false);
    })();
  }, [token]);

  const accept = async (withPassword: boolean) => {
    if (withPassword) {
      if (password.length < 10) return setError("Use at least 10 characters.");
      if (password !== confirmation) return setError("The passwords do not match.");
    }
    setBusy(true); setError(null);
    const response = await fetch("/api/staff/invitations/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(withPassword ? { token, password } : { token }),
    });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      if (body.code === "account_exists") return setError("An account already exists for this email. Sign in below, then accept.");
      if (/another email/.test(body.error ?? "")) return setError(`This invitation is for ${invite?.email}. Sign out and sign in with that email.`);
      return setError(body.error ?? "This invitation could not be accepted.");
    }
    if (withPassword) setPasswordSaved(true);
    setAccepted(true);
  };

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 10) return setError("Use at least 10 characters.");
    if (password !== confirmation) return setError("The passwords do not match.");
    setBusy(true); setError(null);
    const { error: updateError } = await createClient().auth.updateUser({ password });
    setBusy(false);
    if (updateError) return setError("Your password could not be saved. You can set one later with \"Forgot password\" on the sign-in page.");
    setPasswordSaved(true);
  };

  const signOut = async () => {
    await createClient().auth.signOut();
    setSignedInAs(null);
    setError(null);
  };

  const passwordFields = (
    <>
      <label className="block text-sm font-bold text-stone-900">Password<input type="password" autoComplete="new-password" required minLength={10} value={password} onChange={(event) => setPassword(event.target.value)} className={input} /></label>
      <label className="block text-sm font-bold text-stone-900">Confirm password<input type="password" autoComplete="new-password" required minLength={10} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className={input} /></label>
    </>
  );

  let content: React.ReactNode;
  if (loading) {
    content = <p className="text-sm text-stone-600">Checking your invitation…</p>;
  } else if (!invite) {
    content = null;
  } else if (accepted) {
    content = (
      <>
        <p className="text-sm text-emerald-800 font-semibold">You&apos;re on the {invite.campName} team as {roleLabel(invite.role)}.</p>
        {fromEmailLink && !passwordSaved && (
          <form onSubmit={savePassword} className="space-y-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm text-stone-700">Set a password so you can sign in next time.</p>
            {passwordFields}
            <button type="submit" disabled={busy} className={primary}>{busy ? "Saving…" : "Save password"}</button>
          </form>
        )}
        <Link href={homeForRole(invite.role)} className="inline-block rounded-xl bg-forest-900 px-5 py-3 text-sm font-black text-white">Open your workspace</Link>
      </>
    );
  } else if (invite.status !== "pending") {
    content = invite.status === "accepted"
      ? <><p className="text-sm text-stone-600">This invitation has already been accepted.</p><Link href={loginHref} className="text-sm font-bold text-forest-900 underline">Sign in</Link></>
      : <p className="text-sm text-stone-600">This invitation has {invite.status === "expired" ? "expired" : "been withdrawn"}. Ask your camp director to send a new one.</p>;
  } else if (signedInAs && signedInAs !== invite.email.toLowerCase()) {
    content = (
      <>
        <p className="text-sm text-stone-600">You&apos;re signed in as <b>{signedInAs}</b>, but this invitation is for <b>{invite.email}</b>.</p>
        <button type="button" onClick={signOut} className={primary}>Sign out and continue</button>
      </>
    );
  } else if (signedInAs) {
    content = <button type="button" disabled={busy} onClick={() => accept(false)} className={primary}>{busy ? "Accepting…" : "Accept invitation"}</button>;
  } else {
    content = (
      <>
        <form onSubmit={(event) => { event.preventDefault(); accept(true); }} className="space-y-3">
          <p className="text-sm text-stone-600">New to Camper Roster? Choose a password for <b>{invite.email}</b>.</p>
          {passwordFields}
          <button type="submit" disabled={busy} className={primary}>{busy ? "Joining…" : "Create account and join"}</button>
        </form>
        <p className="text-sm text-stone-600">Already have an account? <Link href={loginHref} className="font-bold text-forest-900 underline">Sign in</Link> with {invite.email}, then accept.</p>
      </>
    );
  }

  return (
    <div className="rounded-3xl border-2 border-stone-200 bg-white p-8 space-y-4">
      <h1 className="font-display font-black text-2xl text-stone-900">{invite?.campName ? `Join ${invite.campName}` : "Camp staff invitation"}</h1>
      {invite && !accepted && invite.status === "pending" && <p className="text-sm text-stone-600">You&apos;ve been invited as <b>{roleLabel(invite.role)}</b>.</p>}
      {content}
      {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
    </div>
  );
}
