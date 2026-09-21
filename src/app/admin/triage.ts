/**
 * Shared shaping for the triage queue, so the server component's first render
 * and the client's "Sync DB" refetch produce identical rows.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export type TriageItem = {
  type: "medical" | "reference";
  title: string;
  sub: string;
  badge: string;
  badgeClass: string;
  detail: string;
  data: any;
};

export const HEALTH_SELECT =
  "id, camper_id, has_allergies, allergy_details, has_epipen, epipen_location, campers(legal_first_name, legal_last_name, grade_entering)";

export const REFERENCE_SELECT =
  "id, reference_name, relationship, phone, sentiment_score, call_transcript, staff_applications(first_name, last_name, role_applied)";

export function buildTriageItems(healthData: any[] | null, refData: any[] | null): TriageItem[] {
  const items: TriageItem[] = [];

  if (healthData) {
    healthData.forEach((h: any) => {
      const camperName = [h.campers?.legal_first_name, h.campers?.legal_last_name].filter(Boolean).join(" ");
      const grade = h.campers?.grade_entering;
      items.push({
        type: "medical",
        title: camperName || `Camper record ${h.camper_id ?? h.id}`,
        sub: grade == null ? "Camper" : `Camper • Grade ${grade}`,
        badge: "⚠️ Medical Review Needed",
        badgeClass: "bg-alert-red-bg text-alert-red border-alert-red-border",
        detail: h.allergy_details || "Allergy details not provided",
        data: h,
      });
    });
  }

  if (refData) {
    refData.forEach((r: any) => {
      const applicantName = [r.staff_applications?.first_name, r.staff_applications?.last_name].filter(Boolean).join(" ");
      const score = r.sentiment_score == null ? "not scored" : `${r.sentiment_score}/5.0`;
      items.push({
        type: "reference",
        title: applicantName || "Staff application",
        sub: r.staff_applications?.role_applied
          ? `Volunteer • ${r.staff_applications.role_applied}`
          : "Volunteer applicant",
        badge: "🎙️ KaiCalls Reference Ready",
        badgeClass: "bg-sun-50 text-sun-600 border-sun-100",
        detail: `${r.reference_name || "Unnamed reference"} call (${score})`,
        data: r,
      });
    });
  }

  return items;
}

export function campersDisplayCount(regCount: number | null): number {
  return regCount ?? 0;
}

export function volsDisplayCount(volCount: number | null): number {
  return volCount ?? 0;
}
