/** Shapes shared by the cabin board server page and its client island. */

export type Occupant = {
  assignmentId: string;
  registrationId: string | null;
  staffApplicationId: string | null;
  name: string;
  grade: number | null;
  role: "camper" | "teen_counselor" | "adult_sleep_in";
};

export type CabinRow = {
  cabinId: string;
  name: string;
  gender: string | null;
  minGrade: number | null;
  maxGrade: number | null;
  capacity: number;
  isOpen: boolean;
  campersAssigned: number;
  spotsRemaining: number;
  occupants: Occupant[];
};

export type WaitlistRow = {
  id: string;
  position: number;
  status: string;
  gender: string | null;
  grade: number | null;
  name: string;
  registrationId: string | null;
  createdAt: string;
};

/** Two spots from the cap is the camp's early warning to open another cabin. */
export const LOW_SPOTS_THRESHOLD = 2;

export function isRunningLow(cabin: Pick<CabinRow, "spotsRemaining">) {
  return cabin.spotsRemaining <= LOW_SPOTS_THRESHOLD;
}

export function genderLabel(gender: string | null) {
  if (!gender) return "Unassigned";
  return gender.charAt(0).toUpperCase() + gender.slice(1);
}

export function gradeBandLabel(minGrade: number | null, maxGrade: number | null) {
  if (minGrade === null || maxGrade === null) return "Any grade";
  if (minGrade === maxGrade) return `Grade ${minGrade}`;
  return `Grades ${minGrade}–${maxGrade}`;
}

export function bucketKey(gender: string | null, minGrade: number | null, maxGrade: number | null) {
  return `${gender ?? "none"}|${minGrade ?? "?"}-${maxGrade ?? "?"}`;
}

export function bucketLabel(gender: string | null, minGrade: number | null, maxGrade: number | null) {
  return `${genderLabel(gender)} • ${gradeBandLabel(minGrade, maxGrade)}`;
}

export const ROLE_LABELS: Record<Occupant["role"], string> = {
  camper: "Camper",
  teen_counselor: "Teen counselor",
  adult_sleep_in: "Adult sleep-in",
};

/** Groups cabins into the gender + grade band sections the board renders. */
export function groupCabins(cabins: CabinRow[]) {
  const groups = new Map<string, { key: string; label: string; cabins: CabinRow[] }>();
  for (const cabin of cabins) {
    const key = bucketKey(cabin.gender, cabin.minGrade, cabin.maxGrade);
    if (!groups.has(key)) {
      groups.set(key, { key, label: bucketLabel(cabin.gender, cabin.minGrade, cabin.maxGrade), cabins: [] });
    }
    groups.get(key)!.cabins.push(cabin);
  }
  return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label));
}

/** "3 days" / "6 hours" — how long someone has been waiting. */
export function waitingFor(createdAt: string, now: number = Date.now()) {
  const minutes = Math.max(0, Math.round((now - new Date(createdAt).getTime()) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} hr`;
  return `${Math.round(hours / 24)} days`;
}
