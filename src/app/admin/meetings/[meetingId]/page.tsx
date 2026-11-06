import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import StaffHeader from "@/components/StaffHeader";
import { PageHeader, PageShell } from "@/components/ui";
import {
  isExpectedVolunteer,
  outstandingDocuments,
  volunteerKind,
  type MeetingDocRecord,
  type MeetingDocType,
  type MeetingRosterRow,
} from "@/lib/meeting-checkin";
import { MEETING_ROLES } from "../roles";
import MeetingRosterClient from "./MeetingRosterClient";

export const dynamic = "force-dynamic";

export default async function MeetingRosterPage({ params }: { params: Promise<{ meetingId: string }> }) {
  const { meetingId } = await params;
  const membership = await requireRole([...MEETING_ROLES], `/admin/meetings/${meetingId}`);
  const supabase = await createClient();

  const { data: meeting } = await supabase
    .from("staff_meetings")
    .select("id, name, held_on")
    .eq("id", meetingId)
    .eq("camp_id", membership.campId)
    .maybeSingle();
  if (!meeting) notFound();

  const [{ data: people }, { data: types }, { data: records }, { data: attendance }] = await Promise.all([
    supabase
      .from("staff_applications")
      .select("id, first_name, last_name, birth_date, role_applied, status")
      .eq("camp_id", membership.campId)
      .order("last_name")
      .order("first_name"),
    supabase
      .from("document_types")
      .select("id, name, applies_to, is_required")
      .eq("camp_id", membership.campId)
      .in("applies_to", ["teen_volunteer", "adult_volunteer"])
      .order("display_order"),
    supabase
      .from("document_records")
      .select("document_type_id, staff_application_id, status, expires_on")
      .eq("camp_id", membership.campId)
      .not("staff_application_id", "is", null),
    supabase
      .from("staff_meeting_attendance")
      .select("staff_application_id, signed_in_at")
      .eq("meeting_id", meeting.id),
  ]);

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const docTypes = (types ?? []) as MeetingDocType[];
  const recordsByPerson = new Map<string, MeetingDocRecord[]>();
  for (const record of (records ?? []) as MeetingDocRecord[]) {
    if (!record.staff_application_id) continue;
    const list = recordsByPerson.get(record.staff_application_id) ?? [];
    list.push(record);
    recordsByPerson.set(record.staff_application_id, list);
  }
  const signedIn = new Map((attendance ?? []).map((a) => [a.staff_application_id, a.signed_in_at]));

  const rows: MeetingRosterRow[] = (people ?? [])
    // Anyone already signed in stays on the list even if their status changed since.
    .filter((p) => isExpectedVolunteer(p.status) || signedIn.has(p.id))
    .map((p) => {
      const kind = volunteerKind(p.birth_date, now);
      const outstanding = outstandingDocuments(kind, docTypes, recordsByPerson.get(p.id) ?? [], today);
      return {
        id: p.id,
        name: [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unnamed volunteer",
        kind,
        role: p.role_applied ?? null,
        signedInAt: signedIn.get(p.id) ?? null,
        docsComplete: outstanding.length === 0,
        outstanding,
      };
    });

  const when = meeting.held_on
    ? new Date(`${meeting.held_on}T00:00:00Z`).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })
    : null;

  return (
    <>
      <StaffHeader />
      <PageShell>
        <PageHeader
          eyebrow="Meeting sign-in"
          title={meeting.name}
          description={when ?? undefined}
          actions={
            <Link
              href="/admin/meetings"
              className="inline-flex items-center rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50"
            >
              ← All meetings
            </Link>
          }
        />
        <MeetingRosterClient meetingId={meeting.id} initialRows={rows} />
      </PageShell>
    </>
  );
}
