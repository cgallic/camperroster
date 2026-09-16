"use server";

import { revalidatePath } from "next/cache";
import { requireArea } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { serializeVisibleWhen } from "@/lib/forms";
import type { FieldType, PeriodVisibility, VisibleWhen } from "@/lib/forms";

export type FieldDraft = {
  field_key: string;
  label: string;
  help_text: string | null;
  field_type: FieldType;
  required: boolean;
  options: string[];
  visible_when: VisibleWhen | null;
  section: string | null;
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
  fields: FieldDraft[];
  publish: boolean;
}): Promise<ActionResult> {
  const membership = await requireArea("admin", "/admin/forms");
  const supabase = await createClient();

  const keys = input.fields.map((f) => f.field_key);
  if (keys.some((k) => !k.trim())) return { ok: false, message: "Every question needs a key." };
  if (new Set(keys).size !== keys.length) return { ok: false, message: "Question keys must be unique." };
  if (!input.title.trim()) return { ok: false, message: "The form needs a title." };

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
      .update({ title: input.title.trim(), intro_text: input.introText || null })
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
      label: f.label.trim() || f.field_key.trim(),
      help_text: f.help_text || null,
      field_type: f.field_type,
      required: f.field_type === "section_heading" ? false : f.required,
      options: f.options ?? [],
      visible_when: serializeVisibleWhen(f.visible_when ?? null),
      section: f.section?.trim() || null,
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
