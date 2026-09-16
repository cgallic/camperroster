"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onSignOut() {
    setBusy(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      onClick={onSignOut}
      disabled={busy}
      className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
    >
      <LogOut className="w-3.5 h-3.5" />
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
