import Link from "next/link";
import { notFound } from "next/navigation";
import { requireArea } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import StaffHeader from "@/components/StaffHeader";
import { AUDIENCE_LABELS, type FormAudience, type FormField, type RegistrationPeriod } from "@/lib/forms";
import FormEditorClient from "./FormEditorClient";
import { PageHeader, PageShell } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminFormEditorPage({
  params,
}: {
  params: Promise<{ periodId: string }>;
}) {
  const { periodId } = await params;
  await requireArea("admin", `/admin/forms/${periodId}`);
  const supabase = await createClient();

  const { data: period } = await supabase
    .from("registration_periods")
    .select("*")
    .eq("id", periodId)
    .maybeSingle();
  if (!period) notFound();

  const { data: definitions } = await supabase
    .from("form_definitions")
    .select("id, camp_id, period_id, version, title, intro_text, published_at")
    .eq("period_id", periodId)
    .order("version", { ascending: false });

  const all = definitions ?? [];
  const live = all.find((d) => d.published_at) ?? null;
  const draft = all.find((d) => !d.published_at) ?? null;
  // The draft is the working copy; with none, the editor opens on the live
  // version and the first save forks it into a new version.
  const working = draft ?? live;

  const fields: FormField[] = working
    ? (((
        await supabase
          .from("form_fields")
          .select("*")
          .eq("form_id", working.id)
          .order("display_order")
      ).data as FormField[] | null) ?? [])
    : [];

  const typedPeriod = period as RegistrationPeriod;

  return (
    <>
      <StaffHeader />
      <PageShell width="narrow">
        <PageHeader
          eyebrow={AUDIENCE_LABELS[typedPeriod.audience as FormAudience] ?? typedPeriod.audience}
          title={typedPeriod.name}
          description="Questions, the window families can answer in, and who can reach the form."
          actions={
            <Link
              href="/admin/forms"
              className="inline-flex items-center rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50"
            >
              ← All forms
            </Link>
          }
        />

        <FormEditorClient
          period={typedPeriod}
          liveVersion={live ? { id: live.id, version: live.version, published_at: live.published_at } : null}
          workingVersion={working ? { id: working.id, version: working.version, isDraft: !working.published_at } : null}
          initialTitle={working?.title ?? typedPeriod.name}
          initialIntro={working?.intro_text ?? ""}
          initialFields={fields}
        />
      </PageShell>
    </>
  );
}
