"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createPeriod } from "./actions";

export default function NewPeriodButton({
  seasonId,
  audience,
  label,
}: {
  seasonId: string;
  audience: string;
  label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await createPeriod({ seasonId, audience, name: label });
            if (!result.ok) setError(result.message);
            else router.refresh();
          })
        }
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-forest-800 text-white font-bold text-xs hover:bg-forest-900 disabled:opacity-50"
      >
        <Plus className="w-3.5 h-3.5" />
        {label}
      </button>
      {error && <span className="text-[11px] text-red-700 mt-1">{error}</span>}
    </div>
  );
}
