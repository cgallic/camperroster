"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRightLeft, DoorClosed, DoorOpen, Plus, Users } from "lucide-react";
import {
  ROLE_LABELS,
  bucketLabel,
  genderLabel,
  gradeBandLabel,
  groupCabins,
  isRunningLow,
  waitingFor,
  type CabinRow,
  type Occupant,
  type WaitlistRow,
} from "./types";

type Banner = { tone: "ok" | "error"; message: string } | null;

async function postJson(url: string, body: unknown, method: "POST" | "PATCH" = "POST") {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "That did not go through");
  return json;
}

export default function CabinBoardClient({
  initialCabins,
  initialWaitlist,
}: {
  initialCabins: CabinRow[];
  initialWaitlist: WaitlistRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [banner, setBanner] = useState<Banner>(null);
  const [busy, setBusy] = useState(false);
  const [showNewCabin, setShowNewCabin] = useState(false);

  const cabins = initialCabins;
  const waitlist = initialWaitlist;
  const groups = useMemo(() => groupCabins(cabins), [cabins]);

  const totals = useMemo(
    () => ({
      capacity: cabins.reduce((n, c) => n + c.capacity, 0),
      assigned: cabins.reduce((n, c) => n + c.campersAssigned, 0),
      tight: cabins.filter((c) => c.isOpen && isRunningLow(c)).length,
    }),
    [cabins],
  );

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

  const moveCamper = (occupant: Occupant, cabinId: string, cabinName: string, override: boolean) =>
    run(async () => {
      await postJson("/api/cabins/move", { registrationId: occupant.registrationId, cabinId, override });
      return `${occupant.name} moved to ${cabinName}${override ? " (over cap, override)" : ""}.`;
    });

  const setCapacity = (cabin: CabinRow, capacity: number) =>
    run(async () => {
      await postJson("/api/cabins/capacity", { cabinId: cabin.cabinId, capacity });
      return `${cabin.name} cap set to ${capacity}.`;
    });

  const toggleOpen = (cabin: CabinRow) =>
    run(async () => {
      await postJson("/api/cabins", { cabinId: cabin.cabinId, isOpen: !cabin.isOpen }, "PATCH");
      return `${cabin.name} is now ${cabin.isOpen ? "closed to" : "open for"} placements.`;
    });

  const promote = (entry: WaitlistRow, cabinId?: string) =>
    run(async () => {
      await postJson("/api/cabins/waitlist/promote", { waitlistEntryId: entry.id, cabinId });
      return `${entry.name} promoted off the waitlist.`;
    });

  const createCabin = (form: HTMLFormElement) => {
    const data = new FormData(form);
    return run(async () => {
      const name = String(data.get("name") ?? "").trim();
      await postJson("/api/cabins", {
        name,
        gender: String(data.get("gender") ?? "male"),
        minGrade: Number(data.get("minGrade") ?? 0),
        maxGrade: Number(data.get("maxGrade") ?? 0),
        capacity: Number(data.get("capacity") ?? 12),
      });
      form.reset();
      setShowNewCabin(false);
      return `${name} created.`;
    });
  };

  const disabled = busy || pending;

  return (
    <main className="py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="font-mono text-[10px] font-bold uppercase text-forest-800 bg-forest-50 px-2.5 py-1 rounded-full border border-forest-100">
              Cabin Placement
            </span>
            <h1 className="font-display font-black text-3xl text-stone-900 mt-2">Cabin Board</h1>
            <p className="text-xs text-stone-500 mt-1">
              Campers are placed automatically into the cabin matching their grade and gender. Everything below is an
              override on top of that.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/cabins/waitlist"
              className="px-3.5 py-2 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              Waitlist ({waitlist.length})
            </Link>
            <button
              onClick={() => setShowNewCabin((v) => !v)}
              className="px-4 py-2 bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Cabin
            </button>
          </div>
        </div>

        {banner && (
          <div
            className={
              "rounded-xl px-4 py-3 text-xs font-semibold border " +
              (banner.tone === "ok"
                ? "bg-forest-50 border-forest-100 text-forest-800"
                : "bg-alert-red-bg border-alert-red-border text-alert-red")
            }
          >
            {banner.message}
          </div>
        )}

        {showNewCabin && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void createCabin(e.currentTarget);
            }}
            className="double-bezel p-5 grid grid-cols-2 lg:grid-cols-6 gap-3 items-end text-xs"
          >
            <label className="col-span-2 space-y-1">
              <span className="font-bold text-stone-600">Cabin name</span>
              <input name="name" required placeholder="Pine 3" className="w-full rounded-xl border border-stone-200 px-3 py-2" />
            </label>
            <label className="space-y-1">
              <span className="font-bold text-stone-600">Gender</span>
              <select name="gender" className="w-full rounded-xl border border-stone-200 px-3 py-2">
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="font-bold text-stone-600">Lowest grade</span>
              <input name="minGrade" type="number" min={0} max={12} defaultValue={4} className="w-full rounded-xl border border-stone-200 px-3 py-2" />
            </label>
            <label className="space-y-1">
              <span className="font-bold text-stone-600">Highest grade</span>
              <input name="maxGrade" type="number" min={0} max={12} defaultValue={4} className="w-full rounded-xl border border-stone-200 px-3 py-2" />
            </label>
            <div className="flex gap-2">
              <label className="space-y-1 flex-1">
                <span className="font-bold text-stone-600">Cap</span>
                <input name="capacity" type="number" min={1} max={40} defaultValue={12} className="w-full rounded-xl border border-stone-200 px-3 py-2" />
              </label>
              <button
                type="submit"
                disabled={disabled}
                className="self-end px-4 py-2 bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-white font-bold rounded-xl cursor-pointer"
              >
                Create
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="double-bezel p-5 space-y-1">
            <span className="text-xs text-stone-500 font-bold">Campers Placed</span>
            <div className="font-display font-black text-3xl text-stone-900">
              {totals.assigned} <span className="text-sm font-normal text-stone-400 font-body">/ {totals.capacity}</span>
            </div>
            <span className="text-xs text-forest-700 font-semibold">{cabins.length} cabins</span>
          </div>
          <div className={"p-5 space-y-1 rounded-2xl border " + (totals.tight > 0 ? "bg-alert-red-bg border-alert-red-border" : "double-bezel border-transparent")}>
            <span className={"text-xs font-bold flex items-center gap-1 " + (totals.tight > 0 ? "text-alert-red" : "text-stone-500")}>
              <AlertTriangle className="w-3.5 h-3.5" />
              Two Spots From Cap
            </span>
            <div className="font-display font-black text-3xl text-stone-900">{totals.tight}</div>
            <span className="text-xs text-stone-500 font-semibold">Open another cabin before these fill</span>
          </div>
          <div className="double-bezel p-5 space-y-1">
            <span className="text-xs text-stone-500 font-bold">Waiting</span>
            <div className="font-display font-black text-3xl text-stone-900">{waitlist.length}</div>
            <span className="text-xs text-forest-700 font-semibold">Offered in sign-up order</span>
          </div>
        </div>

        {groups.length === 0 && (
          <div className="double-bezel p-8 text-center text-sm text-stone-500">
            No cabins yet. Add one to start placing campers.
          </div>
        )}

        {groups.map((group) => (
          <section key={group.key} className="space-y-4">
            <h2 className="font-display font-extrabold text-lg text-stone-900">{group.label}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {group.cabins.map((cabin) => (
                <CabinCard
                  key={cabin.cabinId}
                  cabin={cabin}
                  allCabins={cabins}
                  disabled={disabled}
                  onMove={moveCamper}
                  onCapacity={setCapacity}
                  onToggleOpen={toggleOpen}
                />
              ))}
            </div>
          </section>
        ))}

        <section className="double-bezel overflow-hidden">
          <div className="p-6 bg-white border-b border-stone-100 flex items-center justify-between">
            <div>
              <h2 className="font-display font-extrabold text-lg text-stone-900">Next Off The Waitlist</h2>
              <p className="text-xs text-stone-500">Offered strictly in position order.</p>
            </div>
            <Link href="/admin/cabins/waitlist" className="text-xs font-bold text-forest-800 hover:underline">
              See full queue →
            </Link>
          </div>
          <div className="divide-y divide-stone-100 text-xs">
            {waitlist.length === 0 && <div className="p-5 text-stone-500">Nobody is waiting.</div>}
            {waitlist.slice(0, 5).map((entry) => (
              <div key={entry.id} className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <b className="text-sm font-extrabold text-stone-900 block">
                    #{entry.position} · {entry.name}
                  </b>
                  <span className="text-stone-500 text-[11px]">
                    {genderLabel(entry.gender)} · Grade {entry.grade ?? "?"} · waiting {waitingFor(entry.createdAt)}
                  </span>
                </div>
                <button
                  disabled={disabled}
                  onClick={() => void promote(entry)}
                  className="px-3 py-1.5 rounded-xl bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-white font-bold cursor-pointer"
                >
                  Promote
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function CabinCard({
  cabin,
  allCabins,
  disabled,
  onMove,
  onCapacity,
  onToggleOpen,
}: {
  cabin: CabinRow;
  allCabins: CabinRow[];
  disabled: boolean;
  onMove: (occupant: Occupant, cabinId: string, cabinName: string, override: boolean) => void;
  onCapacity: (cabin: CabinRow, capacity: number) => void;
  onToggleOpen: (cabin: CabinRow) => void;
}) {
  const low = isRunningLow(cabin);
  const fillPct = cabin.capacity > 0 ? Math.min(100, Math.round((cabin.campersAssigned / cabin.capacity) * 100)) : 0;

  return (
    <div className={"rounded-2xl border p-5 space-y-4 bg-white " + (low ? "border-alert-red-border ring-1 ring-alert-red-border" : "border-stone-200")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <b className="font-display font-extrabold text-base text-stone-900">{cabin.name}</b>
          <div className="text-[11px] text-stone-500">
            {bucketLabel(cabin.gender, cabin.minGrade, cabin.maxGrade)}
            {!cabin.isOpen && " · closed"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {low && cabin.isOpen && (
            <span className="font-mono text-[10px] font-bold text-alert-red bg-alert-red-bg border border-alert-red-border px-2 py-1 rounded-full flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {cabin.spotsRemaining <= 0 ? "Full" : `${cabin.spotsRemaining} left`}
            </span>
          )}
          <button
            disabled={disabled}
            onClick={() => onToggleOpen(cabin)}
            title={cabin.isOpen ? "Close to new placements" : "Reopen for placements"}
            className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 disabled:opacity-50 cursor-pointer"
          >
            {cabin.isOpen ? <DoorOpen className="w-4 h-4" /> : <DoorClosed className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] font-bold text-stone-600">
          <span>
            {cabin.campersAssigned} / {cabin.capacity} campers
          </span>
          <span className={low ? "text-alert-red" : "text-forest-700"}>{cabin.spotsRemaining} spots remaining</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-stone-100 overflow-hidden">
          <div
            className={"h-full rounded-full transition-all " + (low ? "bg-alert-red" : "bg-forest-800")}
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px]">
        <span className="font-bold text-stone-600">Cap</span>
        <button
          disabled={disabled || cabin.capacity <= cabin.campersAssigned}
          onClick={() => onCapacity(cabin, cabin.capacity - 1)}
          className="px-2 py-1 rounded-lg border border-stone-200 hover:bg-stone-50 font-bold disabled:opacity-40 cursor-pointer"
        >
          −
        </button>
        <span className="font-mono font-bold text-stone-900">{cabin.capacity}</span>
        <button
          disabled={disabled}
          onClick={() => onCapacity(cabin, cabin.capacity + 1)}
          className="px-2 py-1 rounded-lg border border-stone-200 hover:bg-stone-50 font-bold disabled:opacity-40 cursor-pointer"
        >
          +
        </button>
      </div>

      <ul className="divide-y divide-stone-100 text-xs">
        {cabin.occupants.length === 0 && <li className="py-2 text-stone-400">Empty</li>}
        {cabin.occupants.map((occupant) => (
          <OccupantRow
            key={occupant.assignmentId}
            occupant={occupant}
            cabin={cabin}
            allCabins={allCabins}
            disabled={disabled}
            onMove={onMove}
          />
        ))}
      </ul>
    </div>
  );
}

function OccupantRow({
  occupant,
  cabin,
  allCabins,
  disabled,
  onMove,
}: {
  occupant: Occupant;
  cabin: CabinRow;
  allCabins: CabinRow[];
  disabled: boolean;
  onMove: (occupant: Occupant, cabinId: string, cabinName: string, override: boolean) => void;
}) {
  const [moving, setMoving] = useState(false);
  const [target, setTarget] = useState("");

  const eligible = allCabins.filter((c) => {
    if (c.cabinId === cabin.cabinId) return false;
    if (c.gender !== cabin.gender) return false;
    const grade = occupant.grade;
    if (grade === null || c.minGrade === null || c.maxGrade === null) return true;
    return grade >= c.minGrade && grade <= c.maxGrade;
  });

  const chosen = eligible.find((c) => c.cabinId === target);
  const needsOverride = Boolean(chosen && chosen.spotsRemaining <= 0);

  return (
    <li className="py-2 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="font-semibold text-stone-900">{occupant.name}</span>
          <span className="text-stone-400"> · {ROLE_LABELS[occupant.role]}</span>
          {occupant.grade !== null && <span className="text-stone-400"> · {gradeBandLabel(occupant.grade, occupant.grade)}</span>}
        </div>
        {occupant.registrationId && (
          <button
            onClick={() => setMoving((v) => !v)}
            className="p-1 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-50 cursor-pointer"
            title="Move to another cabin"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {moving && occupant.registrationId && (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="rounded-lg border border-stone-200 px-2 py-1 text-[11px] flex-1 min-w-40"
          >
            <option value="">Move to…</option>
            {eligible.map((c) => (
              <option key={c.cabinId} value={c.cabinId}>
                {c.name} ({c.campersAssigned}/{c.capacity}){c.spotsRemaining <= 0 ? " — full" : ""}
              </option>
            ))}
          </select>
          <button
            disabled={disabled || !chosen}
            onClick={() => chosen && onMove(occupant, chosen.cabinId, chosen.name, needsOverride)}
            className="px-3 py-1 rounded-lg bg-forest-800 hover:bg-forest-900 disabled:opacity-40 text-white font-bold text-[11px] cursor-pointer"
          >
            {needsOverride ? "Move anyway" : "Move"}
          </button>
          {eligible.length === 0 && <span className="text-[11px] text-stone-400">No other cabin fits this camper.</span>}
        </div>
      )}
    </li>
  );
}
