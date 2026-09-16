/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from "@/lib/supabase/server";
import type { CabinRow, Occupant, WaitlistRow } from "./types";

const ASSIGNMENT_SELECT =
  "id, cabin_id, occupant_role, registration_id, staff_application_id, " +
  "registrations(id, campers(legal_first_name, legal_last_name, grade_entering)), " +
  "staff_applications(first_name, last_name)";

const WAITLIST_SELECT =
  "id, position, status, gender, grade, created_at, registration_id, " +
  "registrations(id, campers(legal_first_name, legal_last_name, grade_entering))";

function personName(row: any): string {
  const camper = row?.registrations?.campers;
  if (camper) return [camper.legal_first_name, camper.legal_last_name].filter(Boolean).join(" ") || "Unnamed camper";
  const staff = row?.staff_applications;
  if (staff) return [staff.first_name, staff.last_name].filter(Boolean).join(" ") || "Unnamed volunteer";
  return "Unnamed occupant";
}

/** Cabins with their live occupancy and the people seated in them. */
export async function loadCabinBoard(): Promise<CabinRow[]> {
  const supabase = await createClient();

  const [{ data: occupancy }, { data: assignments }] = await Promise.all([
    supabase.from("cabin_occupancy").select("*"),
    supabase.from("cabin_assignments").select(ASSIGNMENT_SELECT),
  ]);

  const byCabin = new Map<string, Occupant[]>();
  for (const row of (assignments ?? []) as any[]) {
    const list = byCabin.get(row.cabin_id) ?? [];
    list.push({
      assignmentId: row.id,
      registrationId: row.registration_id ?? null,
      staffApplicationId: row.staff_application_id ?? null,
      name: personName(row),
      grade: row?.registrations?.campers?.grade_entering ?? null,
      role: (row.occupant_role ?? "camper") as Occupant["role"],
    });
    byCabin.set(row.cabin_id, list);
  }

  return ((occupancy ?? []) as any[])
    .map<CabinRow>((c) => ({
      cabinId: c.cabin_id,
      name: c.name ?? "Unnamed cabin",
      gender: c.gender ?? null,
      minGrade: c.min_grade ?? null,
      maxGrade: c.max_grade ?? null,
      capacity: c.capacity ?? 12,
      isOpen: c.is_open ?? true,
      campersAssigned: c.campers_assigned ?? 0,
      spotsRemaining: c.spots_remaining ?? 0,
      occupants: (byCabin.get(c.cabin_id) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** The waiting queue in the order spots should be offered. */
export async function loadWaitlist(onlyWaiting = true): Promise<WaitlistRow[]> {
  const supabase = await createClient();

  let query = supabase.from("waitlist_entries").select(WAITLIST_SELECT).order("position", { ascending: true });
  if (onlyWaiting) query = query.in("status", ["waiting", "offered"]);

  const { data } = await query;

  return ((data ?? []) as any[]).map<WaitlistRow>((row) => ({
    id: row.id,
    position: Number(row.position),
    status: row.status ?? "waiting",
    gender: row.gender ?? null,
    grade: row.grade ?? null,
    name: personName(row),
    registrationId: row.registration_id ?? null,
    createdAt: row.created_at,
  }));
}
