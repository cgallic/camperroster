import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";

  // Only same-origin paths, so a crafted link cannot bounce a fresh session offsite.
  const safeNext = next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/admin";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`);
    return NextResponse.redirect(`${origin}/login?error=invalid_link`);
  }

  // Links Supabase sends on the server's behalf (staff invitations, sign-in
  // links for existing accounts) carry the session in the URL fragment, which
  // never reaches the server. Hand the fragment on to the destination page,
  // which reads it in the browser.
  // Escaped so a crafted `next` cannot close the script tag.
  const js = (value: string) => JSON.stringify(value).replace(/</g, "\\u003c");
  const fallback = "/login?error=invalid_link";
  const html = `<!doctype html><meta charset="utf-8"><title>Signing you in</title><script>
var h = window.location.hash;
window.location.replace(/access_token=/.test(h) ? ${js(safeNext)} + h : ${js(fallback)});
</script>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}
