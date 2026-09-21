"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, CreditCard, Loader2, Search, ShoppingBag } from "lucide-react";
import { formatMoney, safeApiMessage } from "@/lib/operations";

type Wallet = { id: string; name: string; balanceCents: number };

export default function CanteenPosPage() {
  const [campName, setCampName] = useState("Camp");
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const attemptKey = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/canteen/roster?limit=100", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(safeApiMessage(payload, "Could not load canteen wallets."));
        if (!active) return;
        setCampName(payload.camp?.campName || "Camp");
        setWallets(payload.registrations || []);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Could not load canteen wallets.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? wallets.filter((wallet) => wallet.name.toLowerCase().includes(needle)) : wallets;
  }, [query, wallets]);
  const selected = wallets.find((wallet) => wallet.id === selectedId) ?? null;
  const amountCents = Math.round(Number(amount) * 100);
  const validCharge = selected && Number.isFinite(amountCents) && amountCents > 0 && amountCents <= 100_000 && amountCents <= selected.balanceCents && note.trim().length > 0;

  function resetAttempt() {
    attemptKey.current = null;
    setSuccess(null);
  }

  async function chargeWallet() {
    if (!selected || !validCharge || saving) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    attemptKey.current ||= typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `canteen-${Date.now()}-${selected.id}`;
    try {
      const response = await fetch("/api/portal/canteen", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": attemptKey.current },
        body: JSON.stringify({ registration_id: selected.id, amount_cents: -amountCents, note: note.trim() }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(safeApiMessage(payload, "The wallet charge was not saved."));
      setWallets((current) => current.map((wallet) => wallet.id === selected.id ? { ...wallet, balanceCents: payload.new_balance_cents } : wallet));
      setSuccess(`${formatMoney(amountCents)} charged to ${selected.name}. New balance: ${formatMoney(payload.new_balance_cents)}.`);
      setAmount("");
      setNote("");
      attemptKey.current = null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "The wallet charge was not saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-7">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-bold text-stone-500 hover:text-stone-900"><ArrowLeft className="w-4 h-4" />Director hub</Link>
            <h1 className="font-display font-black text-3xl text-stone-900 flex items-center gap-3 mt-2"><ShoppingBag className="w-8 h-8 text-forest-800" />Canteen wallet register</h1>
            <p className="text-sm text-stone-600 mt-1">{campName} · Charges post to the audited wallet ledger.</p>
          </div>
        </header>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs">
          Product inventory is not configured in CamperRoster. Enter the actual sale total and a receipt note; this screen will not invent a catalog or stock count.
        </div>
        {error && <div role="alert" className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-900 font-semibold text-sm flex items-center gap-2"><AlertTriangle className="w-5 h-5 shrink-0" />{error}</div>}
        {success && <div role="status" className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-950 font-semibold text-sm flex items-center gap-2"><CheckCircle2 className="w-5 h-5 shrink-0" />{success}</div>}

        {loading ? (
          <div className="py-16 text-center text-stone-500"><Loader2 className="w-7 h-7 animate-spin mx-auto mb-3" />Loading wallets…</div>
        ) : wallets.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-stone-300 py-16 px-6 text-center"><CreditCard className="w-10 h-10 text-stone-300 mx-auto mb-3" /><h2 className="font-display font-black text-xl text-stone-900">No current camper wallets</h2><p className="text-sm text-stone-600 mt-2">Wallets are created from current registrations, not historical roster imports.</p></div>
        ) : (
          <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-6 items-start">
            <section className="bg-white rounded-3xl border-2 border-stone-200 overflow-hidden">
              <div className="p-4 border-b border-stone-200 relative"><Search className="absolute w-4 h-4 text-stone-400 left-7 top-1/2 -translate-y-1/2" /><label htmlFor="wallet-search" className="sr-only">Search wallets</label><input id="wallet-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search campers" className="w-full py-3 pl-10 pr-3 rounded-xl border border-stone-300 text-sm font-bold" /></div>
              <div className="divide-y divide-stone-100 max-h-[32rem] overflow-y-auto">
                {filtered.map((wallet) => (
                  <button key={wallet.id} type="button" onClick={() => { setSelectedId(wallet.id); resetAttempt(); }} className={`w-full p-4 flex items-center justify-between text-left hover:bg-stone-50 ${selectedId === wallet.id ? "bg-forest-50" : "bg-white"}`}><b className="text-sm text-stone-950">{wallet.name}</b><span className="font-mono text-sm font-black text-forest-900">{formatMoney(wallet.balanceCents)}</span></button>
                ))}
              </div>
            </section>

            {selected ? (
              <section className="bg-white rounded-3xl border-2 border-stone-300 shadow-lg p-6 sm:p-8 space-y-6">
                <div><span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Charge wallet</span><h2 className="font-display font-black text-2xl text-stone-950">{selected.name}</h2><p className="text-sm text-stone-600">Available: <b>{formatMoney(selected.balanceCents)}</b></p></div>
                <div><label htmlFor="charge-amount" className="text-xs font-bold text-stone-700">Sale total</label><div className="relative mt-1"><span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-stone-500">$</span><input id="charge-amount" type="number" min="0.01" step="0.01" max={(Math.min(selected.balanceCents, 100_000) / 100).toFixed(2)} value={amount} onChange={(event) => { setAmount(event.target.value); resetAttempt(); }} placeholder="0.00" className="w-full pl-8 pr-4 py-3 rounded-xl border-2 border-stone-300 font-mono font-black" /></div>{amountCents > selected.balanceCents && <p className="text-xs text-rose-700 font-bold mt-1">Charge exceeds the available balance.</p>}{amountCents > 100_000 && <p className="text-xs text-rose-700 font-bold mt-1">A single wallet charge cannot exceed $1,000.</p>}</div>
                <div><label htmlFor="charge-note" className="text-xs font-bold text-stone-700">Receipt note</label><textarea id="charge-note" value={note} onChange={(event) => { setNote(event.target.value); resetAttempt(); }} placeholder="What was purchased?" maxLength={500} rows={3} className="w-full mt-1 p-3 rounded-xl border-2 border-stone-300 text-sm" /><p className="text-[10px] text-stone-500 mt-1">Required for the audit trail.</p></div>
                <button type="button" onClick={chargeWallet} disabled={!validCharge || saving} className="w-full py-4 rounded-2xl bg-forest-800 hover:bg-forest-900 text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}Charge {amountCents > 0 ? formatMoney(amountCents) : "$0.00"}</button>
              </section>
            ) : <div className="rounded-3xl border-2 border-dashed border-stone-300 p-12 text-center text-sm text-stone-500">Select a camper wallet to record a sale.</div>}
          </div>
        )}
      </div>
    </main>
  );
}
