/**
 * Where a registration actually sleeps.
 *
 * The cabin board writes `cabin_assignments`; the old `registrations.cabin_name`
 * and `counselor_name` columns are left over from before placement existed and
 * nothing writes them. Every reader embeds the assignment with this select and
 * resolves it through `placementOf`, falling back to the legacy columns only
 * when a registration has no assignment.
 *
 * The lead counselor comes from `cabins.lead_counselor_id`. The hint is
 * required: cabins and staff_applications are also joined through
 * cabin_assignments, so PostgREST would otherwise call the embed ambiguous.
 * Roles that cannot read staff_applications under RLS get a null there and
 * fall back like everyone else.
 */
export const CABIN_PLACEMENT_SELECT =
  "cabin_assignments(cabin_id, cabins(id, name, staff_applications!cabins_lead_counselor_id_fkey(first_name, last_name)))";

export type CabinPlacement = { cabinId: string | null; cabinName: string | null; counselorName: string | null };

function one<T>(value: T | T[] | null | undefined): T | null {
  return (Array.isArray(value) ? value[0] : value) ?? null;
}

export function placementOf(row: any): CabinPlacement {
  const assignment = one<any>(row?.cabin_assignments);
  const cabin = one<any>(assignment?.cabins);
  const lead = one<any>(cabin?.staff_applications);
  const leadName = [lead?.first_name, lead?.last_name].filter(Boolean).join(" ").trim();
  return {
    cabinId: assignment?.cabin_id ?? row?.cabin_id ?? null,
    cabinName: cabin?.name ?? row?.cabin_name ?? null,
    counselorName: leadName || row?.counselor_name || null,
  };
}
