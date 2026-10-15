"use client";

import { useState } from "react";
import { Copy, UserPlus } from "lucide-react";
import { ROLE_DETAILS, roleLabel } from "@/lib/team";

type Member = { userId: string; email: string; role: string; createdAt?: string };
type Invitation = { id: string; email: string; role: string; invited_at: string; expires_at: string };

const field = "mt-1 w-full rounded-xl border-2 border-stone-200 p-3";

function RoleSelect({ value, onChange, disabled, label }: { value: string; onChange: (role: string) => void; disabled?: boolean; label: string }) {
  return (
    <select aria-label={label} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="rounded-xl border-2 border-stone-200 bg-white p-2 text-sm font-semibold disabled:opacity-50">
      {ROLE_DETAILS.map((item) => <option key={item.role} value={item.role}>{item.label}</option>)}
    </select>
  );
}

export default function StaffManagerClient({ initialMembers, initialInvitations, currentUserId }: { initialMembers: Member[]; initialInvitations: Invitation[]; currentUserId: string }) {
  const [members, setMembers] = useState(initialMembers);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<{ email: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const sendInvite = async (inviteEmail: string, inviteRole: string) => {
    setBusy(true); setMessage(null); setInviteLink(null); setCopied(false);
    const response = await fetch("/api/admin/staff/invitations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: inviteEmail, role: inviteRole }) });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return setMessage(body.error ?? "Could not send that invitation.");
    setInvitations((current) => [body.invitation, ...current.filter((item) => item.email !== body.invitation.email)]);
    setInviteLink({ email: body.invitation.email, url: body.acceptUrl });
    setMessage(body.emailSent
      ? `Invitation emailed to ${body.invitation.email}. If it doesn't arrive, send them the link below.`
      : `The email to ${body.invitation.email} could not be sent. Copy the link below and send it to them yourself.`);
    return true;
  };

  const invite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (await sendInvite(email, role)) setEmail("");
  };

  const withdraw = async (id: string) => {
    setBusy(true); setMessage(null);
    const response = await fetch("/api/admin/staff/invitations", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return setMessage(body.error ?? "Could not withdraw that invitation.");
    setInvitations((current) => current.filter((item) => item.id !== id));
    setInviteLink(null);
    setMessage("Invitation withdrawn. The link no longer works.");
  };

  const changeRole = async (member: Member, nextRole: string) => {
    if (nextRole === member.role) return;
    setBusy(true); setMessage(null);
    const response = await fetch("/api/admin/staff/members", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: member.userId, role: nextRole }) });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return setMessage(body.error ?? "Could not change that role.");
    setMembers((current) => current.map((item) => item.userId === member.userId ? { ...item, role: nextRole } : item));
    setMessage(`${member.email} is now ${roleLabel(nextRole)}. It takes effect on their next page load.`);
  };

  const remove = async (member: Member) => {
    if (!window.confirm(`Remove ${member.email} from this camp? Their account stays, but they lose access.`)) return;
    setBusy(true); setMessage(null);
    const response = await fetch("/api/admin/staff/members", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: member.userId }) });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return setMessage(body.error ?? "Could not remove access.");
    setMembers((current) => current.filter((item) => item.userId !== member.userId));
    setMessage("Camp access removed. The person's account was not deleted.");
  };

  const copyLink = async () => {
    if (!inviteLink) return;
    try { await navigator.clipboard.writeText(inviteLink.url); setCopied(true); } catch { setCopied(false); }
  };

  const selected = ROLE_DETAILS.find((item) => item.role === role);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="font-display font-black text-3xl text-stone-900">Team access</h1>
        <p className="text-sm text-stone-600 mt-2">Invite staff, set or change their role, or remove access without deleting their account.</p>
      </div>

      <form onSubmit={invite} className="rounded-2xl border-2 border-stone-200 bg-white p-5 space-y-3">
        <div className="grid sm:grid-cols-[1fr_180px_auto] gap-3">
          <label className="text-xs font-bold text-stone-800">Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className={field + " text-base"} /></label>
          <label className="text-xs font-bold text-stone-800">Role<select value={role} onChange={(event) => setRole(event.target.value)} className={field}>{ROLE_DETAILS.map((item) => <option key={item.role} value={item.role}>{item.label}</option>)}</select></label>
          <button disabled={busy} className="self-end rounded-xl bg-forest-900 px-5 py-3 text-sm font-black text-white disabled:opacity-50"><UserPlus className="w-4 h-4 inline mr-2" />Invite</button>
        </div>
        {selected && <p className="text-xs text-stone-600"><b>{selected.label}:</b> {selected.description}</p>}
      </form>

      {message && <div role="status" className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm font-semibold">{message}</div>}
      {inviteLink && (
        <div className="rounded-xl border-2 border-sun-100 bg-sun-50 p-3 space-y-2">
          <p className="text-xs font-bold text-stone-800">Invitation link for {inviteLink.email} (works once, for 7 days)</p>
          <div className="flex gap-2">
            <input readOnly value={inviteLink.url} onFocus={(event) => event.target.select()} className="min-w-0 flex-1 rounded-lg border border-stone-200 bg-white p-2 text-xs" />
            <button type="button" onClick={copyLink} className="rounded-lg bg-forest-900 px-3 text-xs font-black text-white"><Copy className="w-3.5 h-3.5 inline mr-1" />{copied ? "Copied" : "Copy"}</button>
          </div>
        </div>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-black text-stone-900">Team</h2>
        <div className="rounded-2xl border-2 border-stone-200 bg-white divide-y divide-stone-100">
          {members.map((member) => {
            const isYou = member.userId === currentUserId;
            return (
              <div key={member.userId} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <b className="text-sm text-stone-900 break-all">{member.email}{isYou && <span className="ml-2 text-xs font-semibold text-stone-500">(you)</span>}</b>
                <div className="flex items-center gap-3">
                  <RoleSelect label={`Role for ${member.email}`} value={member.role} disabled={busy} onChange={(next) => changeRole(member, next)} />
                  {!isYou && <button type="button" disabled={busy} onClick={() => remove(member)} className="text-xs font-bold text-red-700 underline disabled:opacity-50">Remove</button>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {invitations.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-black text-stone-900">Waiting to accept</h2>
          <div className="rounded-2xl border-2 border-stone-200 bg-white divide-y divide-stone-100">
            {invitations.map((item) => (
              <div key={item.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <b className="text-sm text-stone-900 break-all">{item.email}</b>
                  <span className="block text-xs text-stone-500">{roleLabel(item.role)} · expires {new Date(item.expires_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" disabled={busy} onClick={() => sendInvite(item.email, item.role)} className="text-xs font-bold text-forest-900 underline disabled:opacity-50">Resend / get link</button>
                  <button type="button" disabled={busy} onClick={() => withdraw(item.id)} className="text-xs font-bold text-red-700 underline disabled:opacity-50">Withdraw</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-stone-200 bg-stone-50 p-4 space-y-1">
        <h2 className="text-sm font-black text-stone-900">What each role can do</h2>
        {ROLE_DETAILS.map((item) => <p key={item.role} className="text-xs text-stone-700"><b>{item.label}:</b> {item.description}</p>)}
      </section>
    </main>
  );
}
