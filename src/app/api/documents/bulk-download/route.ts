/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";
import { requireDocumentAccess, badRequest } from "../_guard";
import { downloadDocument } from "@/lib/documents";
import { buildZip, safeEntryName, type ZipEntry } from "@/lib/zip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Which document types belong in the nursing binder. There is no "is_medical"
 * column on document_types, so the nurse's set is matched on the type code.
 * This covers the seeded codes camper_medical, camper_medication,
 * camper_insurance, camper_emergency, teen_medical, adult_medical and
 * adult_medication. Extend it if the camp adds a code that does not match.
 */
const MEDICAL_CODE_PATTERN = /medic|insurance|emergency|treatment|allerg|health/i;

/** Hard stop so one click cannot pull a whole season's PDFs into memory. */
const MAX_FILES = 250;

function ext(contentType: string | null): string {
  if (contentType === "image/png") return "png";
  if (contentType === "image/jpeg") return "jpg";
  return "pdf";
}

/**
 * GET /api/documents/bulk-download?cabinId=... (or ?groupId=... for a service area)
 *
 * Streams every APPROVED medical document for the people in that cabin or group
 * as a zip, for the nurse's binder. Approved only: an unreviewed or rejected
 * scan has no business in a binder people act on.
 */
export async function GET(req: Request) {
  const guard = await requireDocumentAccess();
  if (!guard.ok) return guard.response;

  const url = new URL(req.url);
  const cabinId = url.searchParams.get("cabinId");
  const groupId = url.searchParams.get("groupId");
  if (!cabinId && !groupId) return badRequest("Pass cabinId or groupId");

  // 1. Who is in the cabin / group.
  const camperIds: string[] = [];
  const staffIds: string[] = [];
  let label = "group";

  if (cabinId) {
    const [{ data: cabin }, { data: assignments, error }] = await Promise.all([
      guard.supabase.from("cabins").select("id, name").eq("id", cabinId).maybeSingle(),
      guard.supabase
        .from("cabin_assignments")
        .select("registration_id, staff_application_id, registrations(camper_id)")
        .eq("cabin_id", cabinId),
    ]);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    label = (cabin as any)?.name ?? "cabin";
    for (const row of (assignments ?? []) as any[]) {
      const camperId = row?.registrations?.camper_id;
      if (camperId) camperIds.push(camperId);
      else if (row.staff_application_id) staffIds.push(row.staff_application_id);
    }
  } else {
    const { data: assignments, error } = await guard.supabase
      .from("volunteer_assignments")
      .select("staff_application_id, service_areas(name)")
      .eq("service_area_id", groupId as string);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    label = ((assignments ?? [])[0] as any)?.service_areas?.name ?? "group";
    for (const row of (assignments ?? []) as any[]) {
      if (row.staff_application_id) staffIds.push(row.staff_application_id);
    }
  }

  if (camperIds.length === 0 && staffIds.length === 0) {
    return NextResponse.json({ error: "Nobody is assigned there yet" }, { status: 404 });
  }

  // 2. Their approved documents. RLS still applies — a role that cannot read
  //    document_records gets nothing back, on top of the guard above.
  const selects: PromiseLike<any>[] = [];
  const recordSelect = "id, camper_id, staff_application_id, file_path, file_content_type, document_types(code, name)";
  if (camperIds.length) {
    selects.push(
      guard.supabase.from("document_records").select(recordSelect).eq("status", "approved").in("camper_id", camperIds),
    );
  }
  if (staffIds.length) {
    selects.push(
      guard.supabase
        .from("document_records")
        .select(recordSelect)
        .eq("status", "approved")
        .in("staff_application_id", staffIds),
    );
  }
  const results = await Promise.all(selects);
  const records = results.flatMap((r) => (r.data ?? []) as any[]);

  const medical = records.filter(
    (r) => r.file_path && MEDICAL_CODE_PATTERN.test(r?.document_types?.code ?? ""),
  );
  if (medical.length === 0) {
    return NextResponse.json({ error: "No approved medical documents for that cabin or group" }, { status: 404 });
  }
  if (medical.length > MAX_FILES) medical.length = MAX_FILES;

  // 3. Names for readable filenames in the binder.
  const [{ data: campers }, { data: staff }] = await Promise.all([
    camperIds.length
      ? guard.supabase.from("campers").select("id, legal_first_name, legal_last_name").in("id", camperIds)
      : Promise.resolve({ data: [] as any[] }),
    staffIds.length
      ? guard.supabase.from("staff_applications").select("id, first_name, last_name").in("id", staffIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);
  const names = new Map<string, string>();
  for (const c of (campers ?? []) as any[]) {
    names.set(c.id, [c.legal_last_name, c.legal_first_name].filter(Boolean).join(", "));
  }
  for (const s of (staff ?? []) as any[]) {
    names.set(s.id, [s.last_name, s.first_name].filter(Boolean).join(", "));
  }

  // 4. Pull the bytes server-side and pack them. Contents are never logged.
  const entries: ZipEntry[] = [];
  const missing: string[] = [];
  const used = new Set<string>();

  for (const record of medical) {
    const bytes = await downloadDocument(record.file_path);
    if (!bytes) {
      missing.push(record.id);
      continue;
    }
    const person = names.get(record.camper_id ?? record.staff_application_id ?? "") ?? "Unknown";
    const typeName = record?.document_types?.name ?? "Document";
    let name = safeEntryName(`${person} - ${typeName}.${ext(record.file_content_type)}`);
    let n = 2;
    while (used.has(name)) {
      name = safeEntryName(`${person} - ${typeName} (${n}).${ext(record.file_content_type)}`);
      n += 1;
    }
    used.add(name);
    entries.push({ name, data: bytes });
  }

  if (entries.length === 0) {
    return NextResponse.json({ error: "None of those documents could be retrieved" }, { status: 502 });
  }

  // A short manifest so the nurse can see what did NOT make it into the binder.
  entries.push({
    name: "MANIFEST.txt",
    data: Buffer.from(
      [
        `Approved medical documents — ${label}`,
        `Generated ${new Date().toISOString()}`,
        `Files: ${entries.length}`,
        missing.length ? `Unretrievable records: ${missing.length}` : "",
        "",
        ...entries.map((e) => e.name),
      ]
        .filter(Boolean)
        .join("\n"),
      "utf8",
    ),
  });

  const zip = buildZip(entries);
  const filename = safeEntryName(`${label}-medical-binder.zip`);

  return new NextResponse(new Uint8Array(zip), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Length": String(zip.length),
      "Content-Disposition": `attachment; filename="${filename}"`,
      // Medical documents must not sit in a shared cache.
      "Cache-Control": "no-store, private",
    },
  });
}
