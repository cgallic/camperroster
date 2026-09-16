import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Two jobs:
 *   1. Refresh the Supabase session on every matched request (the @supabase/ssr
 *      pattern — Server Components cannot write cookies, so the refreshed
 *      tokens have to be written here or the user is silently logged out when
 *      the access token expires).
 *   2. Keep anonymous visitors out of the staff surfaces. Before this file,
 *      /admin, /nurse/emar, /counselor and /canteen/pos all returned 200 to the
 *      public internet.
 *
 * /portal is intentionally NOT listed. It is parent-facing and has no parent
 * auth yet; putting it behind director auth would be wrong, not safer.
 */
const PROTECTED_PREFIXES = ["/admin", "/nurse", "/counselor", "/canteen", "/billing"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(request: NextRequest) {
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

  // getUser() (not getSession()) — it revalidates the token with the auth
  // server, so a forged or expired cookie cannot pass this check.
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    // Not protected, but the session is refreshed here so the navbar and the
    // signup/login redirects see a current token.
    "/login",
    "/signup",
    "/start",
  ],
};
