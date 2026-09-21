import assert from "node:assert/strict";
import test from "node:test";

import {
  buildNameSearchFilter,
  isUuid,
  parseNameSearch,
} from "../src/lib/name-search.ts";

test("keeps a surname-only search across either name column", () => {
  assert.equal(
    buildNameSearchFilter("Gallic"),
    'first_name.ilike."%Gallic%",last_name.ilike."%Gallic%"',
  );
});

test("matches a full name across first_name and last_name", () => {
  assert.equal(
    buildNameSearchFilter("Theresa Gallic"),
    'first_name.ilike."%Theresa Gallic%",last_name.ilike."%Theresa Gallic%",and(first_name.ilike."%Theresa%",last_name.ilike."%Gallic%"),and(first_name.ilike."%Gallic%",last_name.ilike."%Theresa%")',
  );
});

test("preserves and safely quotes meaningful name punctuation", () => {
  assert.deepEqual(
    parseNameSearch('  Ana   "Annie" (O’Connor)  '),
    { value: 'Ana "Annie" (O’Connor)', invalid: false },
  );
  assert.match(buildNameSearchFilter('Ana "Annie"'), /%Ana \\"Annie\\"%/);
  assert.match(buildNameSearchFilter("D'Arcy"), /%D'Arcy%/);
});

test("rejects punctuation-only searches instead of treating them as unfiltered", () => {
  assert.deepEqual(parseNameSearch('  () "' + "'" + ' “”—  '), {
    value: '() "' + "'" + ' “”—',
    invalid: true,
  });
  assert.deepEqual(parseNameSearch("   \t\n  "), { value: "", invalid: false });
});

test("accepts canonical UUID-shaped ids and rejects malformed ids", () => {
  assert.equal(isUuid("4ec1bcb2-06ee-4d3d-9372-8d926f65f208"), true);
  assert.equal(isUuid("not-a-uuid"), false);
  assert.equal(isUuid("4ec1bcb2-06ee-4d3d-9372"), false);
});
