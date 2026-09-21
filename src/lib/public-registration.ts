import type { PublicCampSession } from "./campLookup";

/** Keep a valid choice, then honor a deep link, then choose the first active session. */
export function chooseSessionId(
  sessions: Pick<PublicCampSession, "id">[],
  current: string,
  requested: string | null,
): string {
  if (sessions.some((session) => session.id === current)) return current;
  if (requested && sessions.some((session) => session.id === requested)) return requested;
  return sessions[0]?.id ?? "";
}

export function registrationDraftKey(campSlug: string): string {
  return `camperroster:registration-draft:${campSlug}`;
}
