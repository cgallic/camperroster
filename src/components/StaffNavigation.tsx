"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { StaffNavigationItem } from "@/lib/staff-navigation";

function isCurrent(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function StaffNavigation({ items }: { items: StaffNavigationItem[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Staff workspace" className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex min-w-max items-center gap-1 py-1">
        {items.map((item) => {
          const current = isCurrent(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={current ? "page" : undefined}
              title={item.label}
              className={
                "rounded-lg px-2.5 py-1.5 text-[11px] font-bold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun-400 " +
                (current
                  ? "bg-forest-900 text-white shadow-sm"
                  : "text-stone-600 hover:bg-forest-50 hover:text-forest-900")
              }
            >
              <span className="sm:hidden">{item.shortLabel ?? item.label}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
