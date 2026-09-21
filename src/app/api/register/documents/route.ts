import { NextResponse } from "next/server";
import { verifyIntakeToken } from "@/lib/signed-payload";
import { createAdminClient } from "@/lib/supabase/server";
import { uploadDocumentFile, type DocumentRecord } from "@/lib/documents";
import { prepareInsuranceCard, validateGenericUpload } from "@/lib/insurance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function fileBytes(value: FormDataEntryValue | null) {
  if (!value || typeof value === "string") return null;
  return { bytes: Buffer.from(await value.arrayBuffer()), declaredType: value.type || null, filename: value.name || null };
}

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1] ?? "";
  const claims = verifyIntakeToken(token);
  if (!claims) return NextResponse.json({ error: "This upload link is invalid or expired." }, { status: 401 });
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Expected a document upload." }, { status: 400 });
  const kind = form.get("kind");
  if (kind !== "immunization" && kind !== "insurance") return NextResponse.json({ error: "Unknown document type." }, { status: 400 });

  const db = createAdminClient();
  const { data: registration } = await db.from("registrations").select("id").eq("id", claims.registrationId).eq("camp_id", claims.campId).eq("camper_id", claims.camperId).maybeSingle();
  // The signed claims are necessary but the current row is still read back so
  // a deleted or moved registration cannot keep writing documents.
  if (!registration) return NextResponse.json({ error: "The registration could not be verified." }, { status: 403 });

  const code = kind === "insurance" ? "camper_insurance" : "camper_medical";
  const { data: documentType } = await db.from("document_types").select("id").eq("camp_id", claims.campId).eq("code", code).maybeSingle();
  if (!documentType) return NextResponse.json({ error: `The camp has not configured its ${kind} document type.` }, { status: 409 });
  const { data: season } = await db.from("seasons").select("id").eq("camp_id", claims.campId).eq("is_active", true).limit(1).maybeSingle();
  let { data: record } = await db.from("document_records").select("*").eq("camp_id", claims.campId).eq("camper_id", claims.camperId).eq("document_type_id", documentType.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!record) {
    const created = await db.from("document_records").insert({ camp_id: claims.campId, season_id: season?.id ?? null, document_type_id: documentType.id, camper_id: claims.camperId, staff_application_id: null, status: "missing" }).select("*").single();
    if (created.error || !created.data) return NextResponse.json({ error: created.error?.message ?? "Could not prepare the document record." }, { status: 500 });
    record = created.data;
  }

  let bytes: Buffer;
  let contentType: string;
  if (kind === "insurance") {
    const prepared = prepareInsuranceCard({ front: await fileBytes(form.get("front")), back: await fileBytes(form.get("back")), pdf: await fileBytes(form.get("file")) });
    if (!prepared.ok) return NextResponse.json({ error: "The insurance card upload was rejected.", reasons: prepared.errors }, { status: 422 });
    bytes = prepared.bytes; contentType = prepared.contentType;
  } else {
    const file = await fileBytes(form.get("file"));
    if (!file) return NextResponse.json({ error: "No immunization file was attached." }, { status: 400 });
    const checked = validateGenericUpload(file.bytes, file.declaredType);
    if (!checked.ok) return NextResponse.json({ error: "The immunization upload was rejected.", reasons: checked.errors }, { status: 422 });
    bytes = file.bytes; contentType = checked.contentType;
  }
  const saved = await uploadDocumentFile(db, { record: record as DocumentRecord, bytes, contentType });
  if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: 500 });
  return NextResponse.json({ ok: true, recordId: saved.record.id, status: saved.record.status });
}
