import { getMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { navigationForRole } from "@/lib/staff-navigation";
import SignOutButton from "./SignOutButton";
import StaffNavigation from "./StaffNavigation";

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

  const navigation = membership ? navigationForRole(membership.role) : [];

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 shadow-[0_1px_0_rgba(28,59,47,0.04)] backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between gap-3 border-b border-stone-100 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="font-display text-sm font-black tracking-tight text-forest-950">CamperRoster</span>
            <span className="hidden h-4 w-px bg-stone-200 sm:block" aria-hidden="true" />
            <span className="hidden max-w-64 truncate text-xs font-semibold text-stone-500 sm:block">{user.email}</span>
            {membership && (
              <span className="shrink-0 rounded-full border border-forest-100 bg-forest-50 px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-forest-800">
                {membership.role === "director" ? "super admin" : membership.role.replace("_", " ")}
              </span>
            )}
          </div>
          <SignOutButton />
        </div>
        {navigation.length > 0 && <StaffNavigation items={navigation} />}
      </div>
    </header>
  );
}
