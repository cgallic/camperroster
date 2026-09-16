import { NextResponse } from "next/server";
import { getCurrentCamp, getCurrentUser, isSetupIncompleteError } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Who am I, and which camp am I acting for?
 *
 * The navbar calls this from the client so that the root layout does not have
 * to read cookies — reading cookies in the root layout would opt every marketing
 * and SEO landing page out of static rendering.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ authenticated: false });
  }

  try {
    const camp = await getCurrentCamp();
    return NextResponse.json({
      authenticated: true,
      email: user.email,
      camp: camp
        ? { campId: camp.campId, campName: camp.campName, slug: camp.slug, role: camp.role }
        : null,
    });
  } catch (err) {
    if (isSetupIncompleteError(err)) {
      // Signed in, but the tenancy tables do not exist yet. Say so instead of
      // rendering a navbar that implies the account has no camp.
      return NextResponse.json(
        { authenticated: true, email: user.email, camp: null, setupIncomplete: true },
        { status: 200 }
      );
    }
    throw err;
  }
}
