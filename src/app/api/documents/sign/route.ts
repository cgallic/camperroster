/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireDocumentAccess, fromZod, clientIp } from "../_guard";
import { sha256Hex } from "@/lib/signatures";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  recordId: z.string().uuid(),
  registrationId: z.string().uuid().optional(),
  /** The exact wording shown on screen, sent back verbatim. */
  statement: z.string().min(20).max(20000),
  signerName: z.string().min(2).max(120),
  /** Typed-name signing: the signer retypes their name to affirm. */
  typedConfirmation: z.string().min(2).max(120),
});

/**
 * Records a typed-name signature.
 *
 * The signature stores the full statement text AND its SHA-256. If someone
 * later edits the waiver, the stored copy and hash still show what this person
 * actually agreed to — a changed waiver cannot retroactively rewrite consent.
 */
export async function POST(req: Request) {
  const guard = await requireDocumentAccess();
  if (!guard.ok) return guard.response;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fromZod(parsed.error);
  const { recordId, registrationId, statement, signerName, typedConfirmation } = parsed.data;

  if (typedConfirmation.trim().toLowerCase() !== signerName.trim().toLowerCase()) {
    return NextResponse.json(
      { error: "The typed signature must match the signer's name exactly." },
      { status: 400 },
    );
  }

  const { data: record, error: recordError } = await guard.supabase
    .from("document_records")
    .select("id, camp_id, document_types(name, requires_signature)")
    .eq("id", recordId)
    .maybeSingle();
  if (recordError) return NextResponse.json({ error: recordError.message }, { status: 400 });
  if (!record) return NextResponse.json({ error: "No such document record" }, { status: 404 });

  const type = (record as any).document_types as { name: string; requires_signature: boolean } | null;
  if (type && !type.requires_signature) {
    return NextResponse.json({ error: `"${type.name}" is not a signed document.` }, { status: 400 });
  }

  const statementSha256 = sha256Hex(statement);

  const { data: signature, error } = await guard.supabase
    .from("signatures")
    .insert({
      camp_id: (record as any).camp_id,
      document_record_id: recordId,
      registration_id: registrationId ?? null,
      statement,
      statement_sha256: statementSha256,
      signer_name: signerName.trim(),
      signer_user_id: guard.userId,
      signer_ip: clientIp(req),
      signer_user_agent: req.headers.get("user-agent"),
    })
    .select("id, signed_at, statement_sha256")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // A signed waiver needs no scan to review, so it lands as submitted and the
  // registrar clears it in the review queue alongside everything else.
  await guard.supabase
    .from("document_records")
    .update({ status: "submitted", rejection_reason: null })
    .eq("id", recordId);

  return NextResponse.json({
    ok: true,
    signatureId: signature.id,
    signedAt: signature.signed_at,
    statementSha256: signature.statement_sha256,
  });
}
