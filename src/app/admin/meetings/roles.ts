import type { Role } from "@/lib/auth";

/** Who runs meeting sign-in: the people who can already read volunteers and their documents. */
export const MEETING_ROLES: readonly Role[] = ["director", "registrar", "red_shirt"];
