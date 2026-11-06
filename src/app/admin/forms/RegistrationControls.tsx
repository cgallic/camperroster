"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Link2 } from "lucide-react";
import { Badge, Button, Notice, Panel, inputClass, selectClass } from "@/components/ui";
import { createRegistrationInvite, revokeRegistrationInvite, setRegistrationOpen } from "./actions";

export type InviteRow = {
  id: string;
  label: string | null;
  periodName: string;
  createdAt: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
  useCount: number;
};

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * The director's two controls: the camp-wide registration switch, and private
 * links that still open a form while the switch is off. Registrars see the
 * switch's state but cannot change it.
 */
export default function RegistrationControls({
  registrationOpen,
  canManage,
  periods,
  invites,
}: {
  registrationOpen: boolean;
  canManage: boolean;
  periods: { id: string; name: string }[];
  invites: InviteRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const [periodId, setPeriodId] = useState(periods[0]?.id ?? "");
  const [label, setLabel] = useState("");
  const [newLink, setNewLink] = useState<string | null>(null);

  const toggle = () =>
    startTransition(async () => {
      const result = await setRegistrationOpen(!registrationOpen);
      setNotice(result);
      if (result.ok) router.refresh();
    });

  const create = () =>
    startTransition(async () => {
      const result = await createRegistrationInvite({ periodId, label });
      setNotice(result);
      if (result.ok) {
        setNewLink(`${window.location.origin}${result.path}`);
        setLabel("");
        router.refresh();
      }
    });

  const revoke = (id: string) =>
    startTransition(async () => {
      const result = await revokeRegistrationInvite(id);
      setNotice(result);
      if (result.ok) router.refresh();
    });

  return (
    <div className="space-y-4">
      {notice && <Notice tone={notice.ok ? "ok" : "error"}>{notice.message}</Notice>}

      <Panel
        title="Registration"
        description={
          registrationOpen
            ? "On. Each form follows its own dates and visibility below."
            : "Off. Every form is closed to the public. Private invite links still work."
        }
        actions={
          <>
            <Badge tone={registrationOpen ? "complete" : "neutral"}>{registrationOpen ? "On" : "Off"}</Badge>
            {canManage && (
              <button
                type="button"
                role="switch"
                aria-checked={registrationOpen}
                aria-label="Registration on or off"
                onClick={toggle}
                disabled={pending}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                  registrationOpen ? "bg-forest-700" : "bg-stone-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    registrationOpen ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            )}
          </>
        }
      >
        {!canManage && <p className="text-xs text-stone-500">Only a camp director can turn registration on or off.</p>}
      </Panel>

      {canManage && (
        <Panel
          title="Private invite links"
          description="A personal link to one form. It works even when registration is off, until you revoke it."
        >
          <div className="space-y-4">
            {periods.length === 0 ? (
              <p className="text-sm text-stone-500">Add a registration period first.</p>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <select value={periodId} onChange={(e) => setPeriodId(e.target.value)} className={selectClass} aria-label="Form">
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  maxLength={200}
                  placeholder="Who it's for (e.g. Smith family)"
                  className={`${inputClass} sm:flex-1`}
                  aria-label="Who the link is for"
                />
                <Button type="button" variant="primary" onClick={create} disabled={pending || !periodId}>
                  <Link2 className="h-3.5 w-3.5" />
                  Create link
                </Button>
              </div>
            )}

            {newLink && (
              <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
                <code className="truncate font-mono text-[11px] text-stone-700">{newLink}</code>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(newLink)}
                  className="ml-auto shrink-0 text-stone-500 hover:text-stone-800"
                  aria-label="Copy link"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            )}

            {invites.length > 0 && (
              <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200">
                {invites.map((invite) => (
                  <li key={invite.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 text-xs">
                    <span className="font-bold text-stone-900">{invite.label || "Unlabelled link"}</span>
                    <span className="text-stone-500">{invite.periodName}</span>
                    <span className="text-stone-500">Made {shortDate(invite.createdAt)}</span>
                    <span className="text-stone-500">
                      {invite.useCount > 0 && invite.lastUsedAt
                        ? `Used ${invite.useCount}× · last ${shortDate(invite.lastUsedAt)}`
                        : "Not used yet"}
                    </span>
                    <span className="ml-auto">
                      {invite.revokedAt ? (
                        <Badge tone="neutral">Revoked</Badge>
                      ) : (
                        <Button type="button" variant="quiet" size="sm" onClick={() => revoke(invite.id)} disabled={pending}>
                          Revoke
                        </Button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}
