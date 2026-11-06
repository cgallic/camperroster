"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button, Notice, inputClass } from "@/components/ui";
import { createMeeting } from "./actions";

export default function NewMeetingForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("Volunteer mandatory meeting");
  const [heldOn, setHeldOn] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await createMeeting({ name, heldOn });
      if (!result.ok) return setError(result.message);
      setError(null);
      if (result.id) router.push(`/admin/meetings/${result.id}`);
      else router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      {error && <Notice tone="error">{error}</Notice>}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={200}
          required
          aria-label="Meeting name"
          className={`${inputClass} sm:flex-1`}
        />
        <input type="date" value={heldOn} onChange={(e) => setHeldOn(e.target.value)} aria-label="Date" className={inputClass} />
        <Button type="submit" variant="primary" disabled={pending}>
          <Plus className="h-3.5 w-3.5" />
          Add meeting
        </Button>
      </div>
    </form>
  );
}
