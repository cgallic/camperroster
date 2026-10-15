import type { Role } from "./auth";

/**
 * What each camp role is for, in the director's words. The Team access page
 * shows these next to the role picker so a director can assign roles without
 * having to know what the database policies allow.
 */
export const ROLE_DETAILS: ReadonlyArray<{ role: Role; label: string; description: string }> = [
  { role: "director", label: "Director", description: "Everything, including team access, billing and historical records. Use this for assistant directors too." },
  { role: "registrar", label: "Registrar", description: "Registrations, families, forms, cabins, documents, mail, finance and reports. Sees insurance, not health records." },
  { role: "nurse", label: "Nurse", description: "Health profiles, medications and the medication log, plus the counselor roster." },
  { role: "red_shirt", label: "Red shirt", description: "Volunteer applications, references and background checks, plus the counselor roster." },
  { role: "counselor", label: "Counselor", description: "Their cabin roster and the canteen." },
  { role: "staff", label: "Staff", description: "Check-in, the counselor roster and the canteen." },
];

export function roleLabel(role: string): string {
  return ROLE_DETAILS.find((item) => item.role === role)?.label ?? role.replace(/_/g, " ");
}

export type TeamMember = { userId: string; role: string };

/**
 * Why a role change or removal would leave the camp without a director, or
 * null when it is safe. A camp with no director has nobody who can invite or
 * fix access, so the last one can never be demoted or removed.
 */
export function lastDirectorProblem(members: readonly TeamMember[], userId: string, nextRole: Role | null): string | null {
  const target = members.find((member) => member.userId === userId);
  if (!target || target.role !== "director" || nextRole === "director") return null;
  const directors = members.filter((member) => member.role === "director").length;
  return directors <= 1 ? "A camp must keep at least one director. Make someone else a director first." : null;
}
