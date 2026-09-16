"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Banknote, HandCoins, Pencil, Search, Undo2 } from "lucide-react";

import { PLAN_LABELS, formatCents } from "@/lib/pricing";
import {
  Badge,
  Button,
  DataTable,
  FilterBar,
  FilterChip,
  Notice,
  PageHeader,
  Panel,
  PageShell,
  StatCard,
  StatStrip,
  StatusDot,
  inputClass,
  type Column,
  type StatusTone,
} from "@/components/ui";
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

/** Column one: has the money arrived? */
function paymentState(f: FamilyFinance): { tone: StatusTone; label: string } {
  if (f.balanceCents <= 0) return { tone: "complete", label: "Paid in full" };
  if (f.paidCents > 0) return { tone: "pending", label: "Part paid" };
  return { tone: "neutral", label: "Nothing in" };
}

/** Column two, independent of the first: is the plan on schedule? */
function planState(f: FamilyFinance): { tone: StatusTone; label: string } {
  if (f.balanceCents <= 0) return { tone: "complete", label: "Settled" };
  const overdue = f.schedule.some((s) => s.status !== "paid" && s.dueOn < new Date().toISOString().slice(0, 10));
  if (overdue) return { tone: "overdue", label: "Instalment overdue" };
  if (f.nextDueOn) return { tone: "pending", label: `Due ${f.nextDueOn}` };
  return { tone: "pending", label: PLAN_LABELS[f.plan] };
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
  const [search, setSearch] = useState("");

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

  const listed = useMemo(() => {
    const base = tab === "outstanding" ? outstanding : families;
    const q = search.trim().toLowerCase();
    return q ? base.filter((f) => f.householdName.toLowerCase().includes(q)) : base;
  }, [tab, families, outstanding, search]);

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

  const columns: Column<FamilyFinance>[] = [
    {
      key: "household",
      header: "Household",
      primary: true,
      cell: (f) => (
        <div className="min-w-0">
          <button
            onClick={() => setOpen(open === f.invoiceId ? null : f.invoiceId)}
            className="text-left font-bold text-stone-900 hover:text-forest-800"
          >
            {f.householdName}
          </button>
          <div className="mt-0.5 text-[11px] text-stone-500">
            {f.camperCount} {f.camperCount === 1 ? "camper" : "campers"} · {PLAN_LABELS[f.plan]}
            {f.customTotalCents != null && " · custom total"}
            {f.processingFeeCents > 0 && ` · ${formatCents(f.processingFeeCents)} card fee`}
            {f.financialAidCents > 0 && ` · ${formatCents(f.financialAidCents)} aid`}
          </div>
        </div>
      ),
    },
    {
      key: "payment",
      header: "Payment",
      cell: (f) => {
        const s = paymentState(f);
        return <StatusDot tone={s.tone} label={s.label} />;
      },
    },
    {
      key: "plan",
      header: "Plan",
      cell: (f) => {
        const s = planState(f);
        return <StatusDot tone={s.tone} label={s.label} />;
      },
    },
    { key: "due", header: "Due", align: "right", cell: (f) => formatCents(f.totalDueCents) },
    {
      key: "paid",
      header: "Paid",
      align: "right",
      cell: (f) => <span className="text-forest-800">{formatCents(f.paidCents)}</span>,
    },
    {
      key: "balance",
      header: "Still due",
      align: "right",
      cell: (f) => (
        <span className={f.balanceCents > 0 ? "font-bold text-alert-red" : "text-stone-500"}>
          {formatCents(f.balanceCents)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      action: true,
      cell: (f) => (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="secondary" size="sm" disabled={disabled} onClick={() => recordOffline(f)}>
            <Banknote className="h-3.5 w-3.5" /> Cash / check
          </Button>
          <Button variant="quiet" size="sm" disabled={disabled} onClick={() => setCustomTotal(f)}>
            <Pencil className="h-3.5 w-3.5" /> Custom total
          </Button>
        </div>
      ),
    },
  ];

  const openFamily = listed.find((f) => f.invoiceId === open) ?? null;

  return (
    <PageShell>
      <PageHeader
        title="Finance"
        description="What every household owes, what has come in, and who still needs chasing."
      />

      {banner && <Notice tone={banner.tone}>{banner.message}</Notice>}

      <StatStrip>
        <StatCard
          label="Collected"
          value={formatCents(totals.collected)}
          tone="complete"
          progress={totals.billed > 0 ? (totals.collected / totals.billed) * 100 : 0}
          progressLabel={`of ${formatCents(totals.billed)} billed`}
        />
        <StatCard
          label="Outstanding"
          value={formatCents(totals.outstanding)}
          tone={totals.outstanding > 0 ? "overdue" : "complete"}
          hint="Still to come in before camp starts."
        />
        <StatCard
          label="Not paid in full"
          value={totals.behind}
          of={families.length}
          tone={totals.behind > 0 ? "pending" : "complete"}
          hint="Households carrying a balance."
        />
        <StatCard label="Aid awarded" value={formatCents(totals.aidAwarded)} tone="waitlisted" hint={`${aid.length} applications on file.`} />
      </StatStrip>

      <FilterBar
        trailing={
          tab !== "aid" ? (
            <span className="text-xs text-stone-500">
              {listed.length} of {tab === "outstanding" ? outstanding.length : families.length} shown
            </span>
          ) : null
        }
      >
        {(
          [
            ["families", `All families (${families.length})`],
            ["outstanding", `Not paid in full (${outstanding.length})`],
            ["aid", `Financial aid (${aid.length})`],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <FilterChip key={key} active={tab === key} onClick={() => setTab(key)}>
            {label}
          </FilterChip>
        ))}
        {tab !== "aid" && (
          <label className="relative flex min-w-48 flex-1 items-center">
            <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-stone-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search households"
              className={inputClass + " w-full py-1.5 pl-9 text-xs"}
            />
          </label>
        )}
      </FilterBar>

      {tab !== "aid" && (
        <div className="space-y-3">
          <DataTable
            columns={columns}
            rows={listed}
            rowKey={(f) => f.invoiceId}
            empty={tab === "families" ? "No invoices yet this season." : "Every household is paid in full."}
          />

          {openFamily && (
            <Panel
              title={openFamily.householdName}
              description="Payments received and the instalment schedule."
              actions={
                <Button variant="quiet" size="sm" onClick={() => setOpen(null)}>
                  Close
                </Button>
              }
            >
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-stone-500">Payments made</h4>
                  {openFamily.payments.length === 0 ? (
                    <p className="text-sm text-stone-500">Nothing received yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {openFamily.payments.map((p) => (
                        <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 text-sm">
                          <span className="flex items-center gap-2">
                            <span className="font-mono font-semibold tabular-nums text-stone-900">
                              {formatCents(p.amountCents - p.refundedCents)}
                            </span>
                            <StatusDot status={p.status} />
                            {p.isOffline && <Badge>offline</Badge>}
                          </span>
                          <span className="flex items-center gap-3">
                            <span className="font-mono text-xs text-stone-500">
                              {p.paidAt ? p.paidAt.slice(0, 10) : "—"}
                            </span>
                            {["succeeded", "partially_refunded"].includes(p.status) &&
                              p.amountCents - p.refundedCents > 0 &&
                              !p.isOffline && (
                                <Button
                                  variant="quiet"
                                  size="sm"
                                  className="text-alert-red"
                                  disabled={disabled}
                                  onClick={() => refund(openFamily, p.id, p.amountCents - p.refundedCents)}
                                >
                                  <Undo2 className="h-3.5 w-3.5" /> Refund
                                </Button>
                              )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-stone-500">Schedule</h4>
                  {openFamily.schedule.length === 0 ? (
                    <p className="text-sm text-stone-500">No instalments scheduled.</p>
                  ) : (
                    <ul className="space-y-2">
                      {openFamily.schedule.map((s) => (
                        <li key={s.id} className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-mono text-stone-700">{s.dueOn}</span>
                          <span className="flex items-center gap-2">
                            <span className="font-mono font-semibold tabular-nums text-stone-900">
                              {formatCents(s.amountCents)}
                            </span>
                            <StatusDot status={s.status} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </Panel>
          )}
        </div>
      )}

      {tab === "aid" && (
        <DataTable
          columns={[
            {
              key: "household",
              header: "Household",
              primary: true,
              cell: (a: AidApplication) => (
                <div className="min-w-0">
                  <div className="font-bold text-stone-900">{a.householdName}</div>
                  {a.narrative && <p className="mt-1 max-w-2xl text-xs text-stone-600">{a.narrative}</p>}
                </div>
              ),
            },
            { key: "status", header: "Decision", cell: (a: AidApplication) => <StatusDot status={a.status} /> },
            {
              key: "asked",
              header: "Asked",
              align: "right",
              cell: (a: AidApplication) => formatCents(a.requestedCents ?? 0),
            },
            {
              key: "awarded",
              header: "Awarded",
              align: "right",
              cell: (a: AidApplication) => (
                <span className="font-bold text-forest-800">{formatCents(a.awardedCents ?? 0)}</span>
              ),
            },
          ]}
          rows={aid}
          rowKey={(a) => a.id}
          empty={
            <span className="inline-flex flex-col items-center gap-2">
              <HandCoins className="h-5 w-5 text-stone-500" />
              No families have applied for aid this season.
            </span>
          }
        />
      )}
    </PageShell>
  );
}
