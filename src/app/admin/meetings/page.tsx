import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import StaffHeader from "@/components/StaffHeader";
import { PageHeader, PageShell, Panel } from "@/components/ui";
import NewMeetingForm from "./NewMeetingForm";
import { MEETING_ROLES } from "./roles";

export const dynamic = "force-dynamic";

function formatDay(iso: string | null): string {
  if (!iso) return "No date set";
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function MeetingsPage() {
  const membership = await requireRole([...MEETING_ROLES], "/admin/meetings");
  const supabase = await createClient();

  const { data: meetings, error } = await supabase
    .from("staff_meetings")
    .select("id, name, held_on, staff_meeting_attendance(count)")
    .eq("camp_id", membership.campId)
    .order("held_on", { ascending: false, nullsFirst: true })
    .order("created_at", { ascending: false });

  return (
    <>
      <StaffHeader />
      <PageShell width="narrow">
        <PageHeader
          eyebrow="Volunteers & staff"
          title="Meeting sign-in"
          description="Sign volunteers in at a meeting and see whose required documents are still missing."
        />

        <Panel title="Add a meeting">
          <NewMeetingForm />
        </Panel>

        {error ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
            Meetings could not be loaded. If this is a new deployment, the staff meetings migration may not be applied yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {(meetings ?? []).map((meeting) => {
              const signedIn = (meeting.staff_meeting_attendance as unknown as { count: number }[] | null)?.[0]?.count ?? 0;
              return (
                <Link
                  key={meeting.id}
                  href={`/admin/meetings/${meeting.id}`}
                  className="block rounded-2xl border border-stone-200 bg-white p-5 transition hover:border-forest-600 hover:shadow-sm"
                >
                  <h2 className="font-display text-lg font-extrabold text-stone-900">{meeting.name}</h2>
                  <p className="mt-1 text-xs text-stone-600">
                    {formatDay(meeting.held_on)} · {signedIn} signed in
                  </p>
                </Link>
              );
            })}
            {(meetings ?? []).length === 0 && (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
                No meetings yet. Add the volunteer mandatory meeting above.
              </div>
            )}
          </div>
        )}
      </PageShell>
    </>
  );
}
