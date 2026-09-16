import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { dueMessages, sendMessage, timingSafeEqual } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * The cron target. It posts everything that a human already approved and whose
 * agreed send time has passed — and nothing else. `dueMessages` filters on
 * status 'approved', and `sendMessage` checks the status again on the row it is
 * about to send, so a message cannot slip out on the strength of a stale read.
 *
 * There is no user session behind a cron call, so the shared secret is the
 * whole authentication. It is compared with a digest-based constant-time check
 * rather than `===`, which would leak the secret through response timing.
 */
async function handle(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }

  const header = req.headers.get("authorization") ?? "";
  const presented = header.startsWith("Bearer ")
    ? header.slice(7)
    : req.headers.get("x-cron-secret") ?? "";

  if (!timingSafeEqual(presented, expected)) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

  // No session exists on a scheduled run, so this is one of the jobs the
  // service-role client is for.
  const db = createAdminClient();
  const due = await dueMessages(db);

  const results = [];
  for (const message of due) {
    results.push(await sendMessage(db, message));
  }

  return NextResponse.json({
    considered: due.length,
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).map((r) => ({ id: r.id, reason: r.ok ? null : r.reason })),
  });
}

export async function POST(req: Request) {
  return handle(req);
}

/** Vercel Cron issues a GET, so both verbs are accepted. */
export async function GET(req: Request) {
  return handle(req);
}
