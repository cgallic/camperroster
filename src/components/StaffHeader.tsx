import { getMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";
import Link from "next/link";

/**
 * Shared strip on every guarded staff page: who is signed in, what role they
 * hold in this camp, and a way out.
 */
export default async function StaffHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const membership = await getMembership();

  if (!user) return null;

  return (
    <div className="border-b border-stone-200 bg-white/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-stone-600 font-semibold truncate">{user.email}</span>
          {membership && (
            <span className="font-mono text-[10px] font-bold uppercase text-forest-800 bg-forest-50 px-2.5 py-1 rounded-full border border-forest-100 shrink-0">
              {membership.role.replace("_", " ")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {membership?.role === "director" && <Link href="/admin/staff" className="text-xs font-bold text-forest-900 underline">Team</Link>}
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
