import { requireArea } from "@/lib/auth";
import StaffHeader from "@/components/StaffHeader";
import ReviewQueueClient from "./ReviewQueueClient";
import { loadDocumentsDashboard } from "./data";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  camper: "Camper",
  teen_volunteer: "Teen",
  adult_volunteer: "Adult",
};

function Bar({ approved, total }: { approved: number; total: number }) {
  const pct = total > 0 ? Math.round((approved / total) * 100) : 0;
  return (
    <div className="mt-3">
      <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
        <div className="h-full rounded-full bg-forest-700" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-stone-500">{pct}% of required paperwork approved</p>
    </div>
  );
}

export default async function DocumentsPage() {
  const membership = await requireArea("admin", "/admin/documents");
  const dashboard = await loadDocumentsDashboard(membership.campId);

  return (
    <>
      <StaffHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <header className="mb-8">
          <h1 className="font-display text-3xl font-bold text-stone-900">Paperwork</h1>
          <p className="mt-1 text-sm text-stone-600">
            Every required form, card and credential{dashboard.seasonName ? ` for ${dashboard.seasonName}` : ""}.
            Credentials lapsing on or before {dashboard.cutoff} need renewing before camp.
          </p>
        </header>

        {/* Where each group stands */}
        <section className="grid gap-4 sm:grid-cols-3">
          {dashboard.summaries.map((s) => (
            <div key={s.kind} className="rounded-2xl border border-stone-200 bg-white p-5">
              <h2 className="font-display font-bold text-stone-900">{s.label}</h2>
              <p className="mt-1 text-sm text-stone-600">
                {s.people} {s.people === 1 ? "person" : "people"} tracked
              </p>
              <p className="mt-3 font-display text-3xl font-bold text-forest-800">
                {s.outstanding}
                <span className="ml-2 font-body text-sm font-semibold text-stone-500">outstanding</span>
              </p>
              <Bar approved={s.approved} total={s.requiredTotal} />
            </div>
          ))}
        </section>

        {/* The reason validity_months exists */}
        <section className="mt-8">
          <h2 className="font-display text-xl font-bold text-stone-900">Expiring soon</h2>
          <p className="mt-1 text-sm text-stone-600">
            Multi-year credentials — PGC, VIRTUS, background checks — that lapse before camp. Chase these in the
            off-season, not at check-in.
          </p>
          <div className="mt-3 overflow-hidden rounded-2xl border border-stone-200 bg-white">
            {dashboard.expiring.length === 0 ? (
              <p className="p-5 text-sm text-stone-500">Nothing lapses before {dashboard.cutoff}.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-left font-mono text-[10px] uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className="px-5 py-2.5">Volunteer</th>
                    <th className="px-5 py-2.5">Credential</th>
                    <th className="px-5 py-2.5">Valid for</th>
                    <th className="px-5 py-2.5">Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.expiring.map((row) => (
                    <tr key={row.recordId} className="border-t border-stone-100">
                      <td className="px-5 py-3 font-semibold text-stone-900">{row.personName}</td>
                      <td className="px-5 py-3 text-stone-700">{row.typeName}</td>
                      <td className="px-5 py-3 text-stone-500">
                        {row.validityMonths ? `${row.validityMonths} months` : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase ${
                            row.alreadyLapsed
                              ? "border-alert-red-border bg-alert-red-bg text-alert-red"
                              : "border-sun-100 bg-sun-50 text-sun-600"
                          }`}
                        >
                          {row.alreadyLapsed ? `lapsed ${row.expiresOn}` : row.expiresOn}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Review queue */}
        <section className="mt-8">
          <h2 className="font-display text-xl font-bold text-stone-900">
            Review queue
            <span className="ml-2 font-body text-sm font-semibold text-stone-500">
              {dashboard.reviewQueue.length} waiting
            </span>
          </h2>
          <div className="mt-3">
            <ReviewQueueClient initialRows={dashboard.reviewQueue} />
          </div>
        </section>

        {/* Who is missing what */}
        <section className="mt-8">
          <h2 className="font-display text-xl font-bold text-stone-900">Who is missing what</h2>
          <div className="mt-3 space-y-2">
            {dashboard.outstanding.length === 0 ? (
              <p className="rounded-2xl border border-forest-100 bg-forest-50 p-5 text-sm text-forest-800">
                Everyone tracked is fully papered. That has never happened before — check the seed data.
              </p>
            ) : (
              dashboard.outstanding.map((row) => (
                <div key={row.personId} className="rounded-xl border border-stone-200 bg-white p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-900">{row.personName}</span>
                    <span className="rounded-full border border-stone-200 bg-stone-100 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-stone-600">
                      {KIND_LABEL[row.kind] ?? row.kind}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {row.expired.map((name) => (
                      <span
                        key={`e-${name}`}
                        className="rounded-full border border-alert-red-border bg-alert-red-bg px-2.5 py-1 text-xs font-semibold text-alert-red"
                      >
                        {name} — expired
                      </span>
                    ))}
                    {row.rejected.map((name) => (
                      <span
                        key={`r-${name}`}
                        className="rounded-full border border-sun-100 bg-sun-50 px-2.5 py-1 text-xs font-semibold text-sun-600"
                      >
                        {name} — sent back
                      </span>
                    ))}
                    {row.missing.map((name) => (
                      <span
                        key={`m-${name}`}
                        className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs text-stone-600"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </>
  );
}
