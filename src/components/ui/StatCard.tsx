import { cn } from "@/lib/utils";
import { TONE_STYLES, type StatusTone } from "./status";

/**
 * The number a director walks in wanting. Label on top, the figure large, an
 * optional denominator, and — where a share of a whole is the real story — a
 * thin bar with the percentage under it.
 */
export default function StatCard({
  label,
  value,
  of,
  hint,
  tone,
  progress,
  progressLabel,
  className,
}: {
  label: string;
  value: React.ReactNode;
  /** Rendered as "/ N" beside the value. */
  of?: React.ReactNode;
  hint?: React.ReactNode;
  /** Colours the dot beside the label, and the bar. */
  tone?: StatusTone;
  /** 0–100. Renders the thin bar and the percentage line. */
  progress?: number;
  progressLabel?: string;
  className?: string;
}) {
  const pct = progress === undefined ? null : Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div className={cn("rounded-2xl border border-stone-200 bg-white p-4 sm:p-5", className)}>
      <div className="flex items-center gap-2">
        {tone && <span className={cn("h-2 w-2 shrink-0 rounded-full", TONE_STYLES[tone].dot)} aria-hidden />}
        <span className="text-[11px] font-bold uppercase tracking-wide text-stone-500">{label}</span>
      </div>

      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="font-display text-3xl font-black leading-none text-stone-900">{value}</span>
        {of !== undefined && <span className="font-body text-sm font-semibold text-stone-500">/ {of}</span>}
      </div>

      {pct !== null && (
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
            <div
              className={cn("h-full rounded-full transition-all", TONE_STYLES[tone ?? "complete"].bar)}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-stone-500">
            <span className="font-semibold text-stone-700">{pct}%</span>
            {progressLabel ? ` ${progressLabel}` : ""}
          </p>
        </div>
      )}

      {hint && <p className="mt-2 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}

/** Keeps every stat strip on the same grid. */
export function StatStrip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4", className)}>{children}</div>
  );
}
