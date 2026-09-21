import test from "node:test";
import assert from "node:assert/strict";
import { hmacHex, issueIntakeToken, verifyIntakeToken, verifyKaiCallsSignature } from "./signed-payload.ts";

test("intake tokens are scoped, expire, and reject tampering", () => {
  const secret = "test-secret-that-is-not-used-in-production";
  const token = issueIntakeToken({
    campId: "camp-a",
    registrationId: "registration-a",
    camperId: "camper-a",
    invoiceId: "invoice-a",
  }, secret, 1_000);
  assert.ok(token);
  assert.equal(verifyIntakeToken(token, secret, 1_001)?.campId, "camp-a");
  assert.equal(verifyIntakeToken(token, secret, 4_601), null);
  assert.equal(verifyIntakeToken(`${token}x`, secret, 1_001), null);
  assert.equal(issueIntakeToken({ campId: "a", registrationId: "b", camperId: "c", invoiceId: "d" }, "", 1), null);
});

test("KaiCalls signatures cover timestamp and raw bytes and expire", () => {
  const rawBody = '{"referenceId":"abc"}';
  const timestamp = "1000";
  const secret = "webhook-test-secret";
  const signature = `sha256=${hmacHex(secret, `${timestamp}.${rawBody}`)}`;
  assert.equal(verifyKaiCallsSignature({ rawBody, timestamp, signature, secret, nowSeconds: 1_299 }), true);
  assert.equal(verifyKaiCallsSignature({ rawBody: `${rawBody} `, timestamp, signature, secret, nowSeconds: 1_299 }), false);
  assert.equal(verifyKaiCallsSignature({ rawBody, timestamp, signature, secret, nowSeconds: 1_301 }), false);
  assert.equal(verifyKaiCallsSignature({ rawBody, timestamp, signature: null, secret, nowSeconds: 1_000 }), false);
});
