import type { VolunteerPayload } from "./formContracts";

export function volunteerIdempotencyStorageKey(campSlug: string): string {
  return `camperroster:volunteer:idempotency:${campSlug}`;
}

export function volunteerRequest(payload: VolunteerPayload, idempotencyKey: string): RequestInit {
  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  };
}

