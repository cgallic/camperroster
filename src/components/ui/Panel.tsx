import { cn } from "@/lib/utils";

/** The standard white card everything sits in. */
export default function Panel({
  title,
  description,
  actions,
  children,
  bodyClassName,
  className,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  bodyClassName?: string;
  className?: string;
}) {
  return (
    <section className={cn("overflow-hidden rounded-2xl border border-stone-200 bg-white", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="font-display text-base font-extrabold text-stone-900">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-stone-500">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn(children ? "px-5 py-4" : "", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Success / error strip, same shape on every screen. */
export function Notice({ tone, children }: { tone: "ok" | "error"; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 text-sm font-semibold",
        tone === "ok"
          ? "border-forest-100 bg-forest-50 text-forest-800"
          : "border-alert-red-border bg-alert-red-bg text-alert-red",
      )}
    >
      {children}
    </div>
  );
}

/** Consistent page shell: width, gutters, vertical rhythm. */
export function PageShell({
  children,
  width = "wide",
  className,
}: {
  children: React.ReactNode;
  width?: "wide" | "narrow";
  className?: string;
}) {
  return (
    <main className="py-6 sm:py-8 lg:py-12">
      <div
        className={cn(
          "mx-auto space-y-6 px-4 sm:px-6 sm:space-y-8",
          width === "wide" ? "max-w-7xl" : "max-w-5xl",
          className,
        )}
      >
        {children}
      </div>
    </main>
  );
}
