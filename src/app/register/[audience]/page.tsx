import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarX } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import {
  AUDIENCE_LABELS,
  FORM_AUDIENCES,
  canViewPeriod,
  type FormAudience,
  type FormField,
  type RegistrationPeriod,
} from "@/lib/forms";
import PublicFormClient from "./PublicFormClient";

export const dynamic = "force-dynamic";

export default async function PublicRegistrationFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ audience: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { audience } = await params;
  const { token } = await searchParams;
  if (!FORM_AUDIENCES.includes(audience as FormAudience)) notFound();

  // Public intake has no session, so RLS has no user to evaluate; the service
  // client reads the published form and the window is enforced here.
  const supabase = createAdminClient();

  const { data: season } = await supabase
    .from("seasons")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const { data: periodRow } = season
    ? await supabase
        .from("registration_periods")
        .select("*")
        .eq("season_id", season.id)
        .eq("audience", audience)
        .maybeSingle()
    : { data: null };

  const period = periodRow as RegistrationPeriod | null;
  const label = AUDIENCE_LABELS[audience as FormAudience];

  if (!period || !canViewPeriod(period, token ?? null)) {
    return <ClosedNotice label={label} name={period?.name ?? label} />;
  }

  const { data: definition } = await supabase
    .from("form_definitions")
    .select("id, title, intro_text, version")
    .eq("period_id", period.id)
    .not("published_at", "is", null)
    .maybeSingle();

  if (!definition) return <ClosedNotice label={label} name={period.name} noForm />;

  const { data: fieldRows } = await supabase
    .from("form_fields")
    .select("*")
    .eq("form_id", definition.id)
    .order("display_order");

  const fields = ((fieldRows as FormField[] | null) ?? []).map((f) => ({
    ...f,
    options: Array.isArray(f.options) ? f.options : [],
  }));

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-6">
        <span className="font-mono text-xs font-bold text-forest-800 bg-forest-100 px-3 py-1 rounded-full uppercase">
          {label}
        </span>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-stone-900 mt-3">{definition.title}</h1>
        {definition.intro_text && <p className="text-stone-600 mt-2">{definition.intro_text}</p>}
      </div>

      <PublicFormClient
        formId={definition.id}
        audience={audience as FormAudience}
        token={token ?? null}
        fields={fields}
      />
    </main>
  );
}

function ClosedNotice({ label, name, noForm }: { label?: string; name: string; noForm?: boolean }) {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16 sm:py-24 text-center space-y-5">
      <div className="w-16 h-16 bg-stone-100 text-stone-600 rounded-full flex items-center justify-center mx-auto">
        <CalendarX className="w-8 h-8" />
      </div>
      <h1 className="font-display font-black text-2xl sm:text-3xl text-stone-900">
        {noForm ? `${name} registration is not ready yet` : `${label ?? name} registration is closed`}
      </h1>
      <p className="text-stone-600">
        {noForm
          ? "The camp office is still putting this year's questions together. Please check back soon."
          : "This form is not accepting responses right now. If the office sent you a private link, open that link directly — it carries the access token."}
      </p>
      <Link href="/" className="inline-block px-5 py-2.5 rounded-full bg-forest-800 text-white font-bold text-sm hover:bg-forest-900">
        Back to camp home
      </Link>
    </main>
  );
}
