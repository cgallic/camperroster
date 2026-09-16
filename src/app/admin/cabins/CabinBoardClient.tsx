"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, DoorClosed, DoorOpen, Plus, Users } from "lucide-react";
import {
  Button,
  Notice,
  PageHeader,
  Panel,
  PageShell,
  SectionHeader,
  StatCard,
  StatStrip,
  StatusDot,
  inputClass,
} from "@/components/ui";
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
      closed: cabins.filter((c) => !c.isOpen).length,
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
    <PageShell>
      <PageHeader
        eyebrow="Cabin placement"
        title="Cabin Board"
        description="Campers are placed automatically into the cabin matching their grade and gender. Everything below is an override on top of that."
        actions={
          <>
            <Link
              href="/admin/cabins/waitlist"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 transition-colors hover:bg-stone-50"
            >
              <Users className="h-3.5 w-3.5" />
              Waitlist ({waitlist.length})
            </Link>
            <Button variant="primary" onClick={() => setShowNewCabin((v) => !v)}>
              <Plus className="h-4 w-4" />
              Add cabin
            </Button>
          </>
        }
      />

      {banner && <Notice tone={banner.tone}>{banner.message}</Notice>}

      {showNewCabin && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void createCabin(e.currentTarget);
          }}
          className="grid grid-cols-2 items-end gap-3 rounded-2xl border border-stone-200 bg-white p-5 text-xs lg:grid-cols-6"
        >
          <label className="col-span-2 space-y-1">
            <span className="font-bold text-stone-600">Cabin name</span>
            <input name="name" required placeholder="Pine 3" className={inputClass + " w-full"} />
          </label>
          <label className="space-y-1">
            <span className="font-bold text-stone-600">Gender</span>
            <select name="gender" className={inputClass + " w-full"}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="font-bold text-stone-600">Lowest grade</span>
            <input name="minGrade" type="number" min={0} max={12} defaultValue={4} className={inputClass + " w-full"} />
          </label>
          <label className="space-y-1">
            <span className="font-bold text-stone-600">Highest grade</span>
            <input name="maxGrade" type="number" min={0} max={12} defaultValue={4} className={inputClass + " w-full"} />
          </label>
          <div className="flex gap-2">
            <label className="flex-1 space-y-1">
              <span className="font-bold text-stone-600">Cap</span>
              <input name="capacity" type="number" min={1} max={40} defaultValue={12} className={inputClass + " w-full"} />
            </label>
            <Button type="submit" variant="primary" disabled={disabled} className="self-end">
              Create
            </Button>
          </div>
        </form>
      )}

      <StatStrip>
        <StatCard
          label="Campers placed"
          value={totals.assigned}
          of={totals.capacity}
          tone="complete"
          progress={totals.capacity > 0 ? (totals.assigned / totals.capacity) * 100 : 0}
          progressLabel={`of the beds across ${cabins.length} ${cabins.length === 1 ? "cabin" : "cabins"}`}
        />
        <StatCard
          label="Two spots from cap"
          value={totals.tight}
          tone={totals.tight > 0 ? "overdue" : "neutral"}
          hint="Open another cabin before these fill."
        />
        <StatCard
          label="Waiting for a spot"
          value={waitlist.length}
          tone={waitlist.length > 0 ? "waitlisted" : "neutral"}
          hint="Offered strictly in sign-up order."
        />
        <StatCard
          label="Closed to placement"
          value={totals.closed}
          tone="neutral"
          hint="Cabins staff have taken out of the rotation."
        />
      </StatStrip>

      {groups.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
          No cabins yet. Add one to start placing campers.
        </div>
      )}

      {groups.map((group) => (
        <section key={group.key} className="space-y-3">
          <SectionHeader
            title={group.label}
            description={`${group.cabins.length} ${group.cabins.length === 1 ? "cabin" : "cabins"} in this band`}
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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

      <Panel
        title="Next off the waitlist"
        description="Offered strictly in position order."
        actions={
          <Link href="/admin/cabins/waitlist" className="text-xs font-bold text-forest-800 hover:underline">
            See full queue →
          </Link>
        }
        bodyClassName="p-0"
      >
        <ul className="divide-y divide-stone-100">
          {waitlist.length === 0 && <li className="px-5 py-8 text-center text-sm text-stone-500">Nobody is waiting.</li>}
          {waitlist.slice(0, 5).map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <b className="block text-sm font-bold text-stone-900">
                  #{entry.position} · {entry.name}
                </b>
                <span className="text-[11px] text-stone-500">
                  {genderLabel(entry.gender)} · Grade {entry.grade ?? "?"} · waiting {waitingFor(entry.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <StatusDot tone="waitlisted" label="Waitlisted" />
                <Button variant="primary" size="sm" disabled={disabled} onClick={() => void promote(entry)}>
                  Promote
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </PageShell>
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
    <div
      className={
        "space-y-4 rounded-2xl border bg-white p-5 " +
        (low && cabin.isOpen ? "border-alert-red-border ring-1 ring-alert-red-border" : "border-stone-200")
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <b className="font-display font-extrabold text-base text-stone-900">{cabin.name}</b>
          <div className="text-[11px] text-stone-500">
            {bucketLabel(cabin.gender, cabin.minGrade, cabin.maxGrade)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {low && cabin.isOpen && (
            <StatusDot
              tone="overdue"
              label={cabin.spotsRemaining <= 0 ? "Full" : `${cabin.spotsRemaining} left`}
            />
          )}
          {!cabin.isOpen && <StatusDot tone="neutral" label="Closed" />}
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
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
          <div
            className={"h-full rounded-full transition-all " + (low ? "bg-alert-red" : "bg-forest-600")}
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
        {cabin.occupants.length === 0 && <li className="py-2 text-stone-500">Nobody placed here yet.</li>}
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
          <span className="text-stone-500"> · {ROLE_LABELS[occupant.role]}</span>
          {occupant.grade !== null && (
            <span className="text-stone-500"> · {gradeBandLabel(occupant.grade, occupant.grade)}</span>
          )}
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
            className="min-w-40 flex-1 rounded-lg border border-stone-200 px-2 py-1 text-[11px]"
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
          {eligible.length === 0 && <span className="text-[11px] text-stone-500">No other cabin fits this camper.</span>}
        </div>
      )}
    </li>
  );
}
