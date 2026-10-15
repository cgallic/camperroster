"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import {
  emptyAnswers,
  expandRepeats,
  groupFieldsBySection,
  optionLabel,
  optionValue,
  validateSubmission,
  visibleFields,
  type AnswerValue,
  type FormAnswers,
  type FormAudience,
  type FormField,
} from "@/lib/forms";
import { formatCents } from "@/lib/pricing";

/** What the intake route returns when a family form became a household with an invoice. */
type Billing = { invoiceId: string; totalDueCents: number; uploadToken: string | null; camperCount: number };

const inputClass =
  "w-full rounded-xl border-2 border-stone-200 px-3 py-2.5 text-sm text-stone-900 focus:border-forest-400 focus:outline-none";

export default function PublicFormClient({
  formId,
  audience,
  token,
  fields,
  successText,
}: {
  formId: string;
  audience: FormAudience;
  token: string | null;
  fields: FormField[];
  successText?: string | null;
}) {
  const [answers, setAnswers] = useState<FormAnswers>(() => emptyAnswers(fields));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [billing, setBilling] = useState<Billing | null>(null);
  // One key per filled-in form: a double-click or a retry after a dropped
  // connection returns the household already created instead of a second one.
  const [requestKey] = useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  );

  // Repeated blocks (one per camper) are laid out from the current answers, so
  // changing "Number of Campers" adds or removes copies as the person types.
  const laidOut = useMemo(() => expandRepeats(fields, answers), [fields, answers]);
  const shownKeys = useMemo(
    () => new Set(visibleFields(laidOut, answers).map((f) => f.field_key)),
    [laidOut, answers]
  );
  const groups = useMemo(() => groupFieldsBySection(laidOut), [laidOut]);

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
        headers: { "Content-Type": "application/json", "Idempotency-Key": requestKey },
        body: JSON.stringify({ form_id: formId, audience, token, answers }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        if (body?.billing) setBilling(body.billing as Billing);
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
        <p className="text-stone-600 whitespace-pre-line text-left sm:text-center">
          {successText || "The camp office has your answers. Watch your email for the next step."}
        </p>
        {billing && <PaymentChoice billing={billing} />}
        <Link href="/" className="inline-block px-5 py-2.5 rounded-full bg-forest-800 text-white font-bold text-sm hover:bg-forest-900">
          Back to camp home
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {groups.map((group, gi) => {
        const shown = group.fields.filter((f) => shownKeys.has(f.field_key));
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
        {field.label && <h3 className="font-display font-black text-lg text-stone-900">{field.label}</h3>}
        {field.help_text && <p className="text-sm text-stone-600 mt-1 whitespace-pre-line">{field.help_text}</p>}
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
              <option key={optionValue(o)} value={optionValue(o)}>
                {optionLabel(o)}
              </option>
            ))}
          </select>
        );
      case "radio":
        return (
          <div role="radiogroup" aria-describedby={describedBy} className="space-y-2">
            {field.options.map((o) => (
              <label key={optionValue(o)} className="flex items-start gap-2 text-sm text-stone-800">
                <input
                  type="radio"
                  name={field.field_key}
                  value={optionValue(o)}
                  checked={String(value ?? "") === optionValue(o)}
                  onChange={() => onChange(optionValue(o))}
                  className="w-4 h-4 mt-0.5 shrink-0 accent-forest-800"
                />
                <span>{optionLabel(o)}</span>
              </label>
            ))}
          </div>
        );
      case "multiselect": {
        const chosen = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-1.5">
            {field.options.map((o) => {
              const v = optionValue(o);
              return (
                <label key={v} className="flex items-center gap-2 text-sm text-stone-800">
                  <input
                    type="checkbox"
                    checked={chosen.includes(v)}
                    onChange={(e) =>
                      onChange(e.target.checked ? [...chosen, v] : chosen.filter((c) => c !== v))
                    }
                    className="w-4 h-4 accent-forest-800"
                  />
                  {optionLabel(o)}
                </label>
              );
            })}
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
        return <DrawnSignature id={field.field_key} value={String(value ?? "")} onChange={onChange} describedBy={describedBy} />;
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
        <p className="text-xs text-stone-500 mb-1.5 whitespace-pre-line">{field.help_text}</p>
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

/**
 * Signature drawn with a finger or mouse, kept as a PNG data URL in the answer.
 * Typing a full name is the fallback for anyone who cannot draw (keyboard and
 * screen-reader users); the validator accepts either.
 */
function DrawnSignature({
  id,
  value,
  onChange,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (value: AnswerValue) => void;
  describedBy?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const drawn = value.startsWith("data:image/");

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const { x, y } = point(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1c1917";
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    const { x, y } = point(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) onChange(canvas.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    onChange("");
  };

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        id={id}
        width={600}
        height={160}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        aria-label="Signature pad: draw your signature"
        aria-describedby={describedBy}
        className="w-full h-40 rounded-xl border-2 border-dashed border-stone-300 bg-white touch-none cursor-crosshair"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={clear} className="text-xs font-bold text-stone-600 underline hover:text-stone-900">
          Clear signature
        </button>
        {drawn && <span className="text-xs font-semibold text-emerald-700">Signature captured</span>}
      </div>
      {!drawn && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Or type your full legal name"
          aria-label="Type your full legal name instead of drawing"
          className={`${inputClass} font-display italic`}
        />
      )}
    </div>
  );
}

/**
 * After a family registers: what the household owes, priced from the camp's
 * tiers, and the two ways to pay. Paying later (by check) needs nothing more
 * from the family; the office records the check against the invoice.
 */
function PaymentChoice({ billing }: { billing: Billing }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payNow = async () => {
    if (!billing.uploadToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${billing.uploadToken}` },
        body: JSON.stringify({ invoiceId: billing.invoiceId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.checkoutUrl) throw new Error(body.error ?? "Online payment is unavailable right now.");
      window.location.assign(body.checkoutUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Online payment is unavailable right now.");
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-stone-200 bg-stone-50 p-5 text-left space-y-3">
      <p className="text-sm text-stone-700">
        Tuition for {billing.camperCount} {billing.camperCount === 1 ? "camper" : "campers"}:{" "}
        <span className="font-black text-stone-900">{formatCents(billing.totalDueCents)}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {billing.uploadToken && billing.totalDueCents > 0 && (
          <button
            type="button"
            onClick={payNow}
            disabled={loading}
            className="px-5 py-2.5 rounded-full bg-forest-800 text-white font-bold text-sm hover:bg-forest-900 disabled:opacity-50"
          >
            {loading ? "Opening secure checkout…" : "Pay online now"}
          </button>
        )}
      </div>
      <p className="text-xs text-stone-600">
        Pay later: you can leave this page now and pay by check. Nothing more is needed here.
      </p>
      {error && <p className="text-xs font-semibold text-red-700">{error}</p>}
    </div>
  );
}
