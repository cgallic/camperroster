import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  canViewPeriod,
  checkAudienceAge,
  pickKnownAnswers,
  validateSubmission,
  type FormAnswers,
  type FormAudience,
  type FormField,
  type RegistrationPeriod,
} from "@/lib/forms";

/**
 * Public intake for admin-built forms. There is no session here by definition,
 * so this runs on the service client — which means every check the browser did
 * gets done again: the form must be published, the window open (or the token
 * right), and the answers must pass the same validator.
 */
export async function POST(req: Request) {
  let body: { form_id?: string; token?: string | null; answers?: FormAnswers };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const formId = typeof body.form_id === "string" ? body.form_id : null;
  if (!formId) return NextResponse.json({ error: "Missing form." }, { status: 400 });

  const supabase = createAdminClient();

  const { data: definition } = await supabase
    .from("form_definitions")
    .select("id, camp_id, period_id, published_at")
    .eq("id", formId)
    .maybeSingle();

  if (!definition || !definition.published_at) {
    return NextResponse.json({ error: "This form is no longer accepting responses." }, { status: 404 });
  }

  const { data: periodRow } = await supabase
    .from("registration_periods")
    .select("*")
    .eq("id", definition.period_id)
    .maybeSingle();
  const period = periodRow as RegistrationPeriod | null;

  if (!period || !canViewPeriod(period, typeof body.token === "string" ? body.token : null)) {
    return NextResponse.json({ error: "Registration for this form is closed." }, { status: 403 });
  }

  const { data: fieldRows } = await supabase
    .from("form_fields")
    .select("*")
    .eq("form_id", definition.id)
    .order("display_order");

  const fields = ((fieldRows as FormField[] | null) ?? []).map((f) => ({
    ...f,
    options: Array.isArray(f.options) ? f.options : [],
  }));

  const answers = pickKnownAnswers(fields, (body.answers ?? {}) as FormAnswers);

  const result = validateSubmission(fields, answers);
  if (!result.ok) {
    return NextResponse.json({ error: "Some answers need attention.", errors: result.errors }, { status: 422 });
  }

  // Someone who is still a teen at camp time does not belong on the adult form,
  // whatever the client let them pick.
  const dobKey = fields.find((f) => f.field_type === "date" && /birth|dob/i.test(f.field_key))?.field_key;
  const dob = dobKey ? answers[dobKey] : null;
  const campStart = period.opens_at ?? new Date().toISOString();
  const ageGuard = checkAudienceAge(period.audience as FormAudience, dob ? String(dob) : null, campStart);
  if (!ageGuard.ok) {
    return NextResponse.json(
      {
        error: ageGuard.reason,
        errors: dobKey ? { [dobKey]: ageGuard.reason } : undefined,
        suggestedAudience: ageGuard.suggestedAudience,
      },
      { status: 422 }
    );
  }

  const { data: inserted, error } = await supabase
    .from("form_submissions")
    .insert({
      camp_id: definition.camp_id,
      form_id: definition.id,
      answers,
      submitted_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return NextResponse.json({ error: "We could not save that submission." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, submission_id: inserted.id });
}
