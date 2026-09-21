import assert from "node:assert/strict";
import test from "node:test";

import { volunteerIdempotencyStorageKey, volunteerRequest } from "./public-volunteer.ts";

test("volunteer submissions carry the idempotency header required by the API", () => {
  const request = volunteerRequest(
    {
      campSlug: "camp-hope",
      name: "Jordan Lee",
      email: "jordan@example.com",
      phone: "555-0100",
      birthDate: "2000-01-01",
      role: "Kitchen",
      refName: "Robin Lee",
      refPhone: "555-0101",
      refEmail: "robin@example.com",
      refRelationship: "Supervisor",
    },
    "fixed-request-key",
  );

  assert.deepEqual(request.headers, {
    "Content-Type": "application/json",
    "Idempotency-Key": "fixed-request-key",
  });
  assert.equal(volunteerIdempotencyStorageKey("camp-hope"), "camperroster:volunteer:idempotency:camp-hope");
});

