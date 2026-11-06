"use server";

import { revalidatePath } from "next/cache";
import { requireArea } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { serializeVisibleWhen } from "@/lib/forms";
import type { FieldOption, FieldType, PeriodVisibility, VisibleWhen } from "@/lib/forms";
import { hashInviteToken, invitePath, newInviteToken } from "@/lib/registration-invites";

export type FieldDraft = {
  field_key: string;
  label: string;
  help_text: string | null;
  field_type: FieldType;
  required: boolean;
  options: FieldOption[];
  visible_when: VisibleWhen | null;
  section: string | null;
  repeat_count_field: string | null;
};

export type ActionResult = { ok: true; message: string } | { ok: false; message: string };

function randomToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Adds the registration period for an audience the active season lacks. */
export async function createPeriod(input: {
  seasonId: string;
  audience: string;
  name: string;
}): Promise<ActionResult> {
  const membership = await requireArea("admin", "/admin/forms");
  const supabase = await createClient();

  const { error } = await supabase.from("registration_periods").insert({
    camp_id: membership.campId,
    season_id: input.seasonId,
    audience: input.audience,
    name: input.name,
    visibility: "closed",
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/forms");
  return { ok: true, message: "Registration period added." };
}

/** Open/close window and visibility for one period. */
export async function savePeriodSettings(input: {
  periodId: string;
  opensAt: string | null;
  closesAt: string | null;
  visibility: PeriodVisibility;
}): Promise<ActionResult> {
  await requireArea("admin", "/admin/forms");
  const supabase = await createClient();

  const { error } = await supabase
    .from("registration_periods")
    .update({
      opens_at: input.opensAt || null,
      closes_at: input.closesAt || null,
      visibility: input.visibility,
    })
    .eq("id", input.periodId);

  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/forms");
  revalidatePath(`/admin/forms/${input.periodId}`);
  return { ok: true, message: "Window and visibility saved." };
}

/**
 * Mints a fresh access token (or clears it). Rotating invalidates every link
 * already handed out, which is the point of the button.
 */
export async function rotateAccessToken(periodId: string, clear = false): Promise<ActionResult> {
  await requireArea("admin", "/admin/forms");
  const supabase = await createClient();

  const { error } = await supabase
    .from("registration_periods")
    .update({ access_token: clear ? null : randomToken() })
    .eq("id", periodId);

  if (error) return { ok: false, message: error.message };
  revalidatePath(`/admin/forms/${periodId}`);
  return { ok: true, message: clear ? "Link retired." : "New link generated." };
}

/**
 * Writes the editor's working copy back.
 *
 * Never mutates a published version: if the only definition for this period is
 * live, the save lands on a new draft version instead. Publishing then clears
 * `published_at` on the previous live version first, because a partial unique
 * index allows exactly one published version per period.
 */
export async function saveForm(input: {
  periodId: string;
  title: string;
  introText: string | null;
  successText: string | null;
  fields: FieldDraft[];
  publish: boolean;
}): Promise<ActionResult> {
  const membership = await requireArea("admin", "/admin/forms");
  const supabase = await createClient();

  const keys = input.fields.map((f) => f.field_key);
  if (keys.some((k) => !k.trim())) return { ok: false, message: "Every question needs a key." };
  if (new Set(keys).size !== keys.length) return { ok: false, message: "Question keys must be unique." };
  if (!input.title.trim()) return { ok: false, message: "The form needs a title." };
  const badRepeat = input.fields.find(
    (f, i) => f.repeat_count_field && !input.fields.slice(0, i).some((e) => e.field_key === f.repeat_count_field)
  );
  if (badRepeat) {
    return { ok: false, message: `"${badRepeat.label || badRepeat.field_key}" repeats off a question that is not above it.` };
  }

  const { data: period, error: periodError } = await supabase
    .from("registration_periods")
    .select("id, camp_id")
    .eq("id", input.periodId)
    .maybeSingle();
  if (periodError || !period) return { ok: false, message: periodError?.message ?? "Period not found." };

  const campId = period.camp_id ?? membership.campId;

  const { data: definitions, error: defsError } = await supabase
    .from("form_definitions")
    .select("id, version, published_at")
    .eq("period_id", input.periodId)
    .order("version", { ascending: false });
  if (defsError) return { ok: false, message: defsError.message };

  const existing = definitions ?? [];
  const live = existing.find((d) => d.published_at);
  const draft = existing.find((d) => !d.published_at);

  let targetId: string;
  if (draft) {
    targetId = draft.id;
    const { error } = await supabase
      .from("form_definitions")
      .update({ title: input.title.trim(), intro_text: input.introText || null, success_text: input.successText || null })
      .eq("id", draft.id);
    if (error) return { ok: false, message: error.message };
  } else {
    const nextVersion = (existing[0]?.version ?? 0) + 1;
    const { data: created, error } = await supabase
      .from("form_definitions")
      .insert({
        camp_id: campId,
        period_id: input.periodId,
        version: nextVersion,
        title: input.title.trim(),
        intro_text: input.introText || null,
        success_text: input.successText || null,
        published_at: null,
      })
      .select("id")
      .single();
    if (error || !created) return { ok: false, message: error?.message ?? "Could not create a version." };
    targetId = created.id;
  }

  // Fields are keyed by field_key in the answers jsonb, so replacing the rows
  // wholesale is safe and keeps ordering honest.
  const { error: deleteError } = await supabase.from("form_fields").delete().eq("form_id", targetId);
  if (deleteError) return { ok: false, message: deleteError.message };

  if (input.fields.length) {
    const rows = input.fields.map((f, index) => ({
      camp_id: campId,
      form_id: targetId,
      field_key: f.field_key.trim(),
      // A text block (section_heading with only help text) may have no title.
      label: f.field_type === "section_heading" ? f.label.trim() : f.label.trim() || f.field_key.trim(),
      help_text: f.help_text || null,
      field_type: f.field_type,
      required: f.field_type === "section_heading" ? false : f.required,
      options: f.options ?? [],
      visible_when: serializeVisibleWhen(f.visible_when ?? null),
      section: f.section?.trim() || null,
      repeat_count_field: f.repeat_count_field?.trim() || null,
      display_order: index,
    }));
    const { error: insertError } = await supabase.from("form_fields").insert(rows);
    if (insertError) return { ok: false, message: insertError.message };
  }

  if (input.publish) {
    if (live && live.id !== targetId) {
      const { error } = await supabase
        .from("form_definitions")
        .update({ published_at: null })
        .eq("id", live.id);
      if (error) return { ok: false, message: error.message };
    }
    const { error } = await supabase
      .from("form_definitions")
      .update({ published_at: new Date().toISOString() })
      .eq("id", targetId);
    if (error) return { ok: false, message: error.message };
  }

  revalidatePath("/admin/forms");
  revalidatePath(`/admin/forms/${input.periodId}`);
  return {
    ok: true,
    message: input.publish ? "Published. Families now see this version." : "Draft saved.",
  };
}

/** Pulls a live form down without deleting it, so intake stops immediately. */
export async function unpublishForm(periodId: string, formId: string): Promise<ActionResult> {
  await requireArea("admin", "/admin/forms");
  const supabase = await createClient();
  const { error } = await supabase
    .from("form_definitions")
    .update({ published_at: null })
    .eq("id", formId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/forms");
  revalidatePath(`/admin/forms/${periodId}`);
  return { ok: true, message: "Form unpublished." };
}

// Director controls -------------------------------------------------------------

/**
 * The registration switch and private invites are the director's alone. The
 * role is checked here and again by RLS (camps_director_update and
 * registration_invites_director_all), so a registrar cannot reach either.
 */
async function requireDirector(): Promise<{ campId: string } | { error: { ok: false; message: string } }> {
  const membership = await requireArea("admin", "/admin/forms");
  if (membership.role !== "director") {
    return { error: { ok: false, message: "Only a camp director can change this." } };
  }
  return { campId: membership.campId };
}

/** Turns public registration on or off for the whole camp. */
export async function setRegistrationOpen(open: boolean): Promise<ActionResult> {
  const guard = await requireDirector();
  if ("error" in guard) return guard.error;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("camps")
    .update({ registration_open: open })
    .eq("id", guard.campId)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, message: error.message };
  if (!data) return { ok: false, message: "Nothing was changed. Your account cannot change this camp." };
  revalidatePath("/admin/forms");
  return {
    ok: true,
    message: open
      ? "Registration is on. Forms follow their own dates and visibility again."
      : "Registration is off. Only people with a private invite link can register.",
  };
}

export type InviteResult = { ok: true; message: string; path: string } | { ok: false; message: string };

/**
 * Makes a private link to one form. The token is returned once, here; only its
 * hash is stored, so a lost link is revoked and replaced rather than recovered.
 */
export async function createRegistrationInvite(input: { periodId: string; label: string }): Promise<InviteResult> {
  const guard = await requireDirector();
  if ("error" in guard) return guard.error;
  const label = input.label.trim().slice(0, 200) || null;
  const supabase = await createClient();

  const [{ data: period }, { data: camp }, { data: auth }] = await Promise.all([
    supabase.from("registration_periods").select("id, audience").eq("id", input.periodId).eq("camp_id", guard.campId).maybeSingle(),
    supabase.from("camps").select("slug").eq("id", guard.campId).maybeSingle(),
    supabase.auth.getUser(),
  ]);
  if (!period || !camp) return { ok: false, message: "Pick one of your camp's forms." };

  const token = newInviteToken();
  const { error } = await supabase.from("registration_invites").insert({
    camp_id: guard.campId,
    period_id: period.id,
    label,
    token_sha256: hashInviteToken(token),
    created_by: auth.user?.id ?? null,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/forms");
  return {
    ok: true,
    message: label ? `Private link for ${label} created. Copy it now; it is shown only once.` : "Private link created. Copy it now; it is shown only once.",
    path: invitePath(period.audience, camp.slug, token),
  };
}

/** Stops a private link working. The row stays, so the history is kept. */
export async function revokeRegistrationInvite(inviteId: string): Promise<ActionResult> {
  const guard = await requireDirector();
  if ("error" in guard) return guard.error;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("registration_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", inviteId)
    .eq("camp_id", guard.campId)
    .is("revoked_at", null)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, message: error.message };
  if (!data) return { ok: false, message: "That link was already revoked." };
  revalidatePath("/admin/forms");
  return { ok: true, message: "Link revoked. It no longer opens the form." };
}
