import { requireArea } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import StaffHeader from "@/components/StaffHeader";
import { STANDARD_TEMPLATES } from "@/lib/email";
import TemplatesClient, { type TemplateRow } from "./TemplatesClient";

export const dynamic = "force-dynamic";

/** The stored wording for every letter the camp sends. */
export default async function TemplatesPage() {
  await requireArea("admin", "/admin/mail/templates");
  const supabase = await createClient();

  const { data } = await supabase.from("email_templates").select("*").order("name");

  const templates: TemplateRow[] = ((data ?? []) as Record<string, unknown>[]).map((t) => ({
    id: String(t.id),
    code: String(t.code ?? ""),
    name: String(t.name ?? ""),
    subject: String(t.subject ?? ""),
    body: String(t.body ?? ""),
    mergeKeys: Array.isArray(t.merge_keys) ? (t.merge_keys as string[]) : [],
    updatedAt: (t.updated_at as string) ?? null,
  }));

  const have = new Set(templates.map((t) => t.code));

  return (
    <>
      <StaffHeader />
      <TemplatesClient
        templates={templates}
        missingStandard={STANDARD_TEMPLATES.filter((t) => !have.has(t.code)).map((t) => ({
          code: t.code,
          name: t.name,
        }))}
      />
    </>
  );
}
