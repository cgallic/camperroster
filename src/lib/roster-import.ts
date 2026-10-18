/**
 * Roster import: the pure half.
 *
 * A director exports families and campers from UltraCamp, CampMinder,
 * CampBrain or a Google Form, and those files disagree about everything:
 * header names, date formats, how a grade is written. Everything that turns
 * such a file into rows the database will accept lives here, with no Supabase
 * and no DOM, so the browser (preview) and the API route (re-validation) run
 * the exact same rules and the tests can run them in plain Node.
 */

import { z } from "zod";

// Limits ------------------------------------------------------------------------

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_ROWS = 5000;
/** Rows per API call. The route rejects anything larger. */
export const CHUNK_SIZE = 500;

// Fields ------------------------------------------------------------------------

export const IMPORT_FIELDS = [
  "camper_first_name",
  "camper_last_name",
  "camper_preferred_name",
  "camper_birth_date",
  "camper_gender",
  "camper_grade",
  "guardian_first_name",
  "guardian_last_name",
  "guardian_email",
  "guardian_phone",
  "guardian_relationship",
  "guardian_address_line1",
  "guardian_address_line2",
  "guardian_city",
  "guardian_state",
  "guardian_zip",
  "allergies",
  "medications",
  "dietary_notes",
  "has_epipen",
] as const;

export type ImportField = (typeof IMPORT_FIELDS)[number];
export type FieldGroup = "Camper" | "Guardian" | "Health";

export type FieldDef = { key: ImportField; label: string; group: FieldGroup; required?: boolean };

export const FIELD_DEFS: FieldDef[] = [
  { key: "camper_first_name", label: "Camper first name", group: "Camper", required: true },
  { key: "camper_last_name", label: "Camper last name", group: "Camper", required: true },
  { key: "camper_preferred_name", label: "Preferred name", group: "Camper" },
  { key: "camper_birth_date", label: "Birth date", group: "Camper", required: true },
  { key: "camper_gender", label: "Gender", group: "Camper" },
  { key: "camper_grade", label: "Grade entering", group: "Camper" },
  { key: "guardian_first_name", label: "Guardian first name", group: "Guardian" },
  { key: "guardian_last_name", label: "Guardian last name", group: "Guardian" },
  { key: "guardian_email", label: "Guardian email", group: "Guardian", required: true },
  { key: "guardian_phone", label: "Guardian phone", group: "Guardian" },
  { key: "guardian_relationship", label: "Relationship", group: "Guardian" },
  { key: "guardian_address_line1", label: "Street address", group: "Guardian" },
  { key: "guardian_address_line2", label: "Address line 2", group: "Guardian" },
  { key: "guardian_city", label: "City", group: "Guardian" },
  { key: "guardian_state", label: "State", group: "Guardian" },
  { key: "guardian_zip", label: "ZIP", group: "Guardian" },
  { key: "allergies", label: "Allergies", group: "Health" },
  { key: "medications", label: "Medications", group: "Health" },
  { key: "dietary_notes", label: "Dietary notes", group: "Health" },
  { key: "has_epipen", label: "Carries an EpiPen (yes/no)", group: "Health" },
];

export const REQUIRED_FIELDS: ImportField[] = FIELD_DEFS.filter((f) => f.required).map((f) => f.key);

/** A mapping assigns each source column (by index) a field, or null to ignore it. */
export type Mapping = (ImportField | null)[];

// CSV ---------------------------------------------------------------------------

/**
 * RFC 4180 parser: quoted fields, doubled quotes, embedded newlines, CRLF or
 * LF, and a leading byte-order mark. With no delimiter given, a first line
 * with more tabs than commas is read as TSV. Fully blank lines are dropped.
 */
export function parseCsv(input: string, delimiter?: string): string[][] {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const delim = delimiter ?? detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  const endRow = () => {
    row.push(field);
    field = "";
    if (row.some((cell) => cell.trim() !== "")) rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }
    if (ch === '"' && field === "") {
      inQuotes = true;
      i += 1;
    } else if (ch === delim) {
      row.push(field);
      field = "";
      i += 1;
    } else if (ch === "\r") {
      endRow();
      i += text[i + 1] === "\n" ? 2 : 1;
    } else if (ch === "\n") {
      endRow();
      i += 1;
    } else {
      field += ch;
      i += 1;
    }
  }
  if (field !== "" || row.length > 0) endRow();
  return rows;
}

function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const tabs = firstLine.split("\t").length - 1;
  const commas = firstLine.split(",").length - 1;
  return tabs > commas ? "\t" : ",";
}

/**
 * Strip leading characters a spreadsheet would treat as a formula, so a value
 * like `=HYPERLINK(...)` cannot ride through the database into a later export.
 */
export function sanitizeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value).trim();
  // An international phone number like "+1 555 0100" is data, not a formula.
  if (/^\+[\d\s().-]+$/.test(text)) return text;
  return text
    .replace(/^[\s=+\-@]+/, "")
    .trim();
}

// Column guessing ---------------------------------------------------------------

function headerKey(header: string): string {
  return header
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Header spellings seen in vendor exports, already passed through headerKey.
 * Earlier fields win when one header could mean two things.
 */
const ALIASES: Record<ImportField, string[]> = {
  camper_first_name: [
    "camper first name", "camper first", "child first name", "student first name", "participant first name",
    "first name", "firstname", "first", "legal first name", "camper given name",
  ],
  camper_last_name: [
    "camper last name", "camper last", "child last name", "student last name", "participant last name",
    "last name", "lastname", "last", "legal last name", "surname", "family name",
  ],
  camper_preferred_name: ["preferred name", "nickname", "nick name", "goes by", "camper preferred name"],
  camper_birth_date: [
    "dob", "birthdate", "birth date", "date of birth", "birthday", "camper dob", "camper birthdate",
    "camper birth date", "camper date of birth", "child dob", "child date of birth",
  ],
  camper_gender: ["gender", "sex", "camper gender", "camper sex", "boy girl"],
  camper_grade: [
    "grade", "grade entering", "rising grade", "grade in fall", "current grade", "camper grade",
    "grade level", "school grade", "grade next year", "grade fall",
  ],
  guardian_first_name: [
    "parent first name", "parent 1 first name", "p1 first name", "guardian first name",
    "guardian 1 first name", "primary parent first name", "primary contact first name", "parent first",
    "contact first name", "mother first name", "father first name",
  ],
  guardian_last_name: [
    "parent last name", "parent 1 last name", "p1 last name", "guardian last name",
    "guardian 1 last name", "primary parent last name", "primary contact last name", "parent last",
    "contact last name", "mother last name", "father last name",
  ],
  guardian_email: [
    "parent email", "parent 1 email", "p1 email", "guardian email", "guardian 1 email", "parent email address",
    "parent 1 email address", "primary email", "primary contact email", "email", "email address",
    "e mail", "contact email", "family email", "mother email", "father email",
  ],
  guardian_phone: [
    "parent phone", "parent 1 phone", "p1 phone", "guardian phone", "guardian 1 phone", "parent cell",
    "parent 1 cell", "parent mobile", "primary phone", "phone", "phone number", "cell", "cell phone",
    "mobile", "mobile phone", "home phone", "contact phone",
  ],
  guardian_relationship: [
    "relationship", "relationship to camper", "parent relationship", "parent 1 relationship",
    "guardian relationship", "relation",
  ],
  guardian_address_line1: [
    "address", "street", "street address", "address 1", "address line 1", "address1", "home address",
    "mailing address", "parent address", "street 1",
  ],
  guardian_address_line2: ["address 2", "address line 2", "address2", "apt", "unit", "street 2", "suite"],
  guardian_city: ["city", "town", "parent city", "home city"],
  guardian_state: ["state", "province", "state province", "st", "parent state", "home state"],
  guardian_zip: ["zip", "zip code", "zipcode", "postal code", "postcode", "parent zip", "home zip"],
  allergies: ["allergies", "allergy", "allergy details", "food allergies", "known allergies", "allergies details"],
  medications: [
    "medications", "medication", "current medications", "meds", "medication details", "prescriptions",
  ],
  dietary_notes: [
    "dietary notes", "dietary restrictions", "diet", "dietary needs", "dietary", "special diet",
    "food restrictions",
  ],
  has_epipen: ["epipen", "epi pen", "has epipen", "carries epipen", "epinephrine"],
};

const ALIAS_LOOKUP: Map<string, ImportField> = (() => {
  const map = new Map<string, ImportField>();
  for (const field of IMPORT_FIELDS) {
    for (const alias of ALIASES[field]) if (!map.has(alias)) map.set(alias, field);
  }
  return map;
})();

/**
 * Best-guess field for each header. Exact alias matches first; then, for
 * headers like "Camper's Date of Birth (MM/DD/YYYY)", a containment match. A
 * field is only ever assigned to one column — the first that claims it.
 */
export function guessMapping(headers: string[]): Mapping {
  const mapping: Mapping = headers.map(() => null);
  const taken = new Set<ImportField>();
  const keys = headers.map(headerKey);

  keys.forEach((key, index) => {
    const field = ALIAS_LOOKUP.get(key);
    if (field && !taken.has(field)) {
      mapping[index] = field;
      taken.add(field);
    }
  });

  keys.forEach((key, index) => {
    if (mapping[index] || !key) return;
    const isParent = /\b(parent|guardian|p1|mother|father|contact)\b/.test(key);
    let best: { field: ImportField; length: number } | null = null;
    for (const [alias, field] of ALIAS_LOOKUP) {
      if (taken.has(field) || alias.length < 4) continue;
      // A "Parent First Name" header must never be read as the camper's name.
      if (isParent && field.startsWith("camper_")) continue;
      if (` ${key} `.includes(` ${alias} `) && (!best || alias.length > best.length)) {
        best = { field, length: alias.length };
      }
    }
    if (best) {
      mapping[index] = best.field;
      taken.add(best.field);
    }
  });

  return mapping;
}

/** Turns positional cells into field-keyed raw strings using a mapping. */
export function applyMapping(rows: string[][], mapping: Mapping): RawRow[] {
  return rows.map((cells) => {
    const raw: RawRow = {};
    mapping.forEach((field, index) => {
      if (!field) return;
      const value = sanitizeCell(cells[index]);
      if (value && !raw[field]) raw[field] = value;
    });
    return raw;
  });
}

export type RawRow = Partial<Record<ImportField, string>>;

// Value normalisers -------------------------------------------------------------

function isoDate(year: number, month: number, day: number): string | null {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (year < 1900 || year > 2200 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Dates as vendors write them: ISO (2014-06-03, optionally with a time),
 * US M/D/YYYY or M-D-YY, and Excel serial day numbers (45123). Two-digit years
 * are read as the most recent matching year not in the future.
 */
export function normalizeDate(value: string, today: Date = new Date()): string | null {
  const v = value.trim();
  if (!v) return null;

  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ].*)?$/.exec(v);
  if (m) return isoDate(Number(m[1]), Number(m[2]), Number(m[3]));

  m = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(v);
  if (m) return isoDate(Number(m[1]), Number(m[2]), Number(m[3]));

  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/.exec(v);
  if (m) {
    let year = Number(m[3]);
    if (m[3].length === 2) {
      const century = Math.floor(today.getUTCFullYear() / 100) * 100;
      year = century + year;
      if (year > today.getUTCFullYear()) year -= 100;
    }
    return isoDate(year, Number(m[1]), Number(m[2]));
  }

  if (/^\d{4,5}(?:\.\d+)?$/.test(v)) {
    const serial = Math.floor(Number(v));
    // Excel's day 1 is 1900-01-01 and it counts a fictional 1900-02-29.
    if (serial < 61 || serial > 100000) return null;
    const ms = Date.UTC(1899, 11, 30) + serial * 86400000;
    const d = new Date(ms);
    return isoDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }

  return null;
}

const ORDINAL_WORDS: Record<string, number> = {
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9,
  tenth: 10, eleventh: 11, twelfth: 12, freshman: 9, sophomore: 10, junior: 11, senior: 12,
};

/** "K", "Kindergarten", "5", "5th", "Rising 5th", "Grade 5", "5th grade" -> 0..12. */
export function normalizeGrade(value: string): number | null {
  const v = value.toLowerCase().replace(/rising|entering|grade|gr\.?|in fall|fall/g, " ").trim();
  if (!v) return null;
  if (/^(k|kg|kinder|kindergarten|kindergartener)$/.test(v)) return 0;
  const n = /^(\d{1,2})(?:st|nd|rd|th)?$/.exec(v);
  if (n) {
    const grade = Number(n[1]);
    return grade >= 0 && grade <= 12 ? grade : null;
  }
  return ORDINAL_WORDS[v] ?? null;
}

/** "M"/"Male"/"Boy" -> male; "F"/"Female"/"Girl" -> female; anything else -> null. */
export function normalizeGender(value: string): "male" | "female" | null {
  const v = value.trim().toLowerCase();
  if (["m", "male", "boy", "b", "man"].includes(v)) return "male";
  if (["f", "female", "girl", "g", "woman"].includes(v)) return "female";
  return null;
}

/** Yes/no in the forms vendors use. Null when it is neither. */
export function normalizeYesNo(value: string): boolean | null {
  const v = value.trim().toLowerCase();
  if (["y", "yes", "true", "1", "x", "checked"].includes(v)) return true;
  if (["n", "no", "false", "0", "none", "unchecked"].includes(v)) return false;
  return null;
}

/** "None", "N/A", "no" in a free-text health column means nothing to record. */
function healthText(value: string | undefined): string | null {
  const v = (value ?? "").trim();
  if (!v) return null;
  if (/^(none|no|n\/?a|nka|nkda|na|nil|-+|no known allergies|not applicable)\.?$/i.test(v)) return null;
  return v.slice(0, 2000);
}

/** Estimated grade entering for a camp season, from birth date (age on Sept 1 minus 5). */
export function estimateGrade(birthDate: string, today: Date = new Date()): number {
  const seasonYear = today.getUTCMonth() >= 8 ? today.getUTCFullYear() + 1 : today.getUTCFullYear();
  const [y, m, d] = birthDate.split("-").map(Number);
  let age = seasonYear - y;
  if (m > 9 || (m === 9 && d > 1)) age -= 1;
  return Math.max(0, Math.min(12, age - 5));
}

// Normalised row ----------------------------------------------------------------

const text = (max: number) => z.string().max(max);

/** What the browser sends and the route re-checks. Every NOT NULL column has a value. */
export const NormalizedRowSchema = z.object({
  source_row: z.number().int().min(1),
  camper_first_name: text(100).min(1),
  camper_last_name: text(100).min(1),
  camper_preferred_name: text(100).nullable(),
  camper_birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  camper_gender: z.enum(["male", "female", ""]),
  camper_grade: z.number().int().min(0).max(12),
  guardian_first_name: text(100),
  guardian_last_name: text(100),
  guardian_email: z.email().max(254),
  guardian_phone: text(40),
  guardian_relationship: text(60).min(1),
  guardian_address_line1: text(200),
  guardian_address_line2: text(200).nullable(),
  guardian_city: text(100),
  guardian_state: text(60),
  guardian_zip: text(20),
  allergies: text(2000).nullable(),
  medications: text(2000).nullable(),
  dietary_notes: text(2000).nullable(),
  has_epipen: z.boolean().nullable(),
});

export type NormalizedRow = z.infer<typeof NormalizedRowSchema>;

export type RowIssue = { row: number; field: ImportField | null; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * One raw row to one database-ready row. Errors mean the row cannot be
 * imported; warnings mean a NOT NULL column got a safe default the director
 * should know about.
 */
export function normalizeRow(
  raw: RawRow,
  sourceRow: number,
  today: Date = new Date(),
): { row: NormalizedRow | null; errors: RowIssue[]; warnings: RowIssue[] } {
  const errors: RowIssue[] = [];
  const warnings: RowIssue[] = [];
  const get = (f: ImportField) => (raw[f] ?? "").trim();
  const err = (field: ImportField | null, message: string) => errors.push({ row: sourceRow, field, message });
  const warn = (field: ImportField | null, message: string) => warnings.push({ row: sourceRow, field, message });

  const first = get("camper_first_name");
  const last = get("camper_last_name");
  if (!first) err("camper_first_name", "Camper first name is missing.");
  if (!last) err("camper_last_name", "Camper last name is missing.");

  let birthDate: string | null = null;
  if (!get("camper_birth_date")) err("camper_birth_date", "Birth date is missing.");
  else {
    birthDate = normalizeDate(get("camper_birth_date"), today);
    if (!birthDate) err("camper_birth_date", `"${get("camper_birth_date")}" is not a date we can read.`);
    else if (birthDate > today.toISOString().slice(0, 10)) err("camper_birth_date", "Birth date is in the future.");
  }

  const email = get("guardian_email").toLowerCase();
  if (!email) err("guardian_email", "Guardian email is missing.");
  else if (!EMAIL_RE.test(email) || email.length > 254) err("guardian_email", `"${email}" is not a valid email.`);

  let gender: "male" | "female" | "" = "";
  if (get("camper_gender")) {
    const g = normalizeGender(get("camper_gender"));
    if (g) gender = g;
    else warn("camper_gender", `Gender "${get("camper_gender")}" was not recognised and will be left blank.`);
  } else warn("camper_gender", "Gender is blank.");

  let grade: number | null = null;
  if (get("camper_grade")) {
    grade = normalizeGrade(get("camper_grade"));
    if (grade === null) err("camper_grade", `Grade "${get("camper_grade")}" is not a grade from K to 12.`);
  } else if (birthDate) {
    grade = estimateGrade(birthDate, today);
    warn("camper_grade", `Grade is blank; estimated ${grade === 0 ? "K" : grade} from the birth date.`);
  }

  let epipen: boolean | null = null;
  if (get("has_epipen")) {
    epipen = normalizeYesNo(get("has_epipen"));
    if (epipen === null) warn("has_epipen", `EpiPen value "${get("has_epipen")}" was not yes or no and was ignored.`);
  }

  let guardianLast = get("guardian_last_name");
  if (!guardianLast && last) {
    guardianLast = last;
    warn("guardian_last_name", "Guardian last name is blank; using the camper's last name.");
  }
  if (!get("guardian_first_name")) warn("guardian_first_name", "Guardian first name is blank.");
  if (!get("guardian_phone")) warn("guardian_phone", "Guardian phone is blank.");
  if (!get("guardian_relationship")) warn("guardian_relationship", 'Relationship is blank; saved as "guardian".');
  if (!get("guardian_address_line1") || !get("guardian_city") || !get("guardian_state") || !get("guardian_zip")) {
    warn("guardian_address_line1", "Mailing address is incomplete.");
  }

  for (const f of IMPORT_FIELDS) {
    if (get(f).length > 2000) err(f, "Value is longer than 2,000 characters.");
  }

  if (errors.length > 0 || !birthDate || grade === null) return { row: null, errors, warnings };

  const candidate: NormalizedRow = {
    source_row: sourceRow,
    camper_first_name: first.slice(0, 100),
    camper_last_name: last.slice(0, 100),
    camper_preferred_name: get("camper_preferred_name").slice(0, 100) || null,
    camper_birth_date: birthDate,
    camper_gender: gender,
    camper_grade: grade,
    guardian_first_name: get("guardian_first_name").slice(0, 100),
    guardian_last_name: guardianLast.slice(0, 100),
    guardian_email: email,
    guardian_phone: get("guardian_phone").slice(0, 40),
    guardian_relationship: (get("guardian_relationship") || "guardian").slice(0, 60),
    guardian_address_line1: get("guardian_address_line1").slice(0, 200),
    guardian_address_line2: get("guardian_address_line2").slice(0, 200) || null,
    guardian_city: get("guardian_city").slice(0, 100),
    guardian_state: get("guardian_state").slice(0, 60),
    guardian_zip: get("guardian_zip").slice(0, 20),
    allergies: healthText(raw.allergies),
    medications: healthText(raw.medications),
    dietary_notes: healthText(raw.dietary_notes),
    has_epipen: epipen,
  };

  const parsed = NormalizedRowSchema.safeParse(candidate);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      err((IMPORT_FIELDS as readonly string[]).includes(key) ? (key as ImportField) : null, issue.message);
    }
    return { row: null, errors, warnings };
  }
  return { row: parsed.data, errors, warnings };
}

/** The identity a camper is matched on, in the file and in the database. */
export function camperKey(row: Pick<NormalizedRow, "camper_first_name" | "camper_last_name" | "camper_birth_date">) {
  return [row.camper_first_name.trim().toLowerCase(), row.camper_last_name.trim().toLowerCase(), row.camper_birth_date].join("|");
}

/**
 * Normalise and validate every row. Source rows are numbered as the
 * spreadsheet shows them, with the header on row `headerRow`. The second and
 * later appearances of the same camper are errors.
 */
export function validateRows(
  rawRows: RawRow[],
  options: { headerRow?: number; today?: Date } = {},
): { rows: NormalizedRow[]; errors: RowIssue[]; warnings: RowIssue[] } {
  const headerRow = options.headerRow ?? 1;
  const rows: NormalizedRow[] = [];
  const errors: RowIssue[] = [];
  const warnings: RowIssue[] = [];
  const seen = new Map<string, number>();

  rawRows.forEach((raw, index) => {
    const sourceRow = headerRow + 1 + index;
    const result = normalizeRow(raw, sourceRow, options.today);
    warnings.push(...result.warnings);
    if (!result.row) {
      errors.push(...result.errors);
      return;
    }
    const key = camperKey(result.row);
    const earlier = seen.get(key);
    if (earlier !== undefined) {
      errors.push({ row: sourceRow, field: null, message: `Same camper as row ${earlier}.` });
      return;
    }
    seen.set(key, sourceRow);
    rows.push(result.row);
  });

  return { rows, errors, warnings };
}

/** Required fields no column is mapped to. */
export function missingRequiredFields(mapping: Mapping): ImportField[] {
  const mapped = new Set(mapping.filter(Boolean));
  return REQUIRED_FIELDS.filter((f) => !mapped.has(f));
}

export function chunk<T>(items: T[], size: number = CHUNK_SIZE): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
