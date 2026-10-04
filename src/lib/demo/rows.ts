import { DEMO_IDS, demoBunkNotes, demoCabins, demoCamp, demoCampers, demoMedications, demoSession, demoStaff } from "./fixtures.ts";

/**
 * The demo camp as table rows, in insert order (parents before children).
 * Used by scripts/demo-seed-sql.ts and the nightly /api/demo/reset job.
 */
export function demoRows(day: string): [table: string, rows: Record<string, unknown>[]][] {
  const camp = DEMO_IDS.camp;
  return [
    ["camps", [demoCamp]],
    ["camp_sessions", [{ ...demoSession, camp_id: camp, is_active: true }]],
    ["cabins", demoCabins.map((c, i) => ({ id: c.id, camp_id: camp, session_id: DEMO_IDS.session, name: c.name, gender: c.gender, min_grade: c.min_grade, max_grade: c.max_grade, capacity: c.capacity, is_open: true, sort_order: i }))],
    ["families", demoCampers.map((c) => ({ id: c.familyId, camp_id: camp, household_name: `${c.last} household`, city: "Asheville", state: "NC", zip: "28801" }))],
    ["guardians", demoCampers.map((c) => ({ id: c.guardianId, camp_id: camp, family_id: c.familyId, first_name: c.guardianFirst, last_name: c.guardianLast, email: c.guardianEmail, phone: c.guardianPhone, relationship: c.relation, address_line1: "100 Example Lane", city: "Asheville", state: "NC", zip: "28801" }))],
    ["campers", demoCampers.map((c) => ({ id: c.camperId, camp_id: camp, family_id: c.familyId, guardian_id: c.guardianId, legal_first_name: c.first, legal_last_name: c.last, preferred_name: c.preferred ?? null, birth_date: c.birth, gender: c.gender, grade_entering: c.grade }))],
    ["registrations", demoCampers.map((c) => ({ id: c.registrationId, camp_id: camp, camp_slug: demoCamp.slug, session_id: DEMO_IDS.session, camper_id: c.camperId, guardian_id: c.guardianId, status: "confirmed", progress_percentage: 100, buddy_requests: c.buddies ?? [], cabin_id: c.cabinId, cabin_name: c.cabin, counselor_name: c.counselor, canteen_balance_cents: c.balance, total_tuition_cents: demoSession.price_cents, amount_paid_cents: demoSession.price_cents, checked_in: c.checkedIn, checked_in_at: c.checkedIn ? `${day}T14:30:00Z` : null }))],
    ["health_profiles", demoCampers.map((c) => ({ id: c.healthId, camp_id: camp, camper_id: c.camperId, has_allergies: Boolean(c.allergy), allergy_details: c.allergy?.details ?? null, has_epipen: Boolean(c.allergy?.epipen), epipen_location: c.allergy?.epipen ?? null, has_medications: Boolean(c.meds?.length), medication_details: c.meds?.map((m) => `${m.name} ${m.dosage}`).join("; ") ?? null, immunization_status: "pending_review", immunization_reviewed_by: null, immunization_reviewed_at: null }))],
    ["cabin_assignments", demoCampers.map((c) => ({ id: c.assignmentId, camp_id: camp, cabin_id: c.cabinId, registration_id: c.registrationId, occupant_role: "camper" }))],
    ["emar_logs", demoMedications(day).map((m) => ({ id: m.id, camper_id: m.camperId, session_id: DEMO_IDS.session, medication_name: m.medication, dosage: m.dosage, scheduled_time: m.scheduledTime, administered_at: m.administeredAt, administered_by: m.administeredBy, notes: m.notes }))],
    ["staff_applications", demoStaff.map((s) => ({ id: s.id, camp_id: camp, first_name: s.first, last_name: s.last, email: s.email, phone: "555-0300", birth_date: s.birth, role_applied: s.role, status: "submitted" }))],
    ["staff_references", demoStaff.filter((s) => s.reference).map((s) => ({ id: s.reference!.id, camp_id: camp, application_id: s.id, reference_name: s.reference!.name, relationship: s.reference!.relationship, phone: s.reference!.phone, status: "completed", call_transcript: s.reference!.transcript, sentiment_score: s.reference!.score, director_reviewed: false }))],
    ["bunk_notes", demoBunkNotes(day)],
  ];
}
