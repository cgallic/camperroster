import assert from "node:assert/strict";
import test from "node:test";
import { safeAuthNext } from "./auth-redirect.ts";

test("staff invitation return paths retain their token through sign-in", () => {
  const path = "/staff/invite?token=synthetic-token_0123456789";
  assert.equal(safeAuthNext(path), path);
  assert.equal(safeAuthNext("/reset-password"), "/reset-password");
  assert.equal(safeAuthNext("/admin/history?q=Camp%20Hope"), "/admin/history?q=Camp%20Hope");
});

test("untrusted callback destinations cannot receive authentication fragments", () => {
  const invalid = [null, "", "https://example.com", "//example.com", "/\\example.com",
    "/\t/example.com", "/\n/example.com", "/\r/example.com", "/\u0000/example.com",
    "/ /example.com", "/safe/..//example.com", "/%2e%2e//example.com"];
  for (const raw of invalid) assert.equal(safeAuthNext(raw), "/admin", JSON.stringify(raw));
});

test("every accepted destination stays local when a browser resolves it", () => {
  const base = "https://camperroster.com";
  const paths = ["/staff/invite?token=synthetic", "/safe/../staff/invite?token=synthetic",
    "/%2f%2fexample.com", "/%5cexample.com", "/admin#section", "/admin?next=https://example.com"];
  for (const path of paths) {
    assert.equal(new URL(safeAuthNext(path) + "#access_token=synthetic", base).origin, base);
  }
});
