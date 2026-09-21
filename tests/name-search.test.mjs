import assert from "node:assert/strict";
import test from "node:test";

import { buildNameSearchFilter } from "../src/lib/name-search.ts";

test("keeps a surname-only search across either name column", () => {
  assert.equal(
    buildNameSearchFilter("Gallic"),
    "first_name.ilike.%Gallic%,last_name.ilike.%Gallic%",
  );
});

test("matches a full name across first_name and last_name", () => {
  assert.equal(
    buildNameSearchFilter("Theresa Gallic"),
    "first_name.ilike.%Theresa Gallic%,last_name.ilike.%Theresa Gallic%,and(first_name.ilike.%Theresa%,last_name.ilike.%Gallic%),and(first_name.ilike.%Gallic%,last_name.ilike.%Theresa%)",
  );
});
