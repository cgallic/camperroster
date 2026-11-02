import assert from "node:assert/strict";
import test from "node:test";
import { acceptedInvitationDestination, missingMembershipDestination, passwordResetDestination, safeAuthNext } from "./auth-redirect.ts";

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

test("password reset round-trip returns to the pending camp invitation", () => {
  const invitation = "/staff/invite?token=synthetic-token_0123456789";
  const reset = passwordResetDestination(invitation);
  const callback = new URL("https://camperroster.com/auth/callback");
  callback.searchParams.set("next", reset);
  const resetPage = new URL(safeAuthNext(callback.searchParams.get("next")), callback.origin);
  assert.equal(resetPage.pathname, "/reset-password");
  assert.equal(safeAuthNext(resetPage.searchParams.get("next")), invitation);
});

test("password reset never forwards an external continuation", () => {
  for (const destination of ["https://evil.example", "//evil.example", "/\\evil.example"]) {
    const reset = new URL(passwordResetDestination(destination), "https://camperroster.com");
    assert.equal(reset.searchParams.get("next"), "/admin");
  }
});

test("a signed-in account without membership goes to camp access recovery", () => {
  assert.equal(missingMembershipDestination(true, "/admin"), "/no-access");
  assert.equal(missingMembershipDestination(false, "/admin/history"), "/login?next=%2Fadmin%2Fhistory");
});

test("an accepted invitation opens the right account's workspace without a sign-in loop", () => {
  assert.equal(acceptedInvitationDestination("director@example.com", "DIRECTOR@example.com", "/admin"), "/admin");
  const login = new URL(acceptedInvitationDestination("director@example.com", null, "/admin")!, "https://camperroster.com");
  assert.equal(login.pathname, "/login");
  assert.equal(login.searchParams.get("next"), "/admin");
  assert.equal(acceptedInvitationDestination("director@example.com", "other@example.com", "/admin"), null);
});
