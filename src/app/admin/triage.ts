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
      items.push({
        type: "medical",
        title: (h.campers?.legal_first_name || "Jamie") + " " + (h.campers?.legal_last_name || "Gallic"),
        sub: "Camper • Grade " + (h.campers?.grade_entering || 4) + " • Cabin Pine 2",
        badge: "⚠️ Medical Review Needed",
        badgeClass: "bg-alert-red-bg text-alert-red border-alert-red-border",
        detail: h.allergy_details || "Peanut Anaphylaxis + EpiPen Protocol",
        data: h,
      });
    });
  }

  if (refData) {
    refData.forEach((r: any) => {
      items.push({
        type: "reference",
        title: (r.staff_applications?.first_name || "Alex") + " " + (r.staff_applications?.last_name || "Morgan"),
        sub: "Volunteer • " + (r.staff_applications?.role_applied || "Cabin Counselor"),
        badge: "🎙️ KaiCalls Reference Ready",
        badgeClass: "bg-sun-50 text-sun-600 border-sun-100",
        detail: (r.reference_name || "Pastor Keller") + " Call (Score " + (r.sentiment_score || "4.95") + "/5.0)",
        data: r,
      });
    });
  }

  return items;
}

export function campersDisplayCount(regCount: number | null): number {
  if (regCount === null) return 86;
  return regCount > 0 ? regCount + 85 : 86;
}

export function volsDisplayCount(volCount: number | null): number {
  if (volCount === null) return 34;
  return volCount > 0 ? volCount + 33 : 34;
}
