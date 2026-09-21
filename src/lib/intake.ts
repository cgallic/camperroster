export type IntakeKind = "registrations" | "volunteers" | "custom";

export interface RegistrationIntakeRow {
  id: string;
  camperName: string;
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  sessionName: string;
  status: string;
  paymentPlan: string;
  submittedAt: string;
}

export interface VolunteerIntakeRow {
  id: string;
  applicantName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  backgroundStatus: string;
  submittedAt: string;
}

export interface CustomIntakeRow {
  id: string;
  formTitle: string;
  audience: string;
  submittedAt: string;
  answers: Array<{ label: string; value: string }>;
}

export function humanizeIntakeValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Not answered";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map(humanizeIntakeValue).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function searchableAnswerText(answers: CustomIntakeRow["answers"]): string {
  return answers.map((answer) => `${answer.label} ${answer.value}`).join(" ");
}

export function matchesIntakeSearch(values: unknown[], query: string): boolean {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return true;
  return values.some((value) => String(value ?? "").toLocaleLowerCase().includes(needle));
}

