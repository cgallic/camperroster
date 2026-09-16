import Link from "next/link";
import { notFound } from "next/navigation";
import { requireArea } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import StaffHeader from "@/components/StaffHeader";
import { AUDIENCE_LABELS, type FormAudience, type FormField, type RegistrationPeriod } from "@/lib/forms";
import FormEditorClient from "./FormEditorClient";

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
      <main className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <span className="font-mono text-xs font-bold text-forest-800 bg-forest-100 px-3 py-1 rounded-full uppercase">
              {AUDIENCE_LABELS[typedPeriod.audience as FormAudience] ?? typedPeriod.audience}
            </span>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-stone-900 mt-2">
              {typedPeriod.name}
            </h1>
          </div>
          <Link
            href="/admin/forms"
            className="px-4 py-2 rounded-full bg-stone-100 text-stone-800 font-bold text-xs hover:bg-stone-200 w-max"
          >
            ← All forms
          </Link>
        </div>

        <FormEditorClient
          period={typedPeriod}
          liveVersion={live ? { id: live.id, version: live.version, published_at: live.published_at } : null}
          workingVersion={working ? { id: working.id, version: working.version, isDraft: !working.published_at } : null}
          initialTitle={working?.title ?? typedPeriod.name}
          initialIntro={working?.intro_text ?? ""}
          initialFields={fields}
        />
      </main>
    </>
  );
}
