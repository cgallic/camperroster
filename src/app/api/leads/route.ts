import { NextResponse } from "next/server";
import { hasServiceRoleKey, supabaseAdmin } from "@/lib/supabase";
import { isValidEmail } from "@/lib/formContracts";
import { notifyInbound } from "@/lib/notify";

/**
 * POST /api/leads — the marketing site's "Book a walkthrough" form.
 *
 * Saves the lead to public.sales_leads (service role; the table has no anon
 * access) and pings INBOUND_WEBHOOK_URL. If neither the table write nor the
 * webhook is available the route answers 503, so the form can fall back to
 * email instead of telling a buyer we got a message nobody will ever see.
 */

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  // Honeypot: real people never fill a field they cannot see.
  if (str(body.website, 200)) {
    return NextResponse.json({ success: true });
  }

  const name = str(body.name, 200);
  const email = str(body.email, 320);
  if (!name) {
    return NextResponse.json({ success: false, error: "Your name is required." }, { status: 400 });
  }
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ success: false, error: "Please enter a valid email address." }, { status: 400 });
  }

  const lead = {
    name,
    email,
    camp_name: str(body.campName, 200) || null,
    camper_count: str(body.camperCount, 40) || null,
    current_tool: str(body.currentTool, 200) || null,
    message: str(body.message, 4000) || null,
    source_path: str(body.sourcePath, 300) || null,
    utm:
      body.utm && typeof body.utm === "object" && !Array.isArray(body.utm)
        ? Object.fromEntries(
            Object.entries(body.utm as Record<string, unknown>)
              .filter(([k, v]) => /^utm_[a-z]+$/.test(k) && typeof v === "string")
              .map(([k, v]) => [k, (v as string).slice(0, 200)])
          )
        : null,
  };

  let saved = false;
  if (hasServiceRoleKey) {
    const { error } = await supabaseAdmin.from("sales_leads").insert(lead);
    if (error) console.error("sales_leads insert failed:", error.message);
    else saved = true;
  }

  const notified = Boolean(process.env.INBOUND_WEBHOOK_URL);
  await notifyInbound({
    kind: "sales_lead",
    summary: `Walkthrough request: ${name}${lead.camp_name ? ` (${lead.camp_name})` : ""} <${email}>`,
    details: {
      camper_count: lead.camper_count,
      current_tool: lead.current_tool,
      source_path: lead.source_path,
      saved,
    },
  });

  if (!saved && !notified) {
    return NextResponse.json(
      { success: false, error: "We could not save your request. Please email director@camperroster.com." },
      { status: 503 }
    );
  }
  return NextResponse.json({ success: true });
}
