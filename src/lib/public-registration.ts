import type { PublicCampSession, PublicRegistrationPeriod } from "./campLookup";
import { AUDIENCE_LABELS, type FormAudience } from "./forms.ts";

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

export const FAMILY_AUDIENCES = ["returning_family", "new_family"] as const satisfies readonly FormAudience[];
export const VOLUNTEER_AUDIENCES = ["returning_adult", "new_adult", "teen_volunteer"] as const satisfies readonly FormAudience[];

export interface PeriodFormLink {
  audience: FormAudience;
  label: string;
  href: string;
  /** Set only while the period has not opened yet. */
  opensAt: string | null;
}

/**
 * Camp-page buttons for the period forms, in FORM_AUDIENCES order. Only
 * publicly listed periods get a button: link_only forms are reached through the
 * office's private link, and closed ones would only show a closed notice.
 */
export function periodFormLinks(
  campSlug: string,
  periods: Pick<PublicRegistrationPeriod, "audience" | "opensAt" | "closesAt" | "visibility">[],
  audiences: readonly FormAudience[],
  now: Date = new Date(),
): PeriodFormLink[] {
  return audiences.flatMap((audience) => {
    const period = periods.find((p) => p.audience === audience && p.visibility === "public");
    if (!period) return [];
    if (period.closesAt && now >= new Date(period.closesAt)) return [];
    return [{
      audience,
      label: AUDIENCE_LABELS[audience],
      href: `/register/${audience}?camp=${encodeURIComponent(campSlug)}`,
      opensAt: period.opensAt && now < new Date(period.opensAt) ? period.opensAt : null,
    }];
  });
}
