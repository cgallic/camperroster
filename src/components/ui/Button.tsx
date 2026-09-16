import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "destructive";
export type ButtonSize = "sm" | "md";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-forest-800 text-white hover:bg-forest-900 border border-transparent shadow-sm",
  secondary: "bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 hover:border-stone-300",
  quiet: "bg-transparent text-stone-600 border border-transparent hover:bg-stone-100 hover:text-stone-900",
  destructive: "bg-alert-red-bg text-alert-red border border-alert-red-border hover:bg-white",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1.5 text-[11px] gap-1",
  md: "px-3.5 py-2 text-xs gap-1.5",
};

export function buttonClass(variant: ButtonVariant = "secondary", size: ButtonSize = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center rounded-lg font-bold transition-colors",
    "disabled:opacity-40 disabled:pointer-events-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600 focus-visible:ring-offset-1",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export default function Button({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button {...props} className={buttonClass(variant, size, className)} />;
}
