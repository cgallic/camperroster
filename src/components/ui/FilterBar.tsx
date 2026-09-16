import { cn } from "@/lib/utils";

/** The strip of chips and dropdowns that sits directly above a table. */
export default function FilterBar({
  children,
  trailing,
  className,
}: {
  children: React.ReactNode;
  /** Bulk actions and "clear all" — pushed to the right on wide screens. */
  trailing?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-3 sm:flex-row sm:flex-wrap sm:items-center",
        className,
      )}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">{children}</div>
      {trailing && <div className="flex flex-wrap items-center gap-2 sm:ml-auto">{trailing}</div>}
    </div>
  );
}

/** A single on/off filter chip. */
export function FilterChip({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
        active
          ? "border-forest-700 bg-forest-800 text-white"
          : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** A labelled group of chips, as used on the exports screen. */
export function FilterGroup({
  label,
  children,
  className,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-stone-500">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

export const selectClass =
  "rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 focus:border-forest-600 focus:outline-none";

export const inputClass =
  "rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-500 focus:border-forest-600 focus:outline-none";
