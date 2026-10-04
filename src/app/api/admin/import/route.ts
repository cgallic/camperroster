import { NextResponse } from "next/server";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isSetupIncompleteError, resolveCampWithRolesOrRespond, setupIncompleteResponse } from "@/lib/auth";
import { CHUNK_SIZE, NormalizedRowSchema, camperKey, type NormalizedRow } from "@/lib/roster-import";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 500 rows of roster data is well under this; anything larger is not a roster chunk. */
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const PAGE = 1000;

const BodySchema = z.object({
  mode: z.enum(["dry_run", "commit"]),
  sessionId: z.uuid().optional(),
  idempotencyKey: z.string().min(8).max(200).regex(/^[A-Za-z0-9:_-]+$/),
  sourceName: z.string().min(1).max(200),
  rows: z.array(NormalizedRowSchema).min(1).max(CHUNK_SIZE),
});

type Action = "create" | "update" | "skip" | "error";

function bad(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

/**
 * The camp's sessions, for the importer's "register into" picker.
 */
export async function GET() {
  const resolved = await resolveCampWithRolesOrRespond(["registrar"]);
  if (resolved.response) return resolved.response;
  const { camp } = resolved;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("camp_sessions")
    .select("id, name, start_date, end_date, is_active")
    .eq("camp_id", camp.campId)
    .order("start_date", { ascending: true });
  if (error) {
    if (isSetupIncompleteError(error)) return setupIncompleteResponse(error);
    return bad(error.message, 500);
  }
  return NextResponse.json({
    success: true,
    camp: { campId: camp.campId, campName: camp.campName },
    role: camp.role,
    sessions: data ?? [],
  });
}

/**
 * Roster import, one chunk of at most 500 already-normalised rows per call.
 *
 * dry_run reads the camp's guardians and campers through the caller's own
 * RLS-bound client and labels each row; it writes nothing. commit calls
 * import_roster_rows() with the caller's JWT so the audit log records the
 * real person. The camp always comes from the session, never from the body.
 */
export async function POST(req: Request) {
  const resolved = await resolveCampWithRolesOrRespond(["registrar"]);
  if (resolved.response) return resolved.response;
  const { camp } = resolved;

  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY_BYTES) return bad("Import chunk is too large.", 413);
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return bad("Import chunk is too large.", 413);

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return bad("Body must be JSON.");
  }
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return bad(`Invalid import request: ${issue?.path.join(".") || "body"} ${issue?.message ?? ""}`.trim());
  }
  const { mode, sessionId, idempotencyKey, sourceName, rows } = parsed.data;

  try {
    const supabase = await createServerSupabaseClient();

    if (sessionId) {
      const { data: session, error } = await supabase
        .from("camp_sessions")
        .select("id")
        .eq("id", sessionId)
        .eq("camp_id", camp.campId)
        .maybeSingle();
      if (error) throw error;
      if (!session) return bad("That session does not belong to your camp.");
    }

    if (mode === "dry_run") {
      return NextResponse.json({
        success: true,
        mode,
        ...(await dryRun(supabase, camp.campId, camp.role, sessionId ?? null, rows)),
      });
    }

    const { data, error } = await (supabase as any).rpc("import_roster_rows", {
      p_camp_id: camp.campId,
      p_session_id: sessionId ?? null,
      p_idempotency_key: idempotencyKey,
      p_source: sourceName,
      p_rows: rows,
    });
    if (error) {
      if (isSetupIncompleteError(error)) return setupIncompleteResponse(error);
      if (error.code === "42501") return bad("Your role cannot import a roster.", 403);
      if (error.code === "40001") return bad("This chunk is already being imported. Try again in a moment.", 409);
      if (error.code === "23503" || error.code === "22023") return bad(error.message);
      throw error;
    }
    return NextResponse.json({ success: true, mode, result: data });
  } catch (err: any) {
    if (isSetupIncompleteError(err)) return setupIncompleteResponse(err);
    return bad(err?.message ?? "Import failed.", 500);
  }
}

async function readAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>) {
  const out: T[] = [];
  for (let from = 0; from < 100_000; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

const blank = (v: unknown) => v === null || v === undefined || String(v).trim() === "";

/** Mirrors the decisions import_roster_rows makes, without writing. */
async function dryRun(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  campId: string,
  role: string,
  sessionId: string | null,
  rows: NormalizedRow[],
) {
  const db = supabase as any;
  const canWriteHealth = role === "director" || role === "nurse";

  const guardians = await readAll<any>((from, to) =>
    db
      .from("guardians")
      .select("id, email, phone, address_line1, city, state, zip, created_at")
      .eq("camp_id", campId)
      .order("created_at", { ascending: true })
      .range(from, to),
  );
  const campers = await readAll<any>((from, to) =>
    db
      .from("campers")
      .select("id, legal_first_name, legal_last_name, birth_date, preferred_name, created_at")
      .eq("camp_id", campId)
      .order("created_at", { ascending: true })
      .range(from, to),
  );

  const guardianByEmail = new Map<string, any>();
  for (const g of guardians) {
    const key = String(g.email ?? "").trim().toLowerCase();
    if (key && !guardianByEmail.has(key)) guardianByEmail.set(key, g);
  }
  const camperByKey = new Map<string, any>();
  for (const c of campers) {
    const key = camperKey({
      camper_first_name: String(c.legal_first_name ?? ""),
      camper_last_name: String(c.legal_last_name ?? ""),
      camper_birth_date: String(c.birth_date ?? ""),
    });
    if (!camperByKey.has(key)) camperByKey.set(key, c);
  }

  const matchedIds = rows.map((r) => camperByKey.get(camperKey(r))?.id).filter(Boolean) as string[];
  const health = new Map<string, any>();
  const registered = new Set<string>();
  if (matchedIds.length > 0) {
    if (canWriteHealth) {
      const { data, error } = await db
        .from("health_profiles")
        .select("camper_id, allergy_details, medication_details, dietary_restrictions, has_epipen")
        .in("camper_id", matchedIds);
      if (error) throw error;
      for (const h of data ?? []) health.set(h.camper_id, h);
    }
    if (sessionId) {
      const { data, error } = await db
        .from("registrations")
        .select("camper_id")
        .eq("session_id", sessionId)
        .in("camper_id", matchedIds);
      if (error) throw error;
      for (const r of data ?? []) registered.add(r.camper_id);
    }
  }

  const newEmails = new Set<string>();
  let registrations = 0;
  const counts: Record<Action, number> = { create: 0, update: 0, skip: 0, error: 0 };
  const results = rows.map((row) => {
    const notes: string[] = [];
    let action: Action = "skip";

    const guardian = guardianByEmail.get(row.guardian_email);
    if (!guardian) {
      newEmails.add(row.guardian_email);
      // A sibling later in this chunk matches the guardian this row creates.
      guardianByEmail.set(row.guardian_email, {
        phone: row.guardian_phone,
        address_line1: row.guardian_address_line1,
        city: row.guardian_city,
        state: row.guardian_state,
        zip: row.guardian_zip,
      });
      action = "update";
      notes.push("New guardian");
    } else {
      const fills =
        (blank(guardian.phone) && !blank(row.guardian_phone)) ||
        (blank(guardian.address_line1) && !blank(row.guardian_address_line1)) ||
        (blank(guardian.city) && !blank(row.guardian_city)) ||
        (blank(guardian.state) && !blank(row.guardian_state)) ||
        (blank(guardian.zip) && !blank(row.guardian_zip));
      if (fills) {
        action = "update";
        notes.push("Fills blank guardian contact details");
      }
    }

    const camper = camperByKey.get(camperKey(row));
    if (!camper) {
      action = "create";
    } else {
      if (blank(camper.preferred_name) && !blank(row.camper_preferred_name)) {
        action = "update";
        notes.push("Adds preferred name");
      }
    }

    const hasHealth = !!(row.allergies || row.medications || row.dietary_notes || row.has_epipen);
    if (hasHealth) {
      if (!canWriteHealth) notes.push("Health details skipped: a registrar cannot write health records");
      else if (camper) {
        const h = health.get(camper.id);
        const fills =
          !h ||
          (blank(h.allergy_details) && !!row.allergies) ||
          (blank(h.medication_details) && !!row.medications) ||
          (blank(h.dietary_restrictions) && !!row.dietary_notes) ||
          (!h.has_epipen && row.has_epipen === true);
        if (fills) {
          if (action === "skip") action = "update";
          notes.push("Fills blank health details");
        }
      }
    }

    if (sessionId && !(camper && registered.has(camper.id))) {
      registrations += 1;
      if (action === "skip") action = "update";
      notes.push("Registers for the session");
    }

    counts[action] += 1;
    return { source_row: row.source_row, action, notes };
  });

  return { counts, newGuardians: newEmails.size, registrations, rows: results };
}
