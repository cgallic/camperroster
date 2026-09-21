"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Calendar, CheckCircle2, CreditCard, FileText, Loader2 } from "lucide-react";

type Camper = { id: string; camp_id: string | null; family_id: string | null; guardian_id: string | null; legal_first_name: string; legal_last_name: string; birth_date: string; grade_entering: number };
type Registration = { id: string; camp_id: string | null; camper_id: string; session_id: string | null; status: string | null; checked_in: boolean | null; cabin_name: string | null; counselor_name: string | null; canteen_balance_cents: number | null; created_at: string | null };
type Invoice = { id: string; camp_id: string; family_id: string; total_due_cents: number; amount_paid_cents: number; amount_refunded_cents: number; payment_plan: string };
type Schedule = { id: string; invoice_id: string; due_on: string; amount_cents: number; status: string };

export default function ParentPortalClient({ email, campers, registrations, camps, sessions, invoices, schedules, documents }: {
  email: string;
  campers: Camper[];
  registrations: Registration[];
  camps: { id: string; name: string; slug: string }[];
  sessions: { id: string; name: string; start_date: string; end_date: string }[];
  invoices: Invoice[];
  schedules: Schedule[];
  documents: { id: string; camper_id: string | null; status: string; name: string }[];
}) {
  const campById = new Map(camps.map((camp) => [camp.id, camp]));
  const sessionById = new Map(sessions.map((session) => [session.id, session]));
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pay = async (invoiceId: string, scheduleItemId?: string) => {
    setCheckoutId(invoiceId);
    setError(null);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, scheduleItemId }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.checkoutUrl) throw new Error(body.error ?? "Secure checkout is unavailable.");
      window.location.assign(body.checkoutUrl);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Secure checkout is unavailable.");
      setCheckoutId(null);
    }
  };

  if (!campers.length) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16">
        <div className="rounded-3xl border-2 border-stone-200 bg-white p-8 space-y-4">
          <h1 className="font-display font-black text-3xl text-stone-900">Parent portal</h1>
          <p className="text-sm text-stone-600">No camper registration is linked to {email}. Use the same email entered during registration, or ask the camp office to correct the guardian record.</p>
          <Link href="/" className="text-sm font-bold text-forest-900 underline">Return home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
      <div>
        <p className="font-mono text-xs font-bold uppercase text-forest-800">Signed in as {email}</p>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-stone-900 mt-2">Your registrations</h1>
        <p className="text-sm text-stone-600 mt-2">Current camp records, paperwork, and balances. Nothing on this page is sample data.</p>
      </div>
      {error && <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900 flex gap-2"><AlertTriangle className="w-5 h-5 shrink-0" />{error}</div>}

      {campers.map((camper) => {
        const registration = registrations.find((row) => row.camper_id === camper.id);
        const camp = registration?.camp_id ? campById.get(registration.camp_id) : camper.camp_id ? campById.get(camper.camp_id) : null;
        const session = registration?.session_id ? sessionById.get(registration.session_id) : null;
        const invoice = camper.family_id ? invoices.find((row) => row.family_id === camper.family_id && (!camp?.id || row.camp_id === camp.id)) : null;
        const due = invoice ? Math.max(0, invoice.total_due_cents - invoice.amount_paid_cents) : 0;
        const nextPayment = invoice ? schedules.find((row) => row.invoice_id === invoice.id && !["paid", "waived"].includes(row.status)) : null;
        const camperDocuments = documents.filter((row) => row.camper_id === camper.id);
        return (
          <section key={camper.id} className="rounded-3xl border-2 border-stone-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-stone-950 text-white p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-300">{camp?.name ?? "Camp registration"}</p>
              <h2 className="font-display font-black text-2xl sm:text-3xl mt-1">{camper.legal_first_name} {camper.legal_last_name}</h2>
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-stone-300">
                <span>Status: {registration?.status ?? "Not submitted"}</span>
                {session && <span><Calendar className="w-3.5 h-3.5 inline mr-1" />{session.name} &bull; {formatDate(session.start_date)}–{formatDate(session.end_date)}</span>}
                {registration?.cabin_name && <span>Cabin: {registration.cabin_name}</span>}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-5 p-6 sm:p-8">
              <div className="rounded-2xl border border-stone-200 p-5 space-y-3">
                <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-forest-800" /><h3 className="font-black text-stone-900">Paperwork</h3></div>
                {camperDocuments.length ? camperDocuments.map((document) => <div key={document.id} className="flex items-center justify-between gap-3 text-sm border-t border-stone-100 pt-2"><span>{document.name}</span><span className="font-bold capitalize">{document.status.replace(/_/g, " ")}</span></div>) : <p className="text-sm text-stone-500">No uploaded paperwork is recorded yet.</p>}
              </div>
              <div className="rounded-2xl border border-stone-200 p-5 space-y-3">
                <div className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-forest-800" /><h3 className="font-black text-stone-900">Tuition</h3></div>
                {invoice ? <><div className="grid grid-cols-2 gap-3 text-sm"><div><span className="text-stone-500 block">Total</span><b>{money(invoice.total_due_cents)}</b></div><div><span className="text-stone-500 block">Remaining</span><b>{money(due)}</b></div></div>{nextPayment && <p className="text-xs text-stone-600">Next payment: {money(nextPayment.amount_cents)} due {formatDate(nextPayment.due_on)}</p>}{due > 0 ? <button type="button" disabled={checkoutId === invoice.id} onClick={() => pay(invoice.id, nextPayment?.id)} className="w-full rounded-xl bg-forest-900 text-white px-4 py-3 text-sm font-black disabled:opacity-50">{checkoutId === invoice.id ? <><Loader2 className="w-4 h-4 inline animate-spin mr-2" />Opening checkout…</> : "Pay securely"}</button> : <p className="text-sm font-bold text-emerald-800 flex gap-2"><CheckCircle2 className="w-5 h-5" />Paid in full</p>}</> : <p className="text-sm text-stone-500">The camp has not issued an invoice for this registration.</p>}
              </div>
            </div>
          </section>
        );
      })}
    </main>
  );
}

function money(cents: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100); }
function formatDate(value: string) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`)); }
