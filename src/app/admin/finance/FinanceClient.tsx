"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Banknote, HandCoins, Pencil, Undo2 } from "lucide-react";

import { PLAN_LABELS, formatCents } from "@/lib/pricing";
import type { AidApplication, FamilyFinance } from "./types";

type Banner = { tone: "ok" | "error"; message: string } | null;
type Tab = "families" | "outstanding" | "aid";

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "That did not go through");
  return json;
}

function dollarsToCents(input: string): number | null {
  const n = Number(String(input).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

const STATUS_STYLES: Record<string, string> = {
  succeeded: "bg-forest-50 text-forest-800 border-forest-100",
  pending: "bg-amber-50 text-amber-800 border-amber-100",
  failed: "bg-red-50 text-red-700 border-red-100",
  refunded: "bg-stone-100 text-stone-600 border-stone-200",
  partially_refunded: "bg-stone-100 text-stone-600 border-stone-200",
};

function Pill({ status }: { status: string }) {
  return (
    <span
      className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
        STATUS_STYLES[status] ?? "bg-stone-100 text-stone-600 border-stone-200"
      }`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default function FinanceClient({
  families,
  aid,
}: {
  families: FamilyFinance[];
  aid: AidApplication[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<Banner>(null);
  const [tab, setTab] = useState<Tab>("families");
  const [open, setOpen] = useState<string | null>(null);

  const totals = useMemo(
    () => ({
      billed: families.reduce((n, f) => n + f.totalDueCents, 0),
      collected: families.reduce((n, f) => n + f.paidCents, 0),
      outstanding: families.reduce((n, f) => n + f.balanceCents, 0),
      behind: families.filter((f) => f.balanceCents > 0).length,
      aidAwarded: families.reduce((n, f) => n + f.financialAidCents, 0),
    }),
    [families],
  );

  const outstanding = useMemo(() => families.filter((f) => f.balanceCents > 0), [families]);

  const run = async (fn: () => Promise<string>) => {
    setBusy(true);
    setBanner(null);
    try {
      const message = await fn();
      setBanner({ tone: "ok", message });
      startTransition(() => router.refresh());
    } catch (e) {
      setBanner({ tone: "error", message: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  };

  const setCustomTotal = (f: FamilyFinance) => {
    const current = f.customTotalCents != null ? (f.customTotalCents / 100).toFixed(2) : "";
    const answer = window.prompt(
      `Custom total for ${f.householdName} in dollars. Leave blank to go back to the published tier.`,
      current,
    );
    if (answer === null) return;
    const cents = answer.trim() === "" ? null : dollarsToCents(answer);
    if (cents === null && answer.trim() !== "") {
      setBanner({ tone: "error", message: "That is not an amount I can read." });
      return;
    }
    return run(async () => {
      await postJson("/api/admin/finance/custom-total", { invoiceId: f.invoiceId, customTotalCents: cents });
      return cents === null
        ? `${f.householdName} is back on the published tier.`
        : `${f.householdName} set to ${formatCents(cents)}.`;
    });
  };

  const recordOffline = (f: FamilyFinance) => {
    const answer = window.prompt(`Cash or check from ${f.householdName} — how much, in dollars?`, "");
    if (answer === null) return;
    const cents = dollarsToCents(answer);
    if (!cents || cents <= 0) {
      setBanner({ tone: "error", message: "That is not an amount I can read." });
      return;
    }
    const method = window.prompt("cash, check or other?", "check") ?? "check";
    return run(async () => {
      await postJson("/api/admin/finance/offline-payment", {
        invoiceId: f.invoiceId,
        amountCents: cents,
        method: ["cash", "check", "other"].includes(method.trim()) ? method.trim() : "other",
      });
      return `${formatCents(cents)} recorded for ${f.householdName}.`;
    });
  };

  const refund = (f: FamilyFinance, paymentId: string, maxCents: number) => {
    const answer = window.prompt(
      `Refund ${f.householdName} — how much, in dollars? (up to ${formatCents(maxCents)})`,
      (maxCents / 100).toFixed(2),
    );
    if (answer === null) return;
    const cents = dollarsToCents(answer);
    if (!cents || cents <= 0) {
      setBanner({ tone: "error", message: "That is not an amount I can read." });
      return;
    }
    return run(async () => {
      await postJson("/api/stripe/refund", { paymentId, amountCents: cents });
      return `${formatCents(cents)} refunded to ${f.householdName}.`;
    });
  };

  const disabled = busy || pending;

  return (
    <main className="py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Finance</h1>
          <p className="text-stone-600 mt-1">
            What every household owes, what has come in, and who still needs chasing.
          </p>
        </div>

        {banner && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm font-medium ${
              banner.tone === "ok"
                ? "bg-forest-50 border-forest-100 text-forest-800"
                : "bg-red-50 border-red-100 text-red-700"
            }`}
          >
            {banner.message}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Billed", value: formatCents(totals.billed) },
            { label: "Collected", value: formatCents(totals.collected) },
            { label: "Outstanding", value: formatCents(totals.outstanding) },
            { label: "Aid awarded", value: formatCents(totals.aidAwarded) },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-stone-200 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-stone-500">{s.label}</div>
              <div className="text-2xl font-bold text-stone-900 mt-1">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 border-b border-stone-200">
          {(
            [
              ["families", `All families (${families.length})`],
              ["outstanding", `Not paid in full (${outstanding.length})`],
              ["aid", `Financial aid (${aid.length})`],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 text-sm font-semibold -mb-px border-b-2 transition ${
                tab === key
                  ? "border-forest-700 text-forest-800"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab !== "aid" && (
          <div className="space-y-3">
            {(tab === "families" ? families : outstanding).map((f) => (
              <div key={f.invoiceId} className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                <div className="p-4 flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
                  <div className="min-w-0">
                    <button
                      onClick={() => setOpen(open === f.invoiceId ? null : f.invoiceId)}
                      className="font-bold text-stone-900 hover:text-forest-800 text-left"
                    >
                      {f.householdName}
                    </button>
                    <div className="text-xs text-stone-500 mt-0.5">
                      {f.camperCount} {f.camperCount === 1 ? "camper" : "campers"} · {PLAN_LABELS[f.plan]}
                      {f.customTotalCents != null && " · custom total"}
                      {f.processingFeeCents > 0 && ` · ${formatCents(f.processingFeeCents)} card fee`}
                      {f.financialAidCents > 0 && ` · ${formatCents(f.financialAidCents)} aid`}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm shrink-0">
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-stone-500">Due</div>
                      <div className="font-mono font-bold text-stone-900">{formatCents(f.totalDueCents)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-stone-500">Paid</div>
                      <div className="font-mono font-bold text-forest-800">{formatCents(f.paidCents)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-stone-500">Still due</div>
                      <div
                        className={`font-mono font-bold ${f.balanceCents > 0 ? "text-red-700" : "text-stone-400"}`}
                      >
                        {formatCents(f.balanceCents)}
                      </div>
                    </div>
                    {f.nextDueOn && (
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-stone-500">Next due</div>
                        <div className="font-mono text-stone-700">{f.nextDueOn}</div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      disabled={disabled}
                      onClick={() => recordOffline(f)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-forest-700 text-white hover:bg-forest-800 disabled:opacity-50"
                    >
                      <Banknote className="w-3.5 h-3.5" /> Cash / check
                    </button>
                    <button
                      disabled={disabled}
                      onClick={() => setCustomTotal(f)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Custom total
                    </button>
                  </div>
                </div>

                {open === f.invoiceId && (
                  <div className="border-t border-stone-100 bg-stone-50 p-4 grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wide text-stone-500 mb-2">
                        Payments made
                      </h4>
                      {f.payments.length === 0 ? (
                        <p className="text-sm text-stone-500">Nothing received yet.</p>
                      ) : (
                        <ul className="space-y-2">
                          {f.payments.map((p) => (
                            <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                              <span className="flex items-center gap-2">
                                <span className="font-mono font-semibold text-stone-900">
                                  {formatCents(p.amountCents - p.refundedCents)}
                                </span>
                                <Pill status={p.status} />
                                {p.isOffline && (
                                  <span className="text-[10px] uppercase font-bold text-stone-500">offline</span>
                                )}
                              </span>
                              <span className="flex items-center gap-3">
                                <span className="text-stone-500 font-mono text-xs">
                                  {p.paidAt ? p.paidAt.slice(0, 10) : "—"}
                                </span>
                                {["succeeded", "partially_refunded"].includes(p.status) &&
                                  p.amountCents - p.refundedCents > 0 &&
                                  !p.isOffline && (
                                    <button
                                      disabled={disabled}
                                      onClick={() => refund(f, p.id, p.amountCents - p.refundedCents)}
                                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:underline disabled:opacity-50"
                                    >
                                      <Undo2 className="w-3.5 h-3.5" /> Refund
                                    </button>
                                  )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wide text-stone-500 mb-2">Schedule</h4>
                      {f.schedule.length === 0 ? (
                        <p className="text-sm text-stone-500">No instalments scheduled.</p>
                      ) : (
                        <ul className="space-y-2">
                          {f.schedule.map((s) => (
                            <li key={s.id} className="flex items-center justify-between gap-3 text-sm">
                              <span className="font-mono text-stone-700">{s.dueOn}</span>
                              <span className="flex items-center gap-2">
                                <span className="font-mono font-semibold text-stone-900">
                                  {formatCents(s.amountCents)}
                                </span>
                                <Pill status={s.status} />
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {(tab === "families" ? families : outstanding).length === 0 && (
              <div className="bg-white rounded-xl border border-stone-200 p-8 text-center text-stone-500">
                <AlertCircle className="w-5 h-5 mx-auto mb-2 text-stone-400" />
                {tab === "families" ? "No invoices yet this season." : "Every household is paid in full."}
              </div>
            )}
          </div>
        )}

        {tab === "aid" && (
          <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100">
            {aid.length === 0 && (
              <div className="p-8 text-center text-stone-500">
                <HandCoins className="w-5 h-5 mx-auto mb-2 text-stone-400" />
                No families have applied for aid this season.
              </div>
            )}
            {aid.map((a) => (
              <div key={a.id} className="p-4 flex flex-col sm:flex-row sm:items-start gap-3 justify-between">
                <div className="min-w-0">
                  <div className="font-bold text-stone-900">{a.householdName}</div>
                  {a.narrative && <p className="text-sm text-stone-600 mt-1 max-w-2xl">{a.narrative}</p>}
                </div>
                <div className="flex items-center gap-5 text-sm shrink-0">
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-stone-500">Asked</div>
                    <div className="font-mono text-stone-800">{formatCents(a.requestedCents ?? 0)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-stone-500">Awarded</div>
                    <div className="font-mono font-bold text-forest-800">{formatCents(a.awardedCents ?? 0)}</div>
                  </div>
                  <Pill status={a.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
