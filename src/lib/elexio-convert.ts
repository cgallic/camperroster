import { slugifyKey, type FieldOption, type FieldType, type FormAudience, type VisibleWhen } from "./forms.ts";

/**
 * Converts an Elexio / Ministry Forms form definition (the JSON the public form
 * page loads from forms.ministryforms.net/api/v1/forms/getclient/<id>) into
 * Camper Roster's form model: one row per question, in order, with the same
 * wording, required flags, option labels, stored values and show/hide rules.
 *
 * Pure: no file or network access, so the mapping can be tested and re-run.
 * scripts/convert-elexio-forms.ts does the reading and writing.
 */

// The slice of the Ministry Forms schema this converter reads. -----------------

export type ElexioOption = {
  id?: string;
  itemValue: string;
  itemKey?: string;
  itemDescription?: string;
};

export type ElexioCondition = {
  comparisonType: number;
  dependentFieldId: string;
  matchingValue: string;
  subConditions?: unknown[];
  subPropertyName?: string;
};

export type ElexioField = {
  id: string;
  name: string;
  type: string;
  templateName?: string;
  required?: boolean;
  helpText?: string;
  content?: string;
  options?: ElexioOption[];
  useOptionKeys?: boolean;
  conditions?: ElexioCondition[];
  isConditional?: boolean;
  matchAllConditions?: boolean;
  fields?: ElexioField[];
  totalAllowed?: number;
  isPaymentField?: boolean;
  amount?: number;
  timedAmounts?: { amount: number; endDate: string }[];
};

export type ElexioForm = {
  id: string;
  name: string;
  description?: string;
  successMessage?: string;
  submitButtonText?: string;
  isPaymentEnabled?: boolean;
  paymentConfiguration?: { acceptsPayLater?: boolean } | null;
  fields: ElexioField[];
};

// Output -------------------------------------------------------------------------

export type ConvertedField = {
  field_key: string;
  label: string;
  help_text: string | null;
  field_type: FieldType;
  required: boolean;
  options: FieldOption[];
  visible_when: VisibleWhen | null;
  section: string | null;
  repeat_count_field: string | null;
  /** The Elexio question this row came from (a name or address yields several rows). */
  elexio_id: string;
};

export type ConvertedPricing = {
  /** Per-camper price after the early date. */
  amount_cents: number;
  /** Per-camper price before it, when there is one. */
  early_amount_cents: number | null;
  /** First day the regular price applies (YYYY-MM-DD), Elexio's timed-amount end. */
  early_ends_on: string | null;
  /** Most campers one registration can carry. */
  max_campers: number;
  accepts_pay_later: boolean;
};

export type ConvertedForm = {
  audience: FormAudience;
  elexio_form_id: string;
  title: string;
  intro_text: string | null;
  success_text: string | null;
  submit_label: string | null;
  fields: ConvertedField[];
  pricing: ConvertedPricing | null;
  /** Elexio blocks deliberately left out, with why, so nothing disappears silently. */
  omitted: { elexio_id: string; reason: string; text: string }[];
};

/** A camp-specific key for one Elexio question; names and addresses take one per part. */
export type KeyOverride =
  | string
  | { first: string; last: string }
  | { street: string; city: string; state: string; zip: string };

export type ConvertOptions = {
  audience: FormAudience;
  keyOverrides?: Record<string, KeyOverride>;
  /** Elexio field ids to leave out, with the reason recorded in `omitted`. */
  omit?: Record<string, string>;
};

// HTML -> text ----------------------------------------------------------------------

const ENTITIES: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  ndash: "–",
  mdash: "—",
  hellip: "…",
};

function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : whole;
    }
    return ENTITIES[code.toLowerCase()] ?? whole;
  });
}

/**
 * Elexio stores intro, notice and success copy as HTML. The form renders plain
 * text (with line breaks kept), so paragraphs become blank-line breaks, list
 * items become "• " lines, and a link keeps its address: "HERE (https://…)".
 */
export function htmlToText(html: string | null | undefined): string {
  if (!html) return "";
  let s = html.replace(/\r\n?/g, "\n");
  s = s.replace(/<a\b[^>]*?href\s*=\s*"([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href: string, inner: string) => {
    const label = inner.replace(/<[^>]+>/g, "").trim();
    const url = decodeEntities(href).trim();
    if (!url || url.startsWith("#")) return label;
    if (url.startsWith("mailto:")) return label || url.slice(7);
    return label && label !== url ? `${label} (${url})` : url;
  });
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<li\b[^>]*>/gi, "\n• ");
  s = s.replace(/<\/(p|h[1-6]|div|ul|ol|li|blockquote)>/gi, "\n");
  s = s.replace(/<(p|h[1-6]|div|ul|ol|blockquote)\b[^>]*>/gi, "\n");
  s = s.replace(/<[^>]+>/g, "");
  s = decodeEntities(s);
  const lines = s.split("\n").map((line) => line.replace(/[ \t ]+/g, " ").trim());
  // "• " followed by an empty line (from <li><p>…) folds onto the text.
  const folded: string[] = [];
  for (const line of lines) {
    const prev = folded[folded.length - 1];
    if (prev === "•" && line) folded[folded.length - 1] = `• ${line}`;
    else folded.push(line);
  }
  return folded
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function nullIfBlank(s: string | null | undefined): string | null {
  const t = (s ?? "").trim();
  return t ? t : null;
}

// Fields ------------------------------------------------------------------------------

function mapOptions(field: ElexioField): FieldOption[] {
  return (field.options ?? []).map((o) => {
    const label = o.itemValue;
    const value = field.useOptionKeys && o.itemKey ? o.itemKey : o.itemValue;
    return value === label ? label : { value, label };
  });
}

function scalarType(field: ElexioField): FieldType {
  switch (field.type) {
    case "email":
      return "email";
    case "tel":
      return "phone";
    case "memo":
      return "textarea";
    case "dropdown":
      return "select";
    case "radio":
      return "radio";
    case "digital-signature":
      return "signature";
    case "text":
    case "person-fieldset-person-name":
      if (field.templateName === "date") return "date";
      if (field.templateName === "numbers") return "number";
      return "text";
    default:
      throw new Error(`Elexio field type "${field.type}" (${field.id} "${field.name}") has no mapping.`);
  }
}

/** Elexio de-duplicates names inside fieldsets as "Person's Name (2)"; the person sees "Person's Name". */
function displayName(field: ElexioField): string {
  const name = (field.name ?? "").trim();
  return field.type === "person-fieldset-person-name" ? name.replace(/\s+\(\d+\)$/, "") : name;
}

export function convertElexioForm(form: ElexioForm, options: ConvertOptions): ConvertedForm {
  const overrides = options.keyOverrides ?? {};
  const omit = options.omit ?? {};
  const out: ConvertedField[] = [];
  const omitted: ConvertedForm["omitted"] = [];
  const usedKeys = new Set<string>();
  // Elexio id -> the key conditions should test (for a name: its first-name key).
  const keyById = new Map<string, string>();
  let pricing: ConvertedPricing | null = null;
  let textBlocks = 0;

  const claim = (wanted: string): string => {
    const base = wanted || "field";
    let key = base;
    for (let n = 2; usedKeys.has(key); n += 1) key = `${base}_${n}`;
    usedKeys.add(key);
    return key;
  };

  const conditionFor = (field: ElexioField): VisibleWhen | null => {
    const conds = field.conditions ?? [];
    if (!field.isConditional || !conds.length) return null;
    if (field.matchAllConditions && conds.length > 1) {
      throw new Error(`"${field.name}" (${field.id}) needs ALL of several conditions; the form model holds one.`);
    }
    const dependents = new Set(conds.map((c) => c.dependentFieldId));
    if (dependents.size !== 1) {
      throw new Error(`"${field.name}" (${field.id}) depends on more than one question.`);
    }
    for (const c of conds) {
      if (c.comparisonType !== 3) {
        throw new Error(`"${field.name}" (${field.id}) uses Elexio comparison ${c.comparisonType}; only 3 (equals) is mapped.`);
      }
      if ((c.subConditions ?? []).length || c.subPropertyName) {
        throw new Error(`"${field.name}" (${field.id}) uses sub-conditions, which are not mapped.`);
      }
    }
    const target = keyById.get(conds[0].dependentFieldId);
    if (!target) {
      throw new Error(`"${field.name}" (${field.id}) depends on ${conds[0].dependentFieldId}, which comes later or was not converted.`);
    }
    const values = conds.map((c) => c.matchingValue);
    return values.length === 1 ? { field: target, op: "eq", value: values[0] } : { field: target, op: "in", value: values };
  };

  const pushTextBlock = (field: ElexioField, text: string, section: string | null, visible_when: VisibleWhen | null) => {
    textBlocks += 1;
    out.push({
      field_key: claim(`text_${textBlocks}`),
      label: "",
      help_text: text,
      field_type: "section_heading",
      required: false,
      options: [],
      visible_when,
      section,
      repeat_count_field: null,
      elexio_id: field.id,
    });
  };

  const convertQuestion = (
    field: ElexioField,
    section: string | null,
    repeatCountField: string | null,
    inheritedCondition: VisibleWhen | null
  ) => {
    const override = overrides[field.id];
    const label = displayName(field);
    const help = nullIfBlank(field.helpText);
    const required = Boolean(field.required);
    const visible_when = conditionFor(field) ?? inheritedCondition;
    const row = (key: string, rowLabel: string, type: FieldType, rowHelp: string | null, opts: FieldOption[] = []) => {
      out.push({
        field_key: key,
        label: rowLabel,
        help_text: rowHelp,
        field_type: type,
        required,
        options: opts,
        visible_when,
        section,
        repeat_count_field: repeatCountField,
        elexio_id: field.id,
      });
    };

    if (field.type === "person-name" || field.type === "person-fieldset-person-name") {
      // Elexio asks a name as First / Last under one heading; so does the roster.
      const slug = slugifyKey(label);
      const keys =
        override && typeof override === "object" && "first" in override
          ? override
          : { first: `${slug}_first`, last: `${slug}_last` };
      const first = claim(keys.first);
      const last = claim(keys.last);
      row(first, `${label} (First)`, "text", help);
      row(last, `${label} (Last)`, "text", null);
      keyById.set(field.id, first);
      return;
    }

    if (field.type === "address") {
      const slug = slugifyKey(label);
      const keys =
        override && typeof override === "object" && "street" in override
          ? override
          : { street: `${slug}_street`, city: `${slug}_city`, state: `${slug}_state`, zip: `${slug}_zip` };
      const street = claim(keys.street);
      row(street, `${label} (Street)`, "text", help);
      row(claim(keys.city), `${label} (City)`, "text", null);
      row(claim(keys.state), `${label} (State)`, "text", null);
      row(claim(keys.zip), `${label} (ZIP)`, "text", null);
      keyById.set(field.id, street);
      return;
    }

    const type = scalarType(field);
    const key = claim(typeof override === "string" ? override : slugifyKey(label));
    row(key, label, type, help, mapOptions(field));
    keyById.set(field.id, key);
  };

  let section: string | null = null;

  for (const field of form.fields) {
    if (omit[field.id]) {
      omitted.push({ elexio_id: field.id, reason: omit[field.id], text: htmlToText(field.content) || field.name });
      continue;
    }

    switch (field.type) {
      case "divider":
      case "empty-space":
        // A rule across the page: the next questions stand on their own.
        section = null;
        break;

      case "section":
        section = nullIfBlank(htmlToText(field.content)) ?? nullIfBlank(field.name);
        break;

      case "static":
        pushTextBlock(field, htmlToText(field.content), section, conditionFor(field));
        break;

      case "person-fieldset": {
        const children = field.fields ?? [];
        const allowed = field.totalAllowed ?? 1;

        if (field.isPaymentField && (field.amount ?? 0) > 0) {
          const timed = (field.timedAmounts ?? [])[0];
          pricing = {
            amount_cents: Math.round((field.amount ?? 0) * 100),
            early_amount_cents: timed ? Math.round(timed.amount * 100) : null,
            early_ends_on: timed ? timed.endDate.slice(0, 10) : null,
            max_campers: allowed,
            accepts_pay_later: Boolean(form.paymentConfiguration?.acceptsPayLater),
          };
        }

        if (allowed > 1) {
          // A block asked once per person. Elexio shows it when the count
          // question has any answer; here the count decides how many copies.
          const conds = field.conditions ?? [];
          const countKey = conds.length ? keyById.get(conds[0].dependentFieldId) : undefined;
          if (!countKey || new Set(conds.map((c) => c.dependentFieldId)).size !== 1) {
            throw new Error(`Repeating block "${field.name}" (${field.id}) is not tied to a single count question.`);
          }
          const blockSection = nullIfBlank(field.name) ?? "Entry";
          for (const child of children) convertQuestion(child, blockSection, countKey, null);
          // Questions after the block belong to the enclosing section again.
        } else {
          // A one-off group of questions: a heading, then its questions.
          out.push({
            field_key: claim(`${slugifyKey(field.name)}_heading`),
            label: field.name.trim(),
            help_text: nullIfBlank(field.helpText),
            field_type: "section_heading",
            required: false,
            options: [],
            visible_when: conditionFor(field),
            section,
            repeat_count_field: null,
            elexio_id: field.id,
          });
          const inherited = conditionFor(field);
          for (const child of children) convertQuestion(child, section, null, inherited);
        }
        break;
      }

      default:
        convertQuestion(field, section, null, null);
    }
  }

  return {
    audience: options.audience,
    elexio_form_id: form.id,
    title: form.name.trim(),
    intro_text: nullIfBlank(htmlToText(form.description)),
    success_text: nullIfBlank(htmlToText(form.successMessage)),
    submit_label: nullIfBlank(form.submitButtonText),
    fields: out,
    pricing,
    omitted,
  };
}

/**
 * Household tiers (pricing_tiers rows) for a per-camper price: N campers cost
 * N times the price, early and regular. These are the prices before any family
 * discount; Elexio applied that through checkout codes whose amounts are not in
 * the form data, so a camp sets discounted tiers itself.
 */
export function perCamperTiers(
  pricing: ConvertedPricing
): { camper_count: number; early_cents: number; regular_cents: number }[] {
  const early = pricing.early_amount_cents ?? pricing.amount_cents;
  return Array.from({ length: pricing.max_campers }, (_, i) => ({
    camper_count: i + 1,
    early_cents: (i + 1) * early,
    regular_cents: (i + 1) * pricing.amount_cents,
  }));
}
