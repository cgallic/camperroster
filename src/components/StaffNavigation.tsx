"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import type { StaffNavigationItem } from "@/lib/staff-navigation";

function isCurrent(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

type Entry = { kind: "link"; item: StaffNavigationItem } | { kind: "group"; name: string; items: StaffNavigationItem[] };

/** Consecutive items sharing a group become one menu; a group with one visible page is just a link. */
function toEntries(items: StaffNavigationItem[]): Entry[] {
  const entries: Entry[] = [];
  for (const item of items) {
    const last = entries[entries.length - 1];
    if (item.group && last?.kind === "group" && last.name === item.group) last.items.push(item);
    else if (item.group) entries.push({ kind: "group", name: item.group, items: [item] });
    else entries.push({ kind: "link", item });
  }
  return entries.map((entry) => (entry.kind === "group" && entry.items.length === 1 ? { kind: "link", item: entry.items[0] } : entry));
}

const base = "rounded-lg px-2.5 py-1.5 text-[11px] font-bold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun-400 ";
const active = "bg-forest-900 text-white shadow-sm";
const idle = "text-stone-600 hover:bg-forest-50 hover:text-forest-900";

function NavLink({ item, current }: { item: StaffNavigationItem; current: boolean }) {
  return (
    <Link href={item.href} aria-current={current ? "page" : undefined} title={item.description} className={base + (current ? active : idle)}>
      <span className="sm:hidden">{item.shortLabel ?? item.label}</span>
      <span className="hidden sm:inline">{item.label}</span>
    </Link>
  );
}

export default function StaffNavigation({ items }: { items: StaffNavigationItem[] }) {
  const pathname = usePathname();
  const entries = toEntries(items);
  const currentGroup = entries.find((entry) => entry.kind === "group" && entry.items.some((item) => isCurrent(pathname, item.href)));
  const [openGroup, setOpenGroup] = useState<string | null>(currentGroup?.kind === "group" ? currentGroup.name : null);
  const open = entries.find((entry): entry is Extract<Entry, { kind: "group" }> => entry.kind === "group" && entry.name === openGroup);

  return (
    <nav aria-label="Staff workspace" className="min-w-0 flex-1">
      <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max items-center gap-1 py-1">
          {entries.map((entry) => {
            if (entry.kind === "link") return <NavLink key={entry.item.href} item={entry.item} current={isCurrent(pathname, entry.item.href)} />;
            const containsCurrent = entry.items.some((item) => isCurrent(pathname, item.href));
            const expanded = openGroup === entry.name;
            return (
              <button
                key={entry.name}
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpenGroup(expanded ? null : entry.name)}
                className={base + "inline-flex items-center gap-1 " + (containsCurrent ? active : expanded ? "bg-forest-50 text-forest-900" : idle)}
              >
                {entry.name}
                <ChevronDown className={"h-3 w-3 transition-transform " + (expanded ? "rotate-180" : "")} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </div>
      {open && (
        <div className="overflow-x-auto border-t border-stone-100 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max items-center gap-1 py-1">
            {open.items.map((item) => <NavLink key={item.href} item={item} current={isCurrent(pathname, item.href)} />)}
          </div>
        </div>
      )}
    </nav>
  );
}
