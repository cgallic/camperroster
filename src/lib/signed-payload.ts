import { createHmac, timingSafeEqual } from "node:crypto";

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left, "utf8");
  const b = Buffer.from(right, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function hmacHex(secret: string, value: string): string {
  return createHmac("sha256", secret).update(value, "utf8").digest("hex");
}

export interface IntakeTokenClaims {
  campId: string;
  registrationId: string;
  camperId: string;
  invoiceId: string;
  exp: number;
}

export function issueIntakeToken(
  claims: Omit<IntakeTokenClaims, "exp">,
  secret = process.env.PUBLIC_INTAKE_TOKEN_SECRET,
  nowSeconds = Math.floor(Date.now() / 1000)
): string | null {
  if (!secret) return null;
  const payload = Buffer.from(JSON.stringify({ ...claims, exp: nowSeconds + 60 * 60 }), "utf8").toString("base64url");
  return `${payload}.${hmacHex(secret, payload)}`;
}

export function verifyIntakeToken(
  token: string,
  secret = process.env.PUBLIC_INTAKE_TOKEN_SECRET,
  nowSeconds = Math.floor(Date.now() / 1000)
): IntakeTokenClaims | null {
  if (!secret) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra || !safeEqual(signature, hmacHex(secret, payload))) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<IntakeTokenClaims>;
    if (
      typeof claims.campId !== "string" ||
      typeof claims.registrationId !== "string" ||
      typeof claims.camperId !== "string" ||
      typeof claims.invoiceId !== "string" ||
      typeof claims.exp !== "number" ||
      claims.exp <= nowSeconds
    ) return null;
    return claims as IntakeTokenClaims;
  } catch {
    return null;
  }
}

/**
 * KaiCalls signs `${timestamp}.${rawBody}` and sends the Unix timestamp plus
 * `sha256=<hex>` signature. A five-minute window prevents captured callbacks
 * from being replayed later.
 */
export function verifyKaiCallsSignature(input: {
  rawBody: string;
  timestamp: string | null;
  signature: string | null;
  secret?: string;
  nowSeconds?: number;
}): boolean {
  const secret = input.secret ?? process.env.KAICALLS_WEBHOOK_SECRET;
  if (!secret || !input.timestamp || !input.signature) return false;
  const timestamp = Number(input.timestamp);
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (!Number.isInteger(timestamp) || Math.abs(now - timestamp) > 300) return false;
  const supplied = input.signature.startsWith("sha256=") ? input.signature.slice(7) : input.signature;
  return safeEqual(supplied, hmacHex(secret, `${input.timestamp}.${input.rawBody}`));
}
