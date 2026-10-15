import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  canViewPeriod,
  checkAudienceAge,
  normalizeOptions,
  pickKnownAnswers,
  validateSubmission,
  type FormAnswers,
  type FormAudience,
  type FormField,
  type RegistrationPeriod,
} from "@/lib/forms";
import { buildFamilyIntake, formSupportsFamilyIntake, isFamilyAudience } from "@/lib/form-family-intake";
import { campStartsOn, priceFamilyInvoice } from "@/lib/invoicing";
import { issueIntakeToken } from "@/lib/signed-payload";

/**
 * Public intake for admin-built forms. There is no session here by definition,
 * so this runs on the service client — which means every check the browser did
 * gets done again: the form must be published, the window open (or the token
 * right), and the answers must pass the same validator.
 *
 * A family form that asks the household questions (see FAMILY_INTAKE_KEYS)
 * goes further: it creates the family, one camper and registration per
 * repeated camper block, and the household invoice priced from the camp's
 * tiers. Anything else is stored as a form response, as before.
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
    options: normalizeOptions(f.options),
  }));

  const answers = pickKnownAnswers(fields, (body.answers ?? {}) as FormAnswers);

  const result = validateSubmission(fields, answers);
  if (!result.ok) {
    return NextResponse.json({ error: "Some answers need attention.", errors: result.errors }, { status: 422 });
  }

  // Someone who is still a teen at camp time does not belong on the adult form,
  // whatever the client let them pick. Age is measured on the first day of
  // camp (the earliest active session, the same week intake and invoicing use),
  // not the day registration opens; the window date is only a fallback for a
  // camp with no session set up yet.
  const dobKey = fields.find((f) => f.field_type === "date" && /birth|dob/i.test(f.field_key))?.field_key;
  const dob = dobKey ? answers[dobKey] : null;
  const firstDay = dob ? await campStartsOn(supabase, definition.camp_id) : null;
  const campStart = firstDay ?? period.opens_at ?? new Date().toISOString();
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

  if (isFamilyAudience(period.audience as FormAudience) && formSupportsFamilyIntake(fields)) {
    return createHousehold(req, supabase, definition, answers, fields);
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

type Db = ReturnType<typeof createAdminClient>;

async function createHousehold(
  req: Request,
  supabase: Db,
  definition: { id: string; camp_id: string },
  answers: FormAnswers,
  fields: FormField[]
) {
  const intake = buildFamilyIntake(fields, answers);
  if (!intake.ok) {
    return NextResponse.json({ error: "Some answers need attention.", errors: intake.errors }, { status: 422 });
  }

  const idempotencyKey = (req.headers.get("idempotency-key") ?? "").trim();
  if (idempotencyKey.length < 8 || idempotencyKey.length > 200) {
    return NextResponse.json({ error: "Please reload the page and submit again. Nothing was saved." }, { status: 400 });
  }

  const { data: result, error } = await supabase.rpc("create_form_family_intake", {
    p_camp_id: definition.camp_id,
    p_form_id: definition.id,
    p_idempotency_key: idempotencyKey,
    p_payload: { ...intake.payload, answers },
  });

  if (error || !result) {
    if (error?.code === "40001") {
      return NextResponse.json({ error: "That registration is already being saved. Please wait a moment." }, { status: 409 });
    }
    if (error?.code === "23503") {
      return NextResponse.json(
        { error: "Registration is not set up yet: the camp has no active session. Nothing was saved." },
        { status: 503 }
      );
    }
    console.error("Family form intake failed:", error);
    return NextResponse.json({ error: "We could not save that registration. Nothing was saved." }, { status: 500 });
  }

  const created = result as {
    family_id: string;
    season_id: string;
    camper_ids: string[];
    registration_ids: string[];
    submission_id: string;
  };

  // Household pricing reads pricing_tiers through family_tuition_cents, so two
  // or more campers get the camp's family rate without any code. A pricing
  // failure must not undo a saved registration; the office can re-price.
  let billing: { invoiceId: string; totalDueCents: number; uploadToken: string | null; camperCount: number } | null = null;
  try {
    const { invoice } = await priceFamilyInvoice(supabase, {
      campId: definition.camp_id,
      seasonId: created.season_id,
      familyId: created.family_id,
    });
    billing = {
      invoiceId: invoice.id,
      totalDueCents: invoice.total_due_cents,
      camperCount: invoice.camper_count,
      uploadToken: issueIntakeToken({
        campId: definition.camp_id,
        registrationId: created.registration_ids[0],
        camperId: created.camper_ids[0],
        invoiceId: invoice.id,
      }),
    };
  } catch (pricingError) {
    console.error("Family form intake saved but could not be priced:", pricingError);
  }

  return NextResponse.json({
    ok: true,
    submission_id: created.submission_id,
    registration_ids: created.registration_ids,
    billing,
  });
}
