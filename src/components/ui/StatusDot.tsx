import { cn } from "@/lib/utils";
import { TONE_STYLES, humanizeStatus, toneFor, type StatusTone } from "./status";

/**
 * A coloured dot plus plain text. Quieter than a pill, which matters in a table
 * where every single row carries a status — pills turn the page into confetti.
 */
export default function StatusDot({
  tone,
  status,
  label,
  className,
  muteLabel = false,
}: {
  /** Pass a tone directly, or let `status` be mapped for you. */
  tone?: StatusTone;
  status?: string | null;
  label?: string;
  className?: string;
  /** Keeps the label stone-coloured so only the dot carries meaning. */
  muteLabel?: boolean;
}) {
  const resolved = tone ?? toneFor(status);
  const styles = TONE_STYLES[resolved];
  const text = label ?? (status ? humanizeStatus(status) : resolved);

  return (
    <span className={cn("inline-flex items-center gap-2 whitespace-nowrap", className)}>
      <span className={cn("h-2 w-2 shrink-0 rounded-full", styles.dot)} aria-hidden />
      <span className={cn("text-xs font-semibold capitalize", muteLabel ? "text-stone-700" : styles.text)}>
        {text}
      </span>
    </span>
  );
}
