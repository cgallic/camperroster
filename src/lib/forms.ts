import type { Json } from "./supabase/database.types";

/**
 * Shared, framework-free logic for admin-editable registration forms.
 *
 * Imported by both the browser (live conditional display + pre-submit checks)
 * and the intake API route (which re-runs the same validation, because the
 * client's copy proves nothing). Keep this file free of React and of anything
 * that only exists in one of the two runtimes.
 */

export const FORM_AUDIENCES = [
  "returning_family",
  "new_family",
  "returning_adult",
  "new_adult",
  "teen_volunteer",
] as const;
export type FormAudience = (typeof FORM_AUDIENCES)[number];

export const AUDIENCE_LABELS: Record<FormAudience, string> = {
  returning_family: "Returning Family",
  new_family: "New Family",
  returning_adult: "Returning Adult Volunteer",
  new_adult: "New Adult Volunteer",
  teen_volunteer: "Teen Volunteer",
};

export const FIELD_TYPES = [
  "text",
  "textarea",
  "email",
  "phone",
  "number",
  "date",
  "select",
  "radio",
  "multiselect",
  "checkbox",
  "file",
  "signature",
  "section_heading",
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export const VISIBILITIES = ["public", "link_only", "closed"] as const;
export type PeriodVisibility = (typeof VISIBILITIES)[number];

export const CONDITION_OPS = [
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "in",
  "contains",
  "is_true",
  "is_false",
] as const;
export type ConditionOp = (typeof CONDITION_OPS)[number];

/** Ops that ask nothing of the admin beyond the field to watch. */
export const UNARY_OPS: ConditionOp[] = ["is_true", "is_false"];

export const OP_LABELS: Record<ConditionOp, string> = {
  eq: "equals",
  neq: "does not equal",
  gt: "is greater than",
  gte: "is at least",
  lt: "is less than",
  lte: "is at most",
  in: "is one of",
  contains: "contains",
  is_true: "is checked",
  is_false: "is not checked",
};

/** What a condition can be compared against. Narrower than `unknown` because
 *  the rule is stored as JSON, so it has to survive a round trip. */
export type ConditionValue = string | number | boolean | null | Array<string | number | boolean | null>;

export type VisibleWhen = {
  field: string;
  op: ConditionOp;
  /** Absent for is_true / is_false. A list (or comma string) for `in`. */
  value?: ConditionValue;
};

/** A named object type is not assignable to Postgrest's index-signature `Json`,
 *  even when every field already satisfies it. This is the one place that gap is
 *  bridged, rather than casting at each call site. */
export function serializeVisibleWhen(rule: VisibleWhen | null): Json | null {
  return rule ? ({ ...rule } as Json) : null;
}

/**
 * One choice on a select / radio / multiselect. A bare string is both what the
 * person sees and what is stored. The object form lets the stored value differ
 * from the wording, so a long consent sentence can be answered as "Yes, I
 * consent" in the data while the person reads the whole sentence.
 */
export type FieldOption = string | { value: string; label: string };

export function optionValue(option: FieldOption): string {
  return typeof option === "string" ? option : option.value;
}

export function optionLabel(option: FieldOption): string {
  return typeof option === "string" ? option : option.label;
}

/** Reads the options jsonb defensively: anything that is not a usable option is dropped. */
export function normalizeOptions(raw: unknown): FieldOption[] {
  if (!Array.isArray(raw)) return [];
  const out: FieldOption[] = [];
  for (const item of raw) {
    if (typeof item === "string") out.push(item);
    else if (typeof item === "number") out.push(String(item));
    else if (item && typeof item === "object") {
      const { value, label } = item as { value?: unknown; label?: unknown };
      if (typeof value === "string" && value.trim()) {
        out.push(typeof label === "string" && label.trim() && label !== value ? { value, label } : value);
      }
    }
  }
  return out;
}

/**
 * Options as the admin editor shows them: one per line, and
 * "stored value | label" where the stored value differs from the wording.
 */
export function optionsToText(options: FieldOption[]): string {
  return options.map((o) => (typeof o === "string" ? o : `${o.value} | ${o.label}`)).join("\n");
}

export function parseOptionsText(text: string): FieldOption[] {
  const out: FieldOption[] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const bar = trimmed.indexOf(" | ");
    if (bar === -1) {
      out.push(trimmed);
      continue;
    }
    const value = trimmed.slice(0, bar).trim();
    const label = trimmed.slice(bar + 3).trim();
    out.push(!value ? label : !label || label === value ? value : { value, label });
  }
  return out;
}

/** Field types whose answer must be one of `options`. */
export const OPTION_FIELD_TYPES: FieldType[] = ["select", "radio", "multiselect"];

export type RegistrationPeriod = {
  id: string;
  camp_id: string;
  season_id: string;
  audience: FormAudience;
  name: string;
  opens_at: string | null;
  closes_at: string | null;
  visibility: PeriodVisibility;
  access_token: string | null;
  created_at?: string;
};

export type FormDefinition = {
  id: string;
  camp_id: string;
  period_id: string;
  version: number;
  title: string;
  intro_text: string | null;
  /** Shown in place of the form once it is submitted. Null uses the default thanks. */
  success_text?: string | null;
  published_at: string | null;
  created_at?: string;
};

export type FormField = {
  id: string;
  camp_id: string;
  form_id: string;
  field_key: string;
  label: string;
  help_text: string | null;
  field_type: FieldType;
  required: boolean;
  options: FieldOption[];
  visible_when: VisibleWhen | null;
  section: string | null;
  display_order: number;
  /**
   * Key of an earlier number/select question. When set, this question is asked
   * once per unit of that answer ("Number of Campers" = 3 asks it three times).
   * Each copy stores its answer under `${field_key}__${n}`, n counting from 1.
   */
  repeat_count_field?: string | null;
};

export type FormSubmission = {
  id: string;
  camp_id: string;
  form_id: string;
  registration_id: string | null;
  staff_application_id: string | null;
  answers: FormAnswers;
  submitted_at: string | null;
};

export type AnswerValue = string | number | boolean | string[] | null | undefined;
export type FormAnswers = Record<string, AnswerValue>;

export type ValidationResult = { ok: true } | { ok: false; errors: Record<string, string> };

/** Types that carry no answer and so are never required or validated. */
const PRESENTATIONAL_TYPES: FieldType[] = ["section_heading"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function toList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return value.split(",").map((s) => s.trim()).filter(Boolean);
  if (value === null || value === undefined) return [];
  return [value];
}

function looseEquals(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  const na = toNumber(a);
  const nb = toNumber(b);
  if (na !== null && nb !== null) return na === nb;
  if (typeof a === "boolean" || typeof b === "boolean") return truthy(a) === truthy(b);
  if (a === null || a === undefined || b === null || b === undefined) return false;
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

function truthy(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    return v !== "" && v !== "false" && v !== "no" && v !== "0";
  }
  if (Array.isArray(value)) return value.length > 0;
  return false;
}

/** True when the answer holds nothing a human would call an answer. */
export function isBlank(value: AnswerValue): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "boolean") return value === false;
  return false;
}

/**
 * Evaluates a field's `visible_when` against the answers so far. A field with
 * no condition is always visible; a condition naming a field nobody answered
 * yet resolves against an empty answer rather than throwing.
 */
export function isFieldVisible(
  field: Pick<FormField, "visible_when">,
  answers: FormAnswers
): boolean {
  const cond = field.visible_when;
  if (!cond || typeof cond !== "object" || !cond.field || !cond.op) return true;

  const actual = answers[cond.field];
  const expected = cond.value;

  switch (cond.op) {
    case "eq":
      return looseEquals(actual, expected);
    case "neq":
      return !looseEquals(actual, expected);
    case "gt":
    case "gte":
    case "lt":
    case "lte": {
      const a = toNumber(actual);
      const b = toNumber(expected);
      if (a === null || b === null) return false;
      if (cond.op === "gt") return a > b;
      if (cond.op === "gte") return a >= b;
      if (cond.op === "lt") return a < b;
      return a <= b;
    }
    case "in":
      return toList(expected).some((candidate) =>
        Array.isArray(actual)
          ? actual.some((a) => looseEquals(a, candidate))
          : looseEquals(actual, candidate)
      );
    case "contains":
      if (Array.isArray(actual)) return actual.some((a) => looseEquals(a, expected));
      if (actual === null || actual === undefined) return false;
      return String(actual).toLowerCase().includes(String(expected ?? "").toLowerCase());
    case "is_true":
      return truthy(actual);
    case "is_false":
      return !truthy(actual);
    default:
      return true;
  }
}

/**
 * The subset of fields a person filling this form should currently see. A
 * question whose condition watches a hidden question is hidden too, so a stale
 * answer behind a hidden question ("Are you a practicing Christian?" = No, left
 * over after switching "Catholic?" to Yes) cannot reveal, or require, anything.
 */
export function visibleFields(fields: FormField[], answers: FormAnswers): FormField[] {
  const hidden = new Set<string>();
  for (const f of [...fields].sort((a, b) => a.display_order - b.display_order)) {
    const watchesHidden = Boolean(f.visible_when?.field && hidden.has(f.visible_when.field));
    if (watchesHidden || !isFieldVisible(f, answers)) hidden.add(f.field_key);
  }
  return fields.filter((f) => !hidden.has(f.field_key));
}

const PHONE_DIGITS_RE = /\d/g;

const SIGNATURE_IMAGE_RE = /^data:image\/png;base64,[A-Za-z0-9+/]+=*$/;
/** A drawn signature is a few KB; this only stops someone posting a photo. */
export const MAX_SIGNATURE_IMAGE_CHARS = 300_000;

// Repeating questions ------------------------------------------------------------

/** Hard ceiling on copies, whatever the count question allows. */
export const MAX_REPEATS = 10;

const REPEAT_SUFFIX_RE = /^(.*)__(\d+)$/;

/** Where copy `n` (1-based) of a repeated question keeps its answer. */
export function repeatKey(fieldKey: string, n: number): string {
  return `${fieldKey}__${n}`;
}

/** Splits `camper_first_name__2` into its base key and copy number. */
export function parseRepeatKey(key: string): { base: string; index: number } | null {
  const match = REPEAT_SUFFIX_RE.exec(key);
  if (!match) return null;
  const index = Number(match[2]);
  return index >= 1 ? { base: match[1], index } : null;
}

/** How many copies the count question currently asks for, clamped to 0..MAX_REPEATS. */
export function repeatCount(countKey: string, answers: FormAnswers): number {
  const n = toNumber(answers[countKey]);
  if (n === null || n < 1) return 0;
  return Math.min(MAX_REPEATS, Math.floor(n));
}

/**
 * The form as the person currently sees it: each run of consecutive questions
 * repeated off the same count is laid out once per copy (all of camper 1, then
 * all of camper 2), keyed `${key}__${n}` and sectioned "<section> <n>". A
 * condition pointing at another question in the same run is re-pointed at the
 * same copy, so "show B when A" inside camper 2 reads camper 2's A.
 * Questions that do not repeat pass through unchanged.
 */
export function expandRepeats(fields: FormField[], answers: FormAnswers): FormField[] {
  const ordered = [...fields].sort((a, b) => a.display_order - b.display_order);
  if (!ordered.some((f) => f.repeat_count_field)) return ordered;

  const out: FormField[] = [];
  let i = 0;
  while (i < ordered.length) {
    const countKey = ordered[i].repeat_count_field;
    if (!countKey) {
      out.push(ordered[i]);
      i += 1;
      continue;
    }
    let j = i;
    while (j < ordered.length && ordered[j].repeat_count_field === countKey) j += 1;
    const run = ordered.slice(i, j);
    const runKeys = new Set(run.map((f) => f.field_key));
    const copies = repeatCount(countKey, answers);
    for (let n = 1; n <= copies; n += 1) {
      for (const field of run) {
        const cond = field.visible_when;
        out.push({
          ...field,
          id: `${field.id}__${n}`,
          field_key: repeatKey(field.field_key, n),
          section: `${field.section?.trim() || "Entry"} ${n}`,
          visible_when: cond && runKeys.has(cond.field) ? { ...cond, field: repeatKey(cond.field, n) } : cond,
        });
      }
    }
    i = j;
  }
  return out.map((f, index) => ({ ...f, display_order: index }));
}

/**
 * Checks required-ness and per-type shape, but only for fields the conditions
 * currently show. A required question hidden behind a condition must never be
 * what blocks a submission.
 */
export function validateSubmission(fields: FormField[], answers: FormAnswers): ValidationResult {
  const errors: Record<string, string> = {};

  // Repeated questions are validated per copy, and only for the copies the
  // count currently asks for; a fourth camper left over from changing "4" to
  // "2" is neither required nor checked.
  for (const field of visibleFields(expandRepeats(fields, answers), answers)) {
    if (PRESENTATIONAL_TYPES.includes(field.field_type)) continue;

    const value = answers[field.field_key];
    const blank = isBlank(value);

    if (field.required && blank) {
      errors[field.field_key] =
        field.field_type === "checkbox" || field.field_type === "signature"
          ? `${field.label} is required.`
          : `${field.label} is required.`;
      continue;
    }
    if (blank) continue;

    switch (field.field_type) {
      case "email":
        if (!EMAIL_RE.test(String(value).trim())) {
          errors[field.field_key] = "Enter a valid email address.";
        }
        break;
      case "phone": {
        const digits = String(value).match(PHONE_DIGITS_RE)?.length ?? 0;
        if (digits < 10) errors[field.field_key] = "Enter a 10-digit phone number.";
        break;
      }
      case "number":
        if (toNumber(value) === null) errors[field.field_key] = "Enter a number.";
        break;
      case "date": {
        const raw = String(value).trim();
        if (Number.isNaN(Date.parse(raw))) errors[field.field_key] = "Enter a valid date.";
        break;
      }
      case "select":
      case "radio":
        if (field.options.length && !field.options.some((o) => looseEquals(optionValue(o), value))) {
          errors[field.field_key] = "Choose one of the listed options.";
        }
        break;
      case "multiselect": {
        const chosen = toList(value);
        if (field.options.length) {
          const bad = chosen.find((c) => !field.options.some((o) => looseEquals(optionValue(o), c)));
          if (bad !== undefined) errors[field.field_key] = "Choose from the listed options.";
        }
        break;
      }
      case "signature": {
        // Either a typed name or the PNG the drawing pad produced. Anything else
        // claiming to be an image is refused rather than stored.
        const raw = String(value);
        if (raw.startsWith("data:")) {
          if (!SIGNATURE_IMAGE_RE.test(raw) || raw.length > MAX_SIGNATURE_IMAGE_CHARS) {
            errors[field.field_key] = "Draw your signature again.";
          }
        } else if (raw.trim().length < 2) {
          errors[field.field_key] = `${field.label} is required.`;
        }
        break;
      }
      default:
        break;
    }
  }

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true };
}

/** Whole years old on `asOf`. Returns null when the date will not parse. */
export function computeAge(birthDate: string | Date, asOf: string | Date = new Date()): number | null {
  const dob = birthDate instanceof Date ? birthDate : new Date(birthDate);
  const at = asOf instanceof Date ? asOf : new Date(asOf);
  if (Number.isNaN(dob.getTime()) || Number.isNaN(at.getTime())) return null;

  let age = at.getUTCFullYear() - dob.getUTCFullYear();
  const beforeBirthday =
    at.getUTCMonth() < dob.getUTCMonth() ||
    (at.getUTCMonth() === dob.getUTCMonth() && at.getUTCDate() < dob.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

/** Below this at camp time, a volunteer belongs on the teen form, not the adult one. */
export const ADULT_VOLUNTEER_MIN_AGE = 18;

export type AudienceGuardResult = { ok: true } | { ok: false; reason: string; suggestedAudience?: FormAudience };

/**
 * Catches the common intake mistake: a seventeen-year-old filling out the adult
 * volunteer form. Adults must be 18 at camp time; teens must not be.
 */
export function checkAudienceAge(
  audience: FormAudience,
  birthDate: string | Date | null | undefined,
  campStart: string | Date = new Date()
): AudienceGuardResult {
  const adultAudience = audience === "new_adult" || audience === "returning_adult";
  if (!adultAudience && audience !== "teen_volunteer") return { ok: true };
  if (!birthDate) return { ok: true };

  const age = computeAge(birthDate, campStart);
  if (age === null) return { ok: false, reason: "That date of birth could not be read." };

  if (adultAudience && age < ADULT_VOLUNTEER_MIN_AGE) {
    return {
      ok: false,
      reason: `Adult volunteers must be ${ADULT_VOLUNTEER_MIN_AGE} by the first day of camp. Please use the teen volunteer form.`,
      suggestedAudience: "teen_volunteer",
    };
  }
  if (audience === "teen_volunteer" && age >= ADULT_VOLUNTEER_MIN_AGE) {
    return {
      ok: false,
      reason: `Volunteers ${ADULT_VOLUNTEER_MIN_AGE} and older need the adult volunteer form, which includes the background check.`,
      suggestedAudience: "new_adult",
    };
  }
  return { ok: true };
}

/** Mirrors registration_period_is_open() in SQL so the UI agrees with the DB. */
export function isPeriodOpen(period: Pick<RegistrationPeriod, "visibility" | "opens_at" | "closes_at">, now: Date = new Date()): boolean {
  if (period.visibility === "closed") return false;
  if (period.opens_at && now < new Date(period.opens_at)) return false;
  if (period.closes_at && now >= new Date(period.closes_at)) return false;
  return true;
}

/**
 * Whether this request may see the form. A link_only period stays reachable
 * with the right token even once it has dropped off the public listing, but a
 * closed period or an expired window never is.
 */
export function canViewPeriod(
  period: Pick<RegistrationPeriod, "visibility" | "opens_at" | "closes_at" | "access_token">,
  token: string | null | undefined,
  now: Date = new Date()
): boolean {
  const hasToken = Boolean(period.access_token) && token === period.access_token;
  if (period.visibility === "link_only") return hasToken;
  return isPeriodOpen(period, now);
}

/** Groups fields for rendering: sections in first-appearance order. */
export function groupFieldsBySection(fields: FormField[]): { section: string | null; fields: FormField[] }[] {
  const ordered = [...fields].sort((a, b) => a.display_order - b.display_order);
  const groups: { section: string | null; fields: FormField[] }[] = [];
  for (const field of ordered) {
    const key = field.section && field.section.trim() ? field.section.trim() : null;
    const last = groups[groups.length - 1];
    if (last && last.section === key) last.fields.push(field);
    else groups.push({ section: key, fields: [field] });
  }
  return groups;
}

/** Turns a label into a usable field_key, since admins should not have to. */
export function slugifyKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
}

/** Answer shape a freshly opened form starts from. */
export function emptyAnswers(fields: FormField[]): FormAnswers {
  const answers: FormAnswers = {};
  for (const f of fields) {
    if (PRESENTATIONAL_TYPES.includes(f.field_type)) continue;
    // Copies of a repeated question are created on demand by expandRepeats.
    if (f.repeat_count_field) continue;
    answers[f.field_key] = f.field_type === "checkbox" ? false : f.field_type === "multiselect" ? [] : "";
  }
  return answers;
}

/**
 * Drops answers to fields the form does not define, so stray keys never land in
 * the DB. Repeated questions are allowed only for the copies the count asks for.
 */
export function pickKnownAnswers(fields: FormField[], answers: FormAnswers): FormAnswers {
  const allowed = new Set(
    expandRepeats(fields, answers ?? {})
      .filter((f) => !PRESENTATIONAL_TYPES.includes(f.field_type))
      .map((f) => f.field_key)
  );
  const out: FormAnswers = {};
  for (const [k, v] of Object.entries(answers ?? {})) {
    if (allowed.has(k)) out[k] = v as AnswerValue;
  }
  return out;
}
