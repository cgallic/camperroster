/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";
import { requireDocumentAccess, badRequest } from "../_guard";
import { prepareInsuranceCard, validateGenericUpload } from "@/lib/insurance";
import { uploadDocumentFile, type DocumentRecord } from "@/lib/documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The document type code that triggers the two-sided insurance card rule. */
const INSURANCE_CODE_PATTERN = /insurance/i;

async function bytesOf(value: FormDataEntryValue | null) {
  if (!value || typeof value === "string") return null;
  return {
    bytes: Buffer.from(await value.arrayBuffer()),
    declaredType: value.type || null,
    filename: value.name || null,
  };
}

/**
 * multipart/form-data:
 *   recordId   - the document_records row being filled
 *   file       - a single document (any type except insurance)
 *   front,back - the two sides of an insurance card
 *   issuedOn   - optional YYYY-MM-DD; the DB trigger derives expires_on from it
 */
export async function POST(req: Request) {
  const guard = await requireDocumentAccess();
  if (!guard.ok) return guard.response;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return badRequest("Expected a multipart/form-data upload");
  }

  const recordId = String(form.get("recordId") ?? "");
  if (!recordId) return badRequest("recordId is required");

  const issuedOnRaw = form.get("issuedOn");
  const issuedOn = typeof issuedOnRaw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(issuedOnRaw) ? issuedOnRaw : null;

  const { data: record, error } = await guard.supabase
    .from("document_records")
    .select("*, document_types(code, name, requires_upload)")
    .eq("id", recordId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!record) return NextResponse.json({ error: "No such document record" }, { status: 404 });

  const type = (record as any).document_types as { code: string; name: string; requires_upload: boolean } | null;
  if (type && !type.requires_upload) {
    return badRequest(`"${type.name}" is not an upload — it is signed, not scanned.`);
  }

  const isInsurance = !!type && INSURANCE_CODE_PATTERN.test(type.code);

  let bytes: Buffer;
  let contentType: string;
  let notes: string[] = [];

  if (isInsurance) {
    const [front, back, pdf] = await Promise.all([
      bytesOf(form.get("front")),
      bytesOf(form.get("back")),
      bytesOf(form.get("file")),
    ]);
    // A single file sent to the insurance slot is only acceptable if it is a PDF
    // the family already assembled; two loose images must be front AND back.
    const prepared = prepareInsuranceCard({ front, back, pdf });
    if (!prepared.ok) {
      // Rejected, not quietly stored. The family gets every problem at once.
      return NextResponse.json(
        { error: "The insurance card upload was rejected", reasons: prepared.errors },
        { status: 422 },
      );
    }
    bytes = prepared.bytes;
    contentType = prepared.contentType;
    notes = prepared.notes;
  } else {
    const file = await bytesOf(form.get("file"));
    if (!file) return badRequest("No file was attached");
    const checked = validateGenericUpload(file.bytes, file.declaredType);
    if (!checked.ok) {
      return NextResponse.json({ error: "That file was rejected", reasons: checked.errors }, { status: 422 });
    }
    bytes = file.bytes;
    contentType = checked.contentType;
  }

  const saved = await uploadDocumentFile(guard.supabase, {
    record: record as DocumentRecord,
    bytes,
    contentType,
    issuedOn,
  });
  if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: 400 });

  // Never echo the object path's signed form or the bytes; just the outcome.
  return NextResponse.json({
    ok: true,
    recordId: saved.record.id,
    status: saved.record.status,
    expiresOn: saved.record.expires_on,
    contentType,
    notes,
  });
}
