import { cn } from "@/lib/utils";
import { TONE_STYLES, type StatusTone } from "./status";

/**
 * For the things that are labels rather than statuses — a person's kind, a form
 * version, a role. Statuses use StatusDot.
 */
export default function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide",
        TONE_STYLES[tone].soft,
        className,
      )}
    >
      {children}
    </span>
  );
}
