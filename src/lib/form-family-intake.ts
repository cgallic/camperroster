import {
  parseRepeatKey,
  repeatCount,
  type AnswerValue,
  type FormAnswers,
  type FormAudience,
  type FormField,
} from "./forms.ts";

/**
 * The contract between an admin-built family form and the household records.
 *
 * A family form becomes a real household (family, guardian, one camper and one
 * registration per child) when it asks these questions under these keys. The
 * keys are the contract, not the labels, so a camp can word the questions
 * however it likes. A form missing any of them is still accepted, but only as a
 * stored response, exactly as before.
 */
export const FAMILY_INTAKE_KEYS = {
  guardianFirstName: "guardian_first_name",
  guardianLastName: "guardian_last_name",
  guardianEmail: "guardian_email",
  guardianPhone: "guardian_phone",
  street: "address_street",
  city: "address_city",
  state: "address_state",
  zip: "address_zip",
  /** The count question the camper block repeats off. */
  camperCount: "camper_count",
  camperFirstName: "camper_first_name",
  camperLastName: "camper_last_name",
  camperGender: "camper_gender",
  camperBirthDate: "camper_birth_date",
  camperGrade: "camper_grade",
} as const;

const CAMPER_KEYS = [
  FAMILY_INTAKE_KEYS.camperFirstName,
  FAMILY_INTAKE_KEYS.camperLastName,
  FAMILY_INTAKE_KEYS.camperGender,
  FAMILY_INTAKE_KEYS.camperBirthDate,
  FAMILY_INTAKE_KEYS.camperGrade,
];

const HOUSEHOLD_KEYS = [
  FAMILY_INTAKE_KEYS.guardianFirstName,
  FAMILY_INTAKE_KEYS.guardianLastName,
  FAMILY_INTAKE_KEYS.guardianEmail,
  FAMILY_INTAKE_KEYS.guardianPhone,
  FAMILY_INTAKE_KEYS.street,
  FAMILY_INTAKE_KEYS.city,
  FAMILY_INTAKE_KEYS.state,
  FAMILY_INTAKE_KEYS.zip,
];

export function isFamilyAudience(audience: FormAudience): boolean {
  return audience === "new_family" || audience === "returning_family";
}

/**
 * True when the form carries every household key, and every camper key either
 * as a question repeated off `camper_count` or as a single question.
 */
export function formSupportsFamilyIntake(fields: FormField[]): boolean {
  const byKey = new Map(fields.map((f) => [f.field_key, f]));
  if (!HOUSEHOLD_KEYS.every((k) => byKey.has(k))) return false;
  return CAMPER_KEYS.every((k) => byKey.has(k));
}

export type FamilyIntakeCamper = {
  first_name: string;
  last_name: string;
  gender: string;
  birth_date: string;
  grade: number;
};

export type FamilyIntakePayload = {
  guardian: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  campers: FamilyIntakeCamper[];
};

export type FamilyIntakeResult = { ok: true; payload: FamilyIntakePayload } | { ok: false; errors: Record<string, string> };

function text(value: AnswerValue): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

/**
 * Leading whole number of a grade answer: "2nd" -> 2, "9" -> 9, "K" -> null.
 * Camp Hope stores the last grade completed ("2nd".."9th"); that number is what
 * its cabins are banded on, so it is kept as-is in campers.grade_entering.
 */
export function parseGrade(value: AnswerValue): number | null {
  const match = /^\s*(\d{1,2})/.exec(text(value));
  return match ? Number(match[1]) : null;
}

/** Placement matches cabins on lowercase gender, so store it that way. */
export function normalizeGender(value: AnswerValue): string {
  return text(value).toLowerCase();
}

/**
 * Turns validated answers into the household the database will create: one
 * guardian and one camper per copy of the repeated camper block. Call it after
 * validateSubmission; it re-checks only what the records themselves need.
 */
export function buildFamilyIntake(fields: FormField[], answers: FormAnswers): FamilyIntakeResult {
  const errors: Record<string, string> = {};
  const K = FAMILY_INTAKE_KEYS;
  const get = (key: string) => text(answers[key]);

  for (const key of HOUSEHOLD_KEYS) {
    if (!get(key)) errors[key] = "This is needed to set up your household.";
  }

  const camperField = fields.find((f) => f.field_key === K.camperFirstName);
  const countKey = camperField?.repeat_count_field ?? null;
  const copies = countKey ? repeatCount(countKey, answers) : 1;
  const keyFor = (base: string, n: number) => (countKey ? `${base}__${n}` : base);

  const campers: FamilyIntakeCamper[] = [];
  for (let n = 1; n <= copies; n += 1) {
    const first = get(keyFor(K.camperFirstName, n));
    const last = get(keyFor(K.camperLastName, n));
    const gender = normalizeGender(answers[keyFor(K.camperGender, n)]);
    const birth = get(keyFor(K.camperBirthDate, n));
    const grade = parseGrade(answers[keyFor(K.camperGrade, n)]);

    if (!first) errors[keyFor(K.camperFirstName, n)] = "Enter the camper's first name.";
    if (!last) errors[keyFor(K.camperLastName, n)] = "Enter the camper's last name.";
    if (!gender) errors[keyFor(K.camperGender, n)] = "Choose the camper's gender.";
    if (!birth || Number.isNaN(Date.parse(birth))) errors[keyFor(K.camperBirthDate, n)] = "Enter a valid date of birth.";
    if (grade === null) errors[keyFor(K.camperGrade, n)] = "Choose the camper's grade.";

    campers.push({ first_name: first, last_name: last, gender, birth_date: birth.slice(0, 10), grade: grade ?? 0 });
  }

  if (!campers.length) errors[countKey ?? K.camperFirstName] = "Register at least one camper.";
  if (Object.keys(errors).length) return { ok: false, errors };

  return {
    ok: true,
    payload: {
      guardian: {
        first_name: get(K.guardianFirstName),
        last_name: get(K.guardianLastName),
        email: get(K.guardianEmail).toLowerCase(),
        phone: get(K.guardianPhone),
        street: get(K.street),
        city: get(K.city),
        state: get(K.state),
        zip: get(K.zip),
      },
      campers,
    },
  };
}

/**
 * Label for an answer key in staff views. A repeated copy is labelled with its
 * question and its number, e.g. "Gender (#2)".
 */
export function answerLabel(labels: Map<string, string>, key: string): string {
  const direct = labels.get(key);
  if (direct) return direct;
  const repeat = parseRepeatKey(key);
  if (repeat) {
    const base = labels.get(repeat.base);
    if (base) return `${base} (#${repeat.index})`;
  }
  return key.replace(/_/g, " ");
}
