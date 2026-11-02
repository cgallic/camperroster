/** Keep email callbacks and sign-in return paths on this application's origin. */
export function safeAuthNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/admin";
  // The URL parser removes tabs/newlines and treats backslashes as slashes.
  // Checking the prefix alone therefore permits disguised offsite redirects.
  if (/[\\\u0000-\u0020\u007f]/.test(raw)) return "/admin";
  const base = "https://auth-return.invalid";
  try {
    const destination = new URL(raw, base);
    if (destination.origin !== base) return "/admin";
    // Return the parsed path as well: dot segments can normalize to //host,
    // which becomes an offsite redirect if it is used as a relative URL again.
    const path = destination.pathname + destination.search + destination.hash;
    if (path.startsWith("//")) return "/admin";
    return path;
  } catch {
    return "/admin";
  }
}

/** Preserve the camp invitation while the user chooses a password. */
export function passwordResetDestination(next: string | null): string {
  return `/reset-password?next=${encodeURIComponent(safeAuthNext(next))}`;
}

/** Signing in again cannot repair a signed-in account's missing membership. */
export function missingMembershipDestination(signedIn: boolean, returnTo: string): string {
  return signedIn ? "/no-access" : `/login?next=${encodeURIComponent(safeAuthNext(returnTo))}`;
}

/** An accepted invitation continues to the workspace, never back to itself. */
export function acceptedInvitationDestination(invitedEmail: string, signedInAs: string | null, workspace: string): string | null {
  const next = safeAuthNext(workspace);
  if (!signedInAs) return `/login?next=${encodeURIComponent(next)}`;
  return signedInAs.toLowerCase() === invitedEmail.toLowerCase() ? next : null;
}
