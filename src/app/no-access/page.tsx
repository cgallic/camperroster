import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCamp, getCurrentUser, isSetupIncompleteError } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

export const metadata = { title: "No access" };
export const dynamic = "force-dynamic";

export default async function NoAccessPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  let camp;
  try {
    camp = await getCurrentCamp();
  } catch (error) {
    if (isSetupIncompleteError(error)) redirect("/setup-incomplete");
    throw error;
  }

  if (!camp) {
    // Tokens are stored only as hashes. Show the signed-in person's own
    // invitations, then send them to the original email to finish accepting.
    const { data, error } = await (createAdminClient() as any)
      .from("staff_invitations")
      .select("id,camps(name)")
      .eq("email", user.email?.toLowerCase() ?? "")
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString());
    const invitations = (data ?? []) as { id: string; camps: { name: string } | { name: string }[] | null }[];
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Finish joining your camp</h1>
        <p className="mt-2 text-sm text-slate-600">You&apos;re signed in as {user.email}. Your account hasn&apos;t joined a camp yet.</p>
        {error ? <p className="mt-4 text-sm text-slate-600">We couldn&apos;t check your camp invitations right now. Open your original invitation email to finish joining, or try this page again later.</p> : invitations.length > 0 ? <>
          <ul className="mt-4 space-y-2 text-sm font-semibold text-slate-900">
            {invitations.map((invitation) => {
              const invitedCamp = Array.isArray(invitation.camps) ? invitation.camps[0] : invitation.camps;
              return <li key={invitation.id}>Invitation waiting: {invitedCamp?.name || "Your camp"}</li>;
            })}
          </ul>
          <p className="mt-4 text-sm text-slate-600">Open your Camper Roster invitation email and choose Accept invitation to finish joining. Setting a password doesn&apos;t accept the camp invitation.</p>
        </> : <p className="mt-4 text-sm text-slate-600">Ask your camp director to send a fresh invitation to {user.email}, then open its Accept invitation link.</p>}
        <Link href="/" className="mt-6 text-emerald-800 underline">Back to home</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">You don&apos;t have access to this area</h1>
      <p className="mt-2 text-sm text-slate-600">
        Your account is signed in but your role doesn&apos;t include this page. Ask the camp director if you
        think this is wrong.
      </p>
      <Link href="/" className="mt-6 text-emerald-800 underline">
        Back to home
      </Link>
    </main>
  );
}
