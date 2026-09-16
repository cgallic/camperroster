"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import {
  emptyAnswers,
  groupFieldsBySection,
  isFieldVisible,
  validateSubmission,
  type AnswerValue,
  type FormAnswers,
  type FormAudience,
  type FormField,
} from "@/lib/forms";

const inputClass =
  "w-full rounded-xl border-2 border-stone-200 px-3 py-2.5 text-sm text-stone-900 focus:border-forest-400 focus:outline-none";

export default function PublicFormClient({
  formId,
  audience,
  token,
  fields,
}: {
  formId: string;
  audience: FormAudience;
  token: string | null;
  fields: FormField[];
}) {
  const [answers, setAnswers] = useState<FormAnswers>(() => emptyAnswers(fields));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const groups = useMemo(() => groupFieldsBySection(fields), [fields]);

  const set = (key: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const result = validateSubmission(fields, answers);
    if (!result.ok) {
      setErrors(result.errors);
      setFormError("Please fix the highlighted answers.");
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch("/api/forms/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form_id: formId, audience, token, answers }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setSubmitted(true);
      } else {
        if (body?.errors) setErrors(body.errors as Record<string, string>);
        setFormError(body?.error ?? "We could not save that. Please try again.");
      }
    } catch {
      setFormError("Network trouble — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 border-2 border-emerald-300 shadow-xl text-center space-y-5">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="font-display font-black text-2xl sm:text-3xl text-stone-900">Thank you — we got it!</h2>
        <p className="text-stone-600">
          The camp office has your answers. Watch your email for the next step.
        </p>
        <Link href="/" className="inline-block px-5 py-2.5 rounded-full bg-forest-800 text-white font-bold text-sm hover:bg-forest-900">
          Back to camp home
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {groups.map((group, gi) => {
        const shown = group.fields.filter((f) => isFieldVisible(f, answers));
        if (!shown.length) return null;
        return (
          <section key={`${group.section ?? "ungrouped"}-${gi}`} className="bg-white rounded-3xl border-2 border-stone-200 p-5 sm:p-7 space-y-5">
            {group.section && (
              <h2 className="font-display font-black text-xl text-stone-900 border-b border-stone-200 pb-2">
                {group.section}
              </h2>
            )}
            {shown.map((field) => (
              <FieldInput
                key={field.id}
                field={field}
                value={answers[field.field_key]}
                error={errors[field.field_key]}
                onChange={(v) => set(field.field_key, v)}
              />
            ))}
          </section>
        );
      })}

      {formError && (
        <div className="flex items-start gap-2 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          {formError}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-forest-800 text-white font-bold hover:bg-forest-900 disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit registration"}
      </button>
    </form>
  );
}

function FieldInput({
  field,
  value,
  error,
  onChange,
}: {
  field: FormField;
  value: AnswerValue;
  error?: string;
  onChange: (value: AnswerValue) => void;
}) {
  if (field.field_type === "section_heading") {
    return (
      <div className="pt-2">
        <h3 className="font-display font-black text-lg text-stone-900">{field.label}</h3>
        {field.help_text && <p className="text-sm text-stone-600 mt-1">{field.help_text}</p>}
      </div>
    );
  }

  const describedBy = error ? `${field.field_key}-error` : undefined;
  const border = error ? "border-red-300" : "";

  const control = (() => {
    switch (field.field_type) {
      case "textarea":
        return (
          <textarea
            id={field.field_key}
            rows={4}
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            aria-describedby={describedBy}
            className={`${inputClass} ${border}`}
          />
        );
      case "select":
        return (
          <select
            id={field.field_key}
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            aria-describedby={describedBy}
            className={`${inputClass} ${border}`}
          >
            <option value="">— choose —</option>
            {field.options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        );
      case "multiselect": {
        const chosen = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-1.5">
            {field.options.map((o) => (
              <label key={o} className="flex items-center gap-2 text-sm text-stone-800">
                <input
                  type="checkbox"
                  checked={chosen.includes(o)}
                  onChange={(e) =>
                    onChange(e.target.checked ? [...chosen, o] : chosen.filter((c) => c !== o))
                  }
                  className="w-4 h-4 accent-forest-800"
                />
                {o}
              </label>
            ))}
          </div>
        );
      }
      case "checkbox":
        return (
          <label className="flex items-start gap-2 text-sm text-stone-800">
            <input
              id={field.field_key}
              type="checkbox"
              checked={value === true}
              onChange={(e) => onChange(e.target.checked)}
              className="w-4 h-4 mt-0.5 accent-forest-800"
            />
            <span>{field.label}</span>
          </label>
        );
      case "file":
        return (
          <input
            id={field.field_key}
            type="file"
            onChange={(e) => onChange(e.target.files?.[0]?.name ?? "")}
            aria-describedby={describedBy}
            className={`${inputClass} ${border} file:mr-3 file:rounded-full file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-xs file:font-bold`}
          />
        );
      case "signature":
        return (
          <input
            id={field.field_key}
            type="text"
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type your full legal name"
            aria-describedby={describedBy}
            className={`${inputClass} ${border} font-display italic`}
          />
        );
      default:
        return (
          <input
            id={field.field_key}
            type={field.field_type === "email" ? "email" : field.field_type === "number" ? "number" : field.field_type === "date" ? "date" : field.field_type === "phone" ? "tel" : "text"}
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            aria-describedby={describedBy}
            className={`${inputClass} ${border}`}
          />
        );
    }
  })();

  return (
    <div>
      {field.field_type !== "checkbox" && (
        <label htmlFor={field.field_key} className="block text-sm font-bold text-stone-900 mb-1">
          {field.label}
          {field.required && <span className="text-red-600"> *</span>}
        </label>
      )}
      {field.help_text && field.field_type !== "checkbox" && (
        <p className="text-xs text-stone-500 mb-1.5">{field.help_text}</p>
      )}
      {control}
      {field.help_text && field.field_type === "checkbox" && (
        <p className="text-xs text-stone-500 mt-1">{field.help_text}</p>
      )}
      {error && (
        <p id={`${field.field_key}-error`} className="text-xs font-semibold text-red-700 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
