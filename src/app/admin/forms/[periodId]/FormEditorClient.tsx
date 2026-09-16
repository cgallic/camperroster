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
import { Badge, Button, Notice, Panel } from "@/components/ui";
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
  "w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-900 focus:border-forest-600 focus:outline-none";
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
      {notice && <Notice tone={notice.ok ? "ok" : "error"}>{notice.message}</Notice>}

      {/* WINDOW + VISIBILITY */}
      <Panel title="When families can fill this out">
        <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
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
          <Button type="button" variant="primary" onClick={handleSettings} disabled={pending}>
            Save window
          </Button>
          <Button type="button" variant="secondary" onClick={() => handleToken(false)} disabled={pending}>
            <Link2 className="h-3.5 w-3.5" />
            {period.access_token ? "Rotate private link" : "Generate private link"}
          </Button>
          {period.access_token && (
            <Button type="button" variant="quiet" onClick={() => handleToken(true)} disabled={pending}>
              Retire link
            </Button>
          )}
          <a
            href={publicPath}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50"
          >
            <Eye className="h-3.5 w-3.5" />
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
          <p className="text-xs font-semibold text-sun-600">
            Link-only forms need a token. Generate one, or nobody can reach this form.
          </p>
        )}
        </div>
      </Panel>

      {/* FORM META */}
      <Panel
        title="The form"
        actions={
          <>
            {liveVersion && <Badge tone="complete">Live v{liveVersion.version}</Badge>}
            {workingVersion && (
              <Badge>
                Editing v{workingVersion.version}
                {workingVersion.isDraft ? " draft" : " (published)"}
              </Badge>
            )}
          </>
        }
      >
        <div className="space-y-4">
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
        </div>
      </Panel>

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

        <Button type="button" variant="primary" onClick={addField}>
          <Plus className="h-4 w-4" />
          Add question
        </Button>
      </section>

      <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-stone-200 bg-white/90 py-3 backdrop-blur">
        <Button type="button" variant="secondary" onClick={() => handleSave(false)} disabled={pending}>
          <Save className="h-4 w-4" />
          Save draft
        </Button>
        <Button type="button" variant="primary" onClick={() => handleSave(true)} disabled={pending}>
          {liveVersion ? "Save & publish new version" : "Publish"}
        </Button>
        {liveVersion && (
          <Button
            type="button"
            variant="quiet"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await unpublishForm(period.id, liveVersion.id);
                setNotice(result);
                if (result.ok) router.refresh();
              })
            }
          >
            Unpublish live form
          </Button>
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
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
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
            <Badge>{field.field_type}</Badge>
            {field.required && <Badge tone="overdue">required</Badge>}
            {field.visible_when && <Badge tone="pending">conditional</Badge>}
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
          <button type="button" onClick={onDelete} className="rounded-lg p-1.5 text-alert-red hover:bg-alert-red-bg" aria-label="Delete question">
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
    <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
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
