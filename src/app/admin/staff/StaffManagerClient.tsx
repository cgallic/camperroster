"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";

type Member = { userId: string; email: string; role: string; createdAt?: string };

export default function StaffManagerClient({ initialMembers }: { initialMembers: Member[] }) {
  const [members, setMembers] = useState(initialMembers);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const invite = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage(null);
    const response = await fetch("/api/admin/staff/invitations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, role }) });
    const body = await response.json().catch(() => ({})); setBusy(false);
    if (!response.ok) return setMessage(body.error ?? "Could not add that team member.");
    setEmail(""); setMessage(body.invitation ? "Invitation sent. Access activates only after the recipient accepts it." : "Invitation sent.");
  };

  const remove = async (userId: string) => {
    setBusy(true); setMessage(null);
    const response = await fetch("/api/admin/staff/members", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
    const body = await response.json().catch(() => ({})); setBusy(false);
    if (!response.ok) return setMessage(body.error ?? "Could not remove access.");
    setMembers((current) => current.filter((item) => item.userId !== userId)); setMessage("Camp access removed. The person's auth account was not deleted.");
  };

  return <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6"><div><h1 className="font-display font-black text-3xl text-stone-900">Team access</h1><p className="text-sm text-stone-600 mt-2">Invite staff, assign their camp role, or remove access without deleting their account.</p></div><form onSubmit={invite} className="rounded-2xl border-2 border-stone-200 bg-white p-5 grid sm:grid-cols-[1fr_180px_auto] gap-3"><label className="text-xs font-bold text-stone-800">Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-xl border-2 border-stone-200 p-3 text-base" /></label><label className="text-xs font-bold text-stone-800">Role<select value={role} onChange={(event) => setRole(event.target.value)} className="mt-1 w-full rounded-xl border-2 border-stone-200 p-3"><option value="staff">Staff</option><option value="counselor">Counselor</option><option value="nurse">Nurse</option><option value="red_shirt">Red shirt</option><option value="registrar">Registrar</option><option value="director">Director</option></select></label><button disabled={busy} className="self-end rounded-xl bg-forest-900 px-5 py-3 text-sm font-black text-white disabled:opacity-50"><UserPlus className="w-4 h-4 inline mr-2" />Invite</button></form>{message && <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm font-semibold">{message}</div>}<div className="rounded-2xl border-2 border-stone-200 bg-white divide-y divide-stone-100">{members.map((member) => <div key={member.userId} className="p-4 flex items-center justify-between gap-4"><div><b className="text-sm text-stone-900">{member.email}</b><span className="block text-xs text-stone-500 capitalize">{member.role.replace("_", " ")}</span></div><button type="button" disabled={busy} onClick={() => remove(member.userId)} className="text-xs font-bold text-red-700 underline disabled:opacity-50">Remove access</button></div>)}</div></main>;
}
