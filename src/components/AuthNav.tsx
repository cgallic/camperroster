"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Tent } from "lucide-react";

interface Me {
  authenticated: boolean;
  email?: string | null;
  camp?: { campId: string; campName: string; slug: string; role: string } | null;
  setupIncomplete?: boolean;
}

/**
 * Signed-in camp name + sign-out, fetched client-side.
 *
 * Deliberately a client fetch rather than reading cookies in the root layout:
 * calling cookies() in the layout would make every marketing and SEO landing
 * page dynamically rendered.
 */
export default function AuthNav({ onNavigate }: { onNavigate?: () => void }) {
  const [me, setMe] = useState<Me | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data: Me = await res.json();
        if (!cancelled) setMe(data);
      } catch {
        if (!cancelled) setMe({ authenticated: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setSigningOut(false);
      onNavigate?.();
      setMe({ authenticated: false });
      router.refresh();
      router.push("/login");
    }
  };

  // Nothing resolved yet — render nothing rather than flashing "Sign in".
  if (me === null) return null;

  if (!me.authenticated) {
    return (
      <Link
        href="/login"
        onClick={onNavigate}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-stone-300 text-stone-800 font-extrabold text-xs hover:bg-stone-50 transition-all"
      >
        <span>Log in</span>
      </Link>
    );
  }

  const label = me.setupIncomplete
    ? "Setup incomplete"
    : me.camp?.campName || me.email || "Signed in";

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/admin"
        onClick={onNavigate}
        title={me.camp ? `${me.camp.campName} — ${me.camp.role}` : label}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-forest-50 text-forest-950 border border-forest-200 font-extrabold text-xs max-w-[11rem] truncate"
      >
        <Tent className="w-3.5 h-3.5 shrink-0 text-forest-800" />
        <span className="truncate">{label}</span>
      </Link>
      <button
        onClick={handleSignOut}
        disabled={signingOut}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-stone-300 text-stone-700 font-extrabold text-xs hover:bg-stone-50 transition-all cursor-pointer disabled:opacity-50"
        aria-label="Sign out"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{signingOut ? "Signing out..." : "Sign out"}</span>
      </button>
    </div>
  );
}
