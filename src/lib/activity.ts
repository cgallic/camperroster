/**
 * Turns raw `audit_log` rows into the director's activity history.
 *
 * `record_audit()` (supabase/migrations/20260916140406_roles_and_audit.sql)
 * stores `changed` in two shapes:
 *
 *   - UPDATE: only the differing columns, each as `{ "from": old, "to": new }`.
 *   - INSERT / DELETE: the whole row as it was added or removed.
 *
 * Everything here is pure so it can be tested without Next or Supabase. Values
 * from medical, insurance, reference and credential data never leave this
 * module: the page only learns that such a field changed, not what it holds.
 */

export const ACTIVITY_PAGE_SIZE = 50;

/** Tables `record_audit()` is attached to, with the words a director uses for them. */
export const ACTIVITY_AREAS: Record<string, string> = {
  campers: "Camper",
  guardians: "Parent or guardian",
  registrations: "Registration",
  cabins: "Cabin",
  camp_members: "Team access",
  staff_invitations: "Staff invitation",
  staff_applications: "Staff application",
  staff_references: "Staff reference",
  health_profiles: "Health profile",
  insurance_policies: "Insurance",
};

/** Whole tables whose values are never shown, only which fields changed. */
const SENSITIVE_TABLES = new Set([
  "health_profiles",
  "insurance_policies",
  "staff_references",
  "emar_logs",
  "medications",
  "medication_orders",
  "medication_administrations",
  "background_checks",
]);
const SENSITIVE_TABLE_PATTERN = /(health|medical|medication|emar|insurance|background|reference)/i;

/** Columns that are redacted wherever they appear. */
const SENSITIVE_FIELD_PATTERN =
  /(token|secret|password|passwd|passcode|hash|sha256|api_?key|private_?key|ssn|social_security|background|medical|medication|diagnos|allerg|insurance|policy_number)/i;

/** Bookkeeping columns that say nothing a director would act on. */
const NOISE_FIELDS = new Set(["id", "camp_id", "organization_id", "created_at", "updated_at"]);

const MAX_VALUE_LENGTH = 60;

export type AuditAction = "INSERT" | "UPDATE" | "DELETE";

export type ChangeLine = {
  field: string;
  label: string;
  /** Present for UPDATE, and for DELETE (the removed value). */
  from?: string;
  /** Present for UPDATE and INSERT. */
  to?: string;
  redacted: boolean;
};

export function areaLabel(tableName: string): string {
  return ACTIVITY_AREAS[tableName] ?? humanizeField(tableName);
}

export function actionLabel(action: string): string {
  if (action === "INSERT") return "Added";
  if (action === "UPDATE") return "Changed";
  if (action === "DELETE") return "Removed";
  return action;
}

export function actorLabel(actorEmail: string | null | undefined): string {
  return actorEmail?.trim() || "System";
}

export function isSensitiveTable(tableName: string): boolean {
  return SENSITIVE_TABLES.has(tableName) || SENSITIVE_TABLE_PATTERN.test(tableName);
}

export function isSensitiveField(tableName: string, field: string): boolean {
  return isSensitiveTable(tableName) || SENSITIVE_FIELD_PATTERN.test(field);
}

/** `background_status` -> "Background status", `cabin_id` -> "Cabin". */
export function humanizeField(field: string): string {
  const words = field.replace(/_(id|uuid)$/i, "").replace(/_cents$/i, "").split("_").filter(Boolean);
  if (words.length === 0) return field;
  const text = words.join(" ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function truncate(text: string, max = MAX_VALUE_LENGTH): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** One short, readable rendering of a JSON value. */
export function formatValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "empty";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    if (/_cents$/i.test(field)) {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value / 100);
    }
    return String(value);
  }
  if (typeof value === "string") return truncate(value.replace(/\s+/g, " ").trim());
  if (Array.isArray(value)) {
    if (value.length === 0) return "empty";
    if (value.every((v) => ["string", "number", "boolean"].includes(typeof v))) return truncate(value.join(", "));
  }
  return truncate(JSON.stringify(value));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFromToPair(value: unknown): value is { from?: unknown; to?: unknown } {
  if (!isPlainObject(value)) return false;
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((k) => k === "from" || k === "to");
}

/**
 * The fields an entry touched, ready to print. Sensitive values are replaced
 * by `redacted: true` with no `from`/`to` at all, so they cannot leak through
 * a careless render.
 */
export function describeChanges(tableName: string, action: string, changed: unknown): ChangeLine[] {
  if (!isPlainObject(changed)) return [];

  const lines: ChangeLine[] = [];
  for (const [field, raw] of Object.entries(changed).sort(([a], [b]) => a.localeCompare(b))) {
    if (NOISE_FIELDS.has(field)) continue;
    const base = { field, label: humanizeField(field) };

    if (action === "UPDATE") {
      // Older or hand-written rows may hold the bare new value; show it as "to".
      const pair = isFromToPair(raw) ? raw : { to: raw };
      if (isSensitiveField(tableName, field)) {
        lines.push({ ...base, redacted: true });
      } else {
        lines.push({
          ...base,
          redacted: false,
          from: formatValue(field, pair.from),
          to: formatValue(field, pair.to),
        });
      }
      continue;
    }

    // INSERT / DELETE carry the whole row; blank columns are not news.
    if (raw === null || raw === undefined || raw === "") continue;
    if (isSensitiveField(tableName, field)) {
      lines.push({ ...base, redacted: true });
    } else if (action === "DELETE") {
      lines.push({ ...base, redacted: false, from: formatValue(field, raw) });
    } else {
      lines.push({ ...base, redacted: false, to: formatValue(field, raw) });
    }
  }
  return lines;
}

// Filters ---------------------------------------------------------------------

export type ActivityFilters = {
  area: string | null;
  person: string;
  from: string | null;
  to: string | null;
  page: number;
};

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Search params in, a filter set the query can trust out. Unknown values are dropped. */
export function parseActivityFilters(params: RawParams): ActivityFilters {
  const area = first(params.area);
  const from = first(params.from);
  const to = first(params.to);
  const page = Number.parseInt(first(params.page), 10);
  return {
    area: Object.prototype.hasOwnProperty.call(ACTIVITY_AREAS, area) ? area : null,
    person: first(params.person).slice(0, 200),
    from: isIsoDate(from) ? from : null,
    to: isIsoDate(to) ? to : null,
    page: Number.isFinite(page) && page >= 1 ? Math.min(page, 10_000) : 1,
  };
}

/** Inclusive calendar days as a half-open timestamp range (UTC days). */
export function dateBounds(filters: Pick<ActivityFilters, "from" | "to">): { gte?: string; lt?: string } {
  const bounds: { gte?: string; lt?: string } = {};
  if (filters.from) bounds.gte = `${filters.from}T00:00:00.000Z`;
  if (filters.to) {
    const next = new Date(`${filters.to}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    bounds.lt = next.toISOString();
  }
  return bounds;
}

/** `person` as a safe ILIKE pattern, or "system" for rows with no signed-in actor. */
export function personMatch(person: string): { kind: "none" } | { kind: "system" } | { kind: "ilike"; pattern: string } {
  const value = person.trim();
  if (!value) return { kind: "none" };
  if (value.toLowerCase() === "system") return { kind: "system" };
  return { kind: "ilike", pattern: `%${value.replace(/[\\%_]/g, (c) => `\\${c}`)}%` };
}

/** The 0-based inclusive row range PostgREST wants for a 1-based page. */
export function pageRange(page: number, size = ACTIVITY_PAGE_SIZE): [number, number] {
  const start = (Math.max(1, page) - 1) * size;
  return [start, start + size - 1];
}

/** Query string for a link that keeps the current filters. */
export function activityHref(filters: ActivityFilters, overrides: Partial<ActivityFilters> = {}): string {
  const next = { ...filters, ...overrides };
  const params = new URLSearchParams();
  if (next.area) params.set("area", next.area);
  if (next.person) params.set("person", next.person);
  if (next.from) params.set("from", next.from);
  if (next.to) params.set("to", next.to);
  if (next.page > 1) params.set("page", String(next.page));
  const query = params.toString();
  return query ? `/admin/activity?${query}` : "/admin/activity";
}
