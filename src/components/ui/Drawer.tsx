"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The detail pane. Full width on a phone, a right-hand sheet from `sm` up.
 * Rendering is controlled by the caller — this component owns no state.
 */
export default function Drawer({
  open,
  onClose,
  title,
  subtitle,
  footer,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        className={cn("relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl", className)}
      >
        <div className="flex items-start justify-between gap-3 border-b border-stone-100 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-extrabold text-stone-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-stone-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="border-t border-stone-100 px-5 py-4 sm:px-6">{footer}</div>}
      </aside>
    </div>
  );
}
