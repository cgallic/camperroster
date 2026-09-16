import { NextResponse } from "next/server";
import { z } from "zod";
import { requireDocumentAccess, fromZod } from "../_guard";
import { createDocumentSignedUrl, SIGNED_URL_TTL_SECONDS } from "@/lib/documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({ recordId: z.string().uuid() });

/**
 * Mints a short-lived link to one document.
 *
 * The caller never names a storage path — they name a record, and the path is
 * read back through RLS. That way a role that cannot see the row cannot get a
 * URL for it, and nobody can fish for arbitrary objects in the bucket.
 */
export async function POST(req: Request) {
  const guard = await requireDocumentAccess();
  if (!guard.ok) return guard.response;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fromZod(parsed.error);

  const { data: record, error } = await guard.supabase
    .from("document_records")
    .select("id, file_path, file_content_type, status")
    .eq("id", parsed.data.recordId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!record) return NextResponse.json({ error: "No such document record" }, { status: 404 });
  if (!record.file_path) {
    return NextResponse.json({ error: "Nothing has been uploaded for this document yet" }, { status: 404 });
  }

  const signed = await createDocumentSignedUrl(record.file_path, SIGNED_URL_TTL_SECONDS);
  if (!signed.ok) return NextResponse.json({ error: signed.error }, { status: 400 });

  return NextResponse.json({
    url: signed.url,
    expiresIn: signed.expiresIn,
    contentType: record.file_content_type,
  });
}
