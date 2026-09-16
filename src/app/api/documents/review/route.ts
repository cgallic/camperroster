import { NextResponse } from "next/server";
import { z } from "zod";
import { requireDocumentAccess, fromZod } from "../_guard";
import { approveDocument, rejectDocument } from "@/lib/documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("approve"),
    recordId: z.string().uuid(),
    /** For multi-year credentials: the date on the certificate. The DB derives expiry. */
    issuedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
  z.object({
    action: z.literal("reject"),
    recordId: z.string().uuid(),
    reason: z.string().min(5).max(500),
  }),
]);

/** Approve or reject a submitted document. Only the roles the RLS policy admits get here. */
export async function POST(req: Request) {
  const guard = await requireDocumentAccess();
  if (!guard.ok) return guard.response;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fromZod(parsed.error);

  const result =
    parsed.data.action === "approve"
      ? await approveDocument(guard.supabase, parsed.data.recordId, guard.userId, parsed.data.issuedOn)
      : await rejectDocument(guard.supabase, parsed.data.recordId, guard.userId, parsed.data.reason);

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({
    ok: true,
    recordId: result.record.id,
    // May read 'expired' rather than 'approved' when the credential already lapsed.
    status: result.record.status,
    expiresOn: result.record.expires_on,
    rejectionReason: result.record.rejection_reason,
  });
}
