"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  Link2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import {
  CONDITION_OPS,
  FIELD_TYPES,
  OP_LABELS,
  UNARY_OPS,
  VISIBILITIES,
  slugifyKey,
  type ConditionOp,
  type FieldType,
  type FormField,
  type PeriodVisibility,
  type RegistrationPeriod,
  type VisibleWhen,
} from "@/lib/forms";
import { rotateAccessToken, savePeriodSettings, saveForm, unpublishForm, type FieldDraft } from "../actions";

type EditorField = FieldDraft & { uid: string; open: boolean };

let uidSeq = 0;
const nextUid = () => `f${Date.now().toString(36)}_${uidSeq++}`;

const OPTION_TYPES: FieldType[] = ["select", "multiselect"];

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const inputClass =
  "w-full rounded-xl border-2 border-stone-200 px-3 py-2 text-sm text-stone-900 focus:border-forest-400 focus:outline-none";
const labelClass = "block text-[11px] font-bold uppercase tracking-wide text-stone-500 mb-1";

export default function FormEditorClient({
  period,
  liveVersion,
  workingVersion,
  initialTitle,
  initialIntro,
  initialFields,
}: {
  period: RegistrationPeriod;
  liveVersion: { id: string; version: number; published_at: string | null } | null;
  workingVersion: { id: string; version: number; isDraft: boolean } | null;
  initialTitle: string;
  initialIntro: string;
  initialFields: FormField[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);

  const [title, setTitle] = useState(initialTitle);
  const [intro, setIntro] = useState(initialIntro ?? "");
  const [fields, setFields] = useState<EditorField[]>(() =>
    initialFields.map((f) => ({
      uid: nextUid(),
      open: false,
      field_key: f.field_key,
      label: f.label,
      help_text: f.help_text,
      field_type: f.field_type,
      required: f.required,
      options: Array.isArray(f.options) ? (f.options as string[]) : [],
      visible_when: (f.visible_when as VisibleWhen | null) ?? null,
      section: f.section,
    }))
  );

  const [opensAt, setOpensAt] = useState(toLocalInput(period.opens_at));
  const [closesAt, setClosesAt] = useState(toLocalInput(period.closes_at));
  const [visibility, setVisibility] = useState<PeriodVisibility>(period.visibility);
  const [token, setToken] = useState(period.access_token);

  const publicPath = useMemo(() => {
    const base = `/register/${period.audience}`;
    return visibility === "link_only" && token ? `${base}?token=${token}` : base;
  }, [period.audience, visibility, token]);

  const publicUrl = typeof window === "undefined" ? publicPath : `${window.location.origin}${publicPath}`;

  const patch = (uid: string, changes: Partial<EditorField>) =>
    setFields((prev) => prev.map((f) => (f.uid === uid ? { ...f, ...changes } : f)));

  const move = (index: number, delta: number) =>
    setFields((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const addField = () =>
    setFields((prev) => [
      ...prev,
      {
        uid: nextUid(),
        open: true,
        field_key: "",
        label: "",
        help_text: null,
        field_type: "text",
        required: false,
        options: [],
        visible_when: null,
        section: prev[prev.length - 1]?.section ?? null,
      },
    ]);

  const handleSave = (publish: boolean) =>
    startTransition(async () => {
      const payload: FieldDraft[] = fields.map((f) => ({
        field_key: f.field_key.trim() || slugifyKey(f.label),
        label: f.label,
        help_text: f.help_text,
        field_type: f.field_type,
        required: f.required,
        options: f.options,
        visible_when: f.visible_when,
        section: f.section,
      }));
      const result = await saveForm({
        periodId: period.id,
        title,
        introText: intro,
        fields: payload,
        publish,
      });
      setNotice(result);
      if (result.ok) router.refresh();
    });

  const handleSettings = () =>
    startTransition(async () => {
      const result = await savePeriodSettings({
        periodId: period.id,
        opensAt: fromLocalInput(opensAt),
        closesAt: fromLocalInput(closesAt),
        visibility,
      });
      setNotice(result);
      if (result.ok) router.refresh();
    });

  const handleToken = (clear: boolean) =>
    startTransition(async () => {
      const result = await rotateAccessToken(period.id, clear);
      setNotice(result);
      if (result.ok) router.refresh();
      // Optimistic: the refreshed server props will replace this on the next render pass.
      if (result.ok) setToken(clear ? null : "generating…");
    });

  return (
    <div className="space-y-6">
      {notice && (
        <div
          className={`rounded-2xl border-2 px-4 py-3 text-sm font-semibold ${
            notice.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          {notice.message}
        </div>
      )}

      {/* WINDOW + VISIBILITY */}
      <section className="bg-white rounded-3xl border-2 border-stone-200 p-5 sm:p-6 space-y-4">
        <h2 className="font-display font-black text-xl text-stone-900">When families can fill this out</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Opens</label>
            <input type="datetime-local" value={opensAt} onChange={(e) => setOpensAt(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Closes</label>
            <input type="datetime-local" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Visibility</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as PeriodVisibility)}
              className={inputClass}
            >
              {VISIBILITIES.map((v) => (
                <option key={v} value={v}>
                  {v.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSettings}
            disabled={pending}
            className="px-4 py-2 rounded-full bg-forest-800 text-white font-bold text-xs hover:bg-forest-900 disabled:opacity-50"
          >
            Save window
          </button>
          <button
            type="button"
            onClick={() => handleToken(false)}
            disabled={pending}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-stone-100 text-stone-800 font-bold text-xs hover:bg-stone-200 disabled:opacity-50"
          >
            <Link2 className="w-3.5 h-3.5" />
            {period.access_token ? "Rotate private link" : "Generate private link"}
          </button>
          {period.access_token && (
            <button
              type="button"
              onClick={() => handleToken(true)}
              disabled={pending}
              className="px-4 py-2 rounded-full bg-stone-100 text-stone-800 font-bold text-xs hover:bg-stone-200 disabled:opacity-50"
            >
              Retire link
            </button>
          )}
          <a
            href={publicPath}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-stone-100 text-stone-800 font-bold text-xs hover:bg-stone-200"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </a>
        </div>

        {period.access_token && (
          <div className="flex items-center gap-2 rounded-xl bg-stone-50 border border-stone-200 px-3 py-2">
            <code className="font-mono text-[11px] text-stone-700 truncate">{publicUrl}</code>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(publicUrl)}
              className="ml-auto shrink-0 text-stone-500 hover:text-stone-800"
              aria-label="Copy link"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        )}
        {visibility === "link_only" && !period.access_token && (
          <p className="text-xs text-amber-800">
            Link-only forms need a token. Generate one, or nobody can reach this form.
          </p>
        )}
      </section>

      {/* FORM META */}
      <section className="bg-white rounded-3xl border-2 border-stone-200 p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display font-black text-xl text-stone-900">The form</h2>
          <div className="flex items-center gap-2">
            {liveVersion && (
              <span className="font-mono text-[10px] font-bold uppercase text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                Live v{liveVersion.version}
              </span>
            )}
            {workingVersion && (
              <span className="font-mono text-[10px] font-bold uppercase text-stone-700 bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-full">
                Editing v{workingVersion.version}
                {workingVersion.isDraft ? " draft" : " (published)"}
              </span>
            )}
          </div>
        </div>
        {workingVersion && !workingVersion.isDraft && (
          <p className="text-xs text-stone-600">
            This version is live. Saving creates version {workingVersion.version + 1} as a draft, leaving answers
            already collected against v{workingVersion.version} intact.
          </p>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Intro text</label>
            <input value={intro} onChange={(e) => setIntro(e.target.value)} className={inputClass} />
          </div>
        </div>
      </section>

      {/* FIELDS */}
      <section className="space-y-3">
        {fields.map((field, index) => (
          <FieldCard
            key={field.uid}
            field={field}
            index={index}
            total={fields.length}
            earlier={fields.slice(0, index)}
            onPatch={(changes) => patch(field.uid, changes)}
            onMove={(delta) => move(index, delta)}
            onDelete={() => setFields((prev) => prev.filter((f) => f.uid !== field.uid))}
          />
        ))}

        <button
          type="button"
          onClick={addField}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-forest-800 text-white font-bold text-xs hover:bg-forest-900"
        >
          <Plus className="w-4 h-4" />
          Add question
        </button>
      </section>

      <div className="sticky bottom-0 bg-white/90 backdrop-blur border-t border-stone-200 py-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleSave(false)}
          disabled={pending}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-stone-100 text-stone-800 font-bold text-sm hover:bg-stone-200 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          Save draft
        </button>
        <button
          type="button"
          onClick={() => handleSave(true)}
          disabled={pending}
          className="px-5 py-2.5 rounded-full bg-forest-800 text-white font-bold text-sm hover:bg-forest-900 disabled:opacity-50"
        >
          {liveVersion ? "Save & publish new version" : "Publish"}
        </button>
        {liveVersion && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await unpublishForm(period.id, liveVersion.id);
                setNotice(result);
                if (result.ok) router.refresh();
              })
            }
            className="px-5 py-2.5 rounded-full bg-stone-100 text-stone-800 font-bold text-sm hover:bg-stone-200 disabled:opacity-50"
          >
            Unpublish live form
          </button>
        )}
      </div>
    </div>
  );
}

function FieldCard({
  field,
  index,
  total,
  earlier,
  onPatch,
  onMove,
  onDelete,
}: {
  field: EditorField;
  index: number;
  total: number;
  earlier: EditorField[];
  onPatch: (changes: Partial<EditorField>) => void;
  onMove: (delta: number) => void;
  onDelete: () => void;
}) {
  const showOptions = OPTION_TYPES.includes(field.field_type);

  return (
    <div className="bg-white rounded-2xl border-2 border-stone-200 p-4">
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => onPatch({ open: !field.open })}
          className="mt-0.5 text-stone-500 hover:text-stone-800"
          aria-label={field.open ? "Collapse" : "Expand"}
        >
          {field.open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-stone-900 truncate">{field.label || "Untitled question"}</span>
            <span className="font-mono text-[10px] uppercase text-stone-600 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full">
              {field.field_type}
            </span>
            {field.required && (
              <span className="font-mono text-[10px] uppercase text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                required
              </span>
            )}
            {field.visible_when && (
              <span className="font-mono text-[10px] uppercase text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                conditional
              </span>
            )}
          </div>
          <p className="text-[11px] font-mono text-stone-500 mt-0.5 truncate">
            {field.field_key || "no key yet"}
            {field.section ? ` · ${field.section}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="p-1.5 rounded-lg hover:bg-stone-100 disabled:opacity-30" aria-label="Move up">
            <ArrowUp className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} className="p-1.5 rounded-lg hover:bg-stone-100 disabled:opacity-30" aria-label="Move down">
            <ArrowDown className="w-4 h-4" />
          </button>
          <button type="button" onClick={onDelete} className="p-1.5 rounded-lg text-red-700 hover:bg-red-50" aria-label="Delete question">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {field.open && (
        <div className="mt-4 space-y-4 border-t border-stone-200 pt-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Label</label>
              <input
                value={field.label}
                onChange={(e) => {
                  const label = e.target.value;
                  onPatch(field.field_key ? { label } : { label, field_key: slugifyKey(label) });
                }}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Key (stored with answers)</label>
              <input
                value={field.field_key}
                onChange={(e) => onPatch({ field_key: slugifyKey(e.target.value) })}
                className={`${inputClass} font-mono`}
              />
            </div>
            <div>
              <label className={labelClass}>Type</label>
              <select
                value={field.field_type}
                onChange={(e) => onPatch({ field_type: e.target.value as FieldType })}
                className={inputClass}
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Section</label>
              <input
                value={field.section ?? ""}
                onChange={(e) => onPatch({ section: e.target.value || null })}
                placeholder="e.g. Health"
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Help text</label>
              <input
                value={field.help_text ?? ""}
                onChange={(e) => onPatch({ help_text: e.target.value || null })}
                className={inputClass}
              />
            </div>
          </div>

          {field.field_type !== "section_heading" && (
            <label className="flex items-center gap-2 text-sm font-semibold text-stone-800">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => onPatch({ required: e.target.checked })}
                className="w-4 h-4 accent-forest-800"
              />
              Required
            </label>
          )}

          {showOptions && (
            <div>
              <label className={labelClass}>Options (one per line)</label>
              <textarea
                rows={4}
                value={field.options.join("\n")}
                onChange={(e) =>
                  onPatch({ options: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })
                }
                className={inputClass}
              />
            </div>
          )}

          <ConditionEditor
            value={field.visible_when}
            earlier={earlier}
            onChange={(visible_when) => onPatch({ visible_when })}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Conditional display, expressed as one sentence an admin can read back:
 * "Only show this when [earlier question] [operator] [value]". Only earlier
 * questions are offered, so a condition can never depend on an answer the
 * person has not been asked for yet.
 */
function ConditionEditor({
  value,
  earlier,
  onChange,
}: {
  value: VisibleWhen | null;
  earlier: EditorField[];
  onChange: (value: VisibleWhen | null) => void;
}) {
  const candidates = earlier.filter((f) => f.field_type !== "section_heading" && f.field_key);
  const enabled = Boolean(value);
  const target = candidates.find((f) => f.field_key === value?.field);
  const unary = value ? UNARY_OPS.includes(value.op) : false;

  return (
    <div className="rounded-2xl bg-stone-50 border border-stone-200 p-3 space-y-3">
      <label className="flex items-center gap-2 text-sm font-semibold text-stone-800">
        <input
          type="checkbox"
          checked={enabled}
          disabled={candidates.length === 0}
          onChange={(e) =>
            onChange(
              e.target.checked ? { field: candidates[0]?.field_key ?? "", op: "eq", value: "" } : null
            )
          }
          className="w-4 h-4 accent-forest-800"
        />
        Only show this question when…
      </label>
      {candidates.length === 0 && (
        <p className="text-xs text-stone-500">Move this question below another one to make it conditional.</p>
      )}

      {enabled && value && (
        <div className="grid sm:grid-cols-3 gap-2">
          <select
            value={value.field}
            onChange={(e) => onChange({ ...value, field: e.target.value })}
            className={inputClass}
          >
            {candidates.map((f) => (
              <option key={f.uid} value={f.field_key}>
                {f.label || f.field_key}
              </option>
            ))}
          </select>
          <select
            value={value.op}
            onChange={(e) => {
              const op = e.target.value as ConditionOp;
              onChange(
                UNARY_OPS.includes(op) ? { field: value.field, op } : { field: value.field, op, value: value.value ?? "" }
              );
            }}
            className={inputClass}
          >
            {CONDITION_OPS.map((op) => (
              <option key={op} value={op}>
                {OP_LABELS[op]}
              </option>
            ))}
          </select>
          {!unary &&
            (target && OPTION_TYPES.includes(target.field_type) && target.options.length && value.op !== "in" ? (
              <select
                value={String(value.value ?? "")}
                onChange={(e) => onChange({ ...value, value: e.target.value })}
                className={inputClass}
              >
                <option value="">— choose —</option>
                {target.options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={Array.isArray(value.value) ? value.value.join(", ") : String(value.value ?? "")}
                onChange={(e) =>
                  onChange({
                    ...value,
                    value:
                      value.op === "in"
                        ? e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                        : e.target.value,
                  })
                }
                placeholder={value.op === "in" ? "comma, separated, values" : "value"}
                className={inputClass}
              />
            ))}
        </div>
      )}
    </div>
  );
}
