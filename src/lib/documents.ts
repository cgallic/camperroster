/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Server-side document handling.
 *
 * Everything here is medical-adjacent, so two rules hold throughout:
 *   1. Object bytes live in a PRIVATE storage bucket. There is no public URL
 *      anywhere in this file; reads go through `createDocumentSignedUrl`, which
 *      the caller only reaches after a role check.
 *   2. File contents are never logged.
 */

import { createAdminClient } from "./supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export const DOCUMENTS_BUCKET = "camp-documents";
/** Signed links are for one viewing, not for sharing around. */
export const SIGNED_URL_TTL_SECONDS = 300;

export type DocumentStatus = "missing" | "submitted" | "approved" | "rejected" | "expired";
export type AppliesTo = "camper" | "teen_volunteer" | "adult_volunteer";

export type DocumentType = {
  id: string;
  camp_id: string;
  code: string;
  name: string;
  description: string | null;
  applies_to: AppliesTo;
  is_required: boolean;
  requires_upload: boolean;
  requires_signature: boolean;
  validity_months: number | null;
  display_order: number;
};

export type DocumentRecord = {
  id: string;
  camp_id: string;
  season_id: string | null;
  document_type_id: string;
  camper_id: string | null;
  staff_application_id: string | null;
  status: DocumentStatus;
  file_path: string | null;
  file_content_type: string | null;
  issued_on: string | null;
  expires_on: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  updated_at?: string;
};

/** Exactly one of these is set, mirroring the table's check constraint. */
export type DocumentSubject =
  | { kind: "camper"; camperId: string }
  | { kind: "staff"; staffApplicationId: string };

export function subjectColumns(subject: DocumentSubject) {
  return subject.kind === "camper"
    ? { camper_id: subject.camperId, staff_application_id: null }
    : { camper_id: null, staff_application_id: subject.staffApplicationId };
}

/**
 * Storage operations run with the service key because the bucket has no public
 * policies at all — that is the point. Callers MUST have passed a role check
 * first (see `src/app/api/documents/_guard.ts`); nothing in this module
 * authorizes anyone.
 */
function storage() {
  return createAdminClient().storage.from(DOCUMENTS_BUCKET);
}

function extensionFor(contentType: string): string {
  if (contentType === "application/pdf") return "pdf";
  if (contentType === "image/png") return "png";
  if (contentType === "image/jpeg") return "jpg";
  return "bin";
}

/** Object key: camp / subject / record / timestamped file. Never guessable-by-name alone. */
export function objectPathFor(record: Pick<DocumentRecord, "id" | "camp_id" | "camper_id" | "staff_application_id">, contentType: string): string {
  const subject = record.camper_id ? `campers/${record.camper_id}` : `staff/${record.staff_application_id}`;
  return `${record.camp_id}/${subject}/${record.id}/${Date.now()}.${extensionFor(contentType)}`;
}

/**
 * Stores the bytes and points the record at them. The record moves to
 * 'submitted' — approval is a human decision, made in the review queue.
 */
export async function uploadDocumentFile(
  supabase: SupabaseClient,
  opts: {
    record: DocumentRecord;
    bytes: Buffer;
    contentType: string;
    issuedOn?: string | null;
  },
): Promise<{ ok: true; path: string; record: DocumentRecord } | { ok: false; error: string }> {
  const path = objectPathFor(opts.record, opts.contentType);

  const { error: uploadError } = await storage().upload(path, opts.bytes, {
    contentType: opts.contentType,
    upsert: false,
  });
  if (uploadError) return { ok: false, error: uploadError.message };

  const patch: Record<string, unknown> = {
    file_path: path,
    file_content_type: opts.contentType,
    status: "submitted",
    rejection_reason: null,
    reviewed_by: null,
    reviewed_at: null,
  };
  // The BEFORE trigger turns issued_on into expires_on for multi-year credentials.
  if (opts.issuedOn) patch.issued_on = opts.issuedOn;

  const { data, error } = await supabase
    .from("document_records")
    .update(patch)
    .eq("id", opts.record.id)
    .select("*")
    .single();

  if (error) {
    // Do not leave an orphan object behind if the row would not take the update.
    await storage().remove([path]);
    return { ok: false, error: error.message };
  }
  return { ok: true, path, record: data as DocumentRecord };
}

/** Short-lived, single-file link. The only way a document's bytes ever leave the server. */
export async function createDocumentSignedUrl(
  filePath: string,
  expiresInSeconds: number = SIGNED_URL_TTL_SECONDS,
): Promise<{ ok: true; url: string; expiresIn: number } | { ok: false; error: string }> {
  const { data, error } = await storage().createSignedUrl(filePath, expiresInSeconds);
  if (error || !data?.signedUrl) return { ok: false, error: error?.message ?? "Could not sign that document" };
  return { ok: true, url: data.signedUrl, expiresIn: expiresInSeconds };
}

/** Pulls the raw bytes server-side, for the nurse's bulk zip. Never streamed to a browser directly. */
export async function downloadDocument(filePath: string): Promise<Buffer | null> {
  const { data, error } = await storage().download(filePath);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

export async function approveDocument(
  supabase: SupabaseClient,
  recordId: string,
  reviewerId: string,
  issuedOn?: string | null,
): Promise<{ ok: true; record: DocumentRecord } | { ok: false; error: string }> {
  const patch: Record<string, unknown> = {
    status: "approved",
    reviewed_by: reviewerId,
    reviewed_at: new Date().toISOString(),
    rejection_reason: null,
  };
  if (issuedOn) patch.issued_on = issuedOn;

  const { data, error } = await supabase
    .from("document_records")
    .update(patch)
    .eq("id", recordId)
    .select("*")
    .single();
  if (error) return { ok: false, error: error.message };
  // The trigger may have flipped an already-lapsed credential straight to 'expired'.
  return { ok: true, record: data as DocumentRecord };
}

export async function rejectDocument(
  supabase: SupabaseClient,
  recordId: string,
  reviewerId: string,
  reason: string,
): Promise<{ ok: true; record: DocumentRecord } | { ok: false; error: string }> {
  const { data, error } = await supabase
    .from("document_records")
    .update({
      status: "rejected",
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq("id", recordId)
    .select("*")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, record: data as DocumentRecord };
}

export type OwedDocument = {
  type: DocumentType;
  record: DocumentRecord | null;
  status: DocumentStatus;
  outstanding: boolean;
  expiresOn: string | null;
  /** Set for multi-year credentials that lapse before the date we checked against. */
  expiringSoon: boolean;
};

/**
 * What a person still owes: every document type for their `applies_to`, left
 * joined against whatever they have filed. A type with no record at all reads
 * as 'missing' rather than vanishing from the list — that is the whole point.
 */
export async function outstandingDocuments(
  supabase: SupabaseClient,
  campId: string,
  appliesTo: AppliesTo,
  subject: DocumentSubject,
  opts: { expiringBefore?: string } = {},
): Promise<OwedDocument[]> {
  const [{ data: types }, { data: records }] = await Promise.all([
    supabase
      .from("document_types")
      .select("*")
      .eq("camp_id", campId)
      .eq("applies_to", appliesTo)
      .order("display_order", { ascending: true }),
    subject.kind === "camper"
      ? supabase.from("document_records").select("*").eq("camper_id", subject.camperId)
      : supabase.from("document_records").select("*").eq("staff_application_id", subject.staffApplicationId),
  ]);

  const byType = new Map<string, DocumentRecord>();
  for (const r of (records ?? []) as DocumentRecord[]) {
    const existing = byType.get(r.document_type_id);
    // Keep the most recently touched record per type.
    if (!existing || (r.updated_at ?? "") > (existing.updated_at ?? "")) byType.set(r.document_type_id, r);
  }

  return ((types ?? []) as DocumentType[]).map((type) => {
    const record = byType.get(type.id) ?? null;
    const status: DocumentStatus = record?.status ?? "missing";
    return {
      type,
      record,
      status,
      outstanding: status !== "approved",
      expiresOn: record?.expires_on ?? null,
      expiringSoon: isExpiringSoon(record?.expires_on ?? null, opts.expiringBefore),
    };
  });
}

/**
 * A multi-year credential counts as "expiring soon" when it lapses before the
 * cutoff — normally the first day of camp. Returning volunteers should learn
 * that in March, not at check-in.
 */
export function isExpiringSoon(expiresOn: string | null, cutoffIso?: string): boolean {
  if (!expiresOn) return false;
  const cutoff = cutoffIso ?? defaultExpiryCutoff();
  return expiresOn <= cutoff;
}

/** Ninety days out, used when no season start date is available. */
export function defaultExpiryCutoff(from: Date = new Date()): string {
  const d = new Date(from.getTime());
  d.setDate(d.getDate() + 90);
  return d.toISOString().slice(0, 10);
}

export function statusLabel(status: DocumentStatus): string {
  return {
    missing: "Missing",
    submitted: "Awaiting review",
    approved: "Approved",
    rejected: "Rejected",
    expired: "Expired",
  }[status];
}
