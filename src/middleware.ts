import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isDemoEmail } from "@/lib/demo/constants";

/**
 * Two jobs:
 *   1. Refresh the Supabase session on every matched request. Server Components
 *      cannot write cookies, so the refreshed tokens have to be written here or
 *      the user is silently logged out when the access token expires.
 *   2. Keep anonymous visitors out. Before this file, /admin, /nurse/emar,
 *      /counselor and /canteen/pos all returned 200 to the public internet.
 *
 * Note this only checks that someone is signed in. Which role may see which
 * area is decided per page by requireArea() in lib/auth — middleware runs on
 * every matched request and should not be doing database lookups.
 */
const PROTECTED_PREFIXES = [
  "/admin",
  "/nurse",
  "/counselor",
  "/canteen",
  "/billing",
  // Shows a child's registration status, balance and bunk notes, so it is not
  // public even though the reader is a parent rather than staff.
  "/portal",
];

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
// Signing out is the one write the demo account needs.
const DEMO_ALLOWED_WRITES = new Set(["/api/auth/logout"]);

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(request: NextRequest) {
  // /api is matched only so the demo account's writes can be refused. Reads,
  // and requests with no session (public intake, Stripe webhooks, cron) skip
  // the auth round-trip entirely.
  if (
    request.nextUrl.pathname.startsWith("/api/") &&
    (SAFE_METHODS.has(request.method) || !request.cookies.getAll().some((c) => c.name.startsWith("sb-")))
  ) {
    return NextResponse.next({ request });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const pathname = request.nextUrl.pathname;

  // Fail CLOSED on a protected route when auth is not configured. Failing open
  // would reproduce exactly the hole this file exists to close.
  if (!url || !anonKey) {
    if (isProtected(pathname)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
      loginUrl.searchParams.set("reason", "auth_not_configured");
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // getUser(), not getSession() — it revalidates the token with the auth server,
  // so a forged or expired cookie cannot pass this check.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The shared demo login may look at everything but change nothing. Every
  // mutation in the app is a non-GET request (API routes and server actions), so
  // refusing those here also keeps the demo from sending mail, SMS or payments.
  if (user && isDemoEmail(user.email) && !SAFE_METHODS.has(request.method) && !DEMO_ALLOWED_WRITES.has(pathname)) {
    return NextResponse.json(
      { success: false, error: "demo_read_only", message: "This is the read-only demo. Create your camp to make changes." },
      { status: 403 }
    );
  }

  if (!user && isProtected(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/nurse/:path*",
    "/counselor/:path*",
    "/canteen/:path*",
    "/billing/:path*",
    "/portal/:path*",
    // Not protected, but the session is refreshed here so the navbar and the
    // signup/login redirects see a current token.
    // Only non-GET requests carrying a session do any work here; see the top of middleware().
    "/api/:path*",
    "/login",
    "/signup",
    "/start",
  ],
};
