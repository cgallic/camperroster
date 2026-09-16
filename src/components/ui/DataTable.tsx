import { cn } from "@/lib/utils";

export type Column<T> = {
  /** Stable key, also used as the React key for the cell. */
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  /** Numeric columns sit right. */
  align?: "left" | "right";
  /** Marks the identifying column: it becomes the heading of the stacked card. */
  primary?: boolean;
  /** Actions sit at the end of the row and at the foot of the stacked card. */
  action?: boolean;
  /** Hide this column on the table, e.g. a duplicate of the card heading. */
  headerClassName?: string;
  cellClassName?: string;
};

/**
 * One table, used everywhere. Sticky header, light separators, no zebra
 * striping, numbers right-aligned — and below `sm` the whole thing restacks
 * into cards rather than scrolling off the side of a registrar's phone.
 */
export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty = "Nothing here.",
  loading = false,
  loadingRows = 4,
  onRowClick,
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  empty?: React.ReactNode;
  loading?: boolean;
  loadingRows?: number;
  onRowClick?: (row: T) => void;
  className?: string;
}) {
  const wrapper = cn("overflow-hidden rounded-2xl border border-stone-200 bg-white", className);

  if (loading) {
    return (
      <div className={wrapper}>
        <div className="divide-y divide-stone-100" aria-busy="true" aria-live="polite">
          {Array.from({ length: loadingRows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4 sm:px-5">
              <div className="h-3 w-1/3 animate-pulse rounded-full bg-stone-100" />
              <div className="h-3 w-1/5 animate-pulse rounded-full bg-stone-100" />
              <div className="ml-auto h-3 w-16 animate-pulse rounded-full bg-stone-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className={wrapper}>
        <div className="px-5 py-12 text-center text-sm text-stone-500">{empty}</div>
      </div>
    );
  }

  return (
    <div className={wrapper}>
      {/* Phone: one card per row. */}
      <ul className="divide-y divide-stone-100 sm:hidden">
        {rows.map((row, index) => {
          const primary = columns.find((c) => c.primary) ?? columns[0];
          const rest = columns.filter((c) => c !== primary && !c.action);
          const actions = columns.filter((c) => c.action);
          return (
            <li
              key={rowKey(row, index)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn("space-y-2 px-4 py-4", onRowClick && "cursor-pointer active:bg-stone-50")}
            >
              <div className="text-sm font-bold text-stone-900">{primary.cell(row)}</div>
              <dl className="space-y-1">
                {rest.map((c) => (
                  <div key={c.key} className="flex items-start justify-between gap-3">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">{c.header}</dt>
                    <dd className="min-w-0 text-right text-xs text-stone-700">{c.cell(row)}</dd>
                  </div>
                ))}
              </dl>
              {actions.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">{actions.map((c) => c.cell(row))}</div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Tablet and up: a real table. */}
      <div className="hidden sm:block">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-stone-50/95 backdrop-blur-sm">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn(
                    "border-b border-stone-200 px-5 py-2.5 font-mono text-[10px] font-bold uppercase tracking-wide text-stone-500",
                    c.align === "right" || c.action ? "text-right" : "text-left",
                    c.headerClassName,
                  )}
                >
                  {c.action ? <span className="sr-only">{c.header}</span> : c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={rowKey(row, index)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-b border-stone-100 last:border-b-0",
                  onRowClick && "cursor-pointer hover:bg-stone-50/70",
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      "px-5 py-3 align-middle text-stone-700",
                      c.align === "right" || c.action ? "text-right" : "text-left",
                      c.align === "right" && "font-mono tabular-nums",
                      c.cellClassName,
                    )}
                  >
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
