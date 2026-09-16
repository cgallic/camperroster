import { createHash } from "node:crypto";

/**
 * Fingerprints the exact wording someone agreed to.
 *
 * Only line endings are normalised. Everything else, whitespace included, is
 * part of what was displayed and must hash exactly as shown, so that editing a
 * waiver later cannot quietly change what an earlier signature covered.
 *
 * Lives here rather than beside the route because a Next.js route file may only
 * export the handler names the framework knows about.
 */
export function sha256Hex(text: string): string {
  return createHash("sha256").update(text.replace(/\r\n/g, "\n"), "utf8").digest("hex");
}
