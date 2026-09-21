export type MedicationWindow = "breakfast" | "lunch" | "dinner" | "bedtime";

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function medicationWindow(isoTimestamp: string): MedicationWindow {
  const hour = new Date(isoTimestamp).getHours();
  if (hour < 10) return "breakfast";
  if (hour < 15) return "lunch";
  if (hour < 20) return "dinner";
  return "bedtime";
}

export function ageOnDate(birthDate: string | null, reference = new Date()): number | null {
  if (!birthDate) return null;
  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;
  let age = reference.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    reference.getMonth() < birth.getMonth() ||
    (reference.getMonth() === birth.getMonth() && reference.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export function safeApiMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const candidate = payload as { message?: unknown; error?: unknown };
  if (typeof candidate.message === "string" && candidate.message.trim()) return candidate.message;
  if (typeof candidate.error === "string" && candidate.error.trim() && candidate.error !== "setup_incomplete") {
    return candidate.error;
  }
  return fallback;
}
