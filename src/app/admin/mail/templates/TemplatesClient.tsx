"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type TemplateRow = {
  id: string;
  code: string;
  name: string;
  subject: string;
  body: string;
  mergeKeys: string[];
  updatedAt: string | null;
};

type Draft = { name: string; subject: string; body: string; mergeKeys: string };

export default function TemplatesClient({
  templates,
  missingStandard,
}: {
  templates: TemplateRow[];
  missingStandard: { code: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(templates[0]?.id ?? null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  const draftOf = (t: TemplateRow): Draft =>
    drafts[t.id] ?? {
      name: t.name,
      subject: t.subject,
      body: t.body,
      mergeKeys: t.mergeKeys.join(", "),
    };

  const setDraft = (t: TemplateRow, patch: Partial<Draft>) =>
    setDrafts({ ...drafts, [t.id]: { ...draftOf(t), ...patch } });

  const save = async (t: TemplateRow) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const draft = draftOf(t);
      const res = await fetch("/api/mail/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: t.id,
          code: t.code,
          name: draft.name,
          subject: draft.subject,
          body: draft.body,
          mergeKeys: draft.mergeKeys.split(",").map((k) => k.trim()).filter(Boolean),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Could not save that template");
      setNotice(`Saved "${draft.name}".`);
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const seed = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/mail/templates?seed=1", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Could not add the standard templates");
      setNotice(
        json.inserted?.length ? `Added ${json.inserted.length} standard template(s).` : "Nothing was missing."
      );
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const disabled = busy || pending;

  return (
    <main className="py-8 lg:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="font-mono text-[10px] font-bold uppercase text-forest-800 bg-forest-50 px-2.5 py-1 rounded-full border border-forest-100">
              Templates
            </span>
            <h1 className="font-display font-black text-3xl text-stone-900 mt-2">Standard Letters</h1>
            <p className="text-xs text-stone-500 mt-1 max-w-2xl">
              Wording for every letter the camp sends. Placeholders look like{" "}
              <code className="font-mono text-[11px]">{"{{camper_name}}"}</code> and are filled in when a draft is
              built. Anything left unfilled stays visible in the draft so a reviewer catches it.
            </p>
          </div>
          <Link href="/admin/mail" className="text-xs font-semibold text-forest-800 underline underline-offset-2">
            Back to the queue
          </Link>
        </div>

        {error && (
          <div className="rounded-xl border border-alert-red-border bg-alert-red-bg px-4 py-3 text-sm text-alert-red">{error}</div>
        )}
        {notice && (
          <div className="rounded-xl border border-forest-100 bg-forest-50 px-4 py-3 text-sm text-forest-800">{notice}</div>
        )}

        {missingStandard.length > 0 && (
          <div className="rounded-2xl border border-sun-100 bg-sun-50 p-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-stone-700">
              {missingStandard.length} standard letter{missingStandard.length === 1 ? " is" : "s are"} not yet stored
              for this camp: {missingStandard.map((t) => t.name).join(", ")}.
            </p>
            <button
              disabled={disabled}
              onClick={seed}
              className="rounded-lg bg-sun-600 px-4 py-2 text-sm font-bold text-white hover:bg-sun-500 disabled:opacity-40"
            >
              Add them
            </button>
          </div>
        )}

        <div className="space-y-3">
          {templates.map((t) => {
            const draft = draftOf(t);
            const open = openId === t.id;
            return (
              <article key={t.id} className="rounded-2xl border border-stone-200 bg-white p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="font-display font-bold text-base text-stone-900">{t.name}</h2>
                    <p className="font-mono text-[10px] uppercase text-stone-500 mt-0.5">{t.code}</p>
                  </div>
                  <button
                    onClick={() => setOpenId(open ? null : t.id)}
                    className="text-xs font-semibold text-forest-800 underline underline-offset-2"
                  >
                    {open ? "Close" : "Edit"}
                  </button>
                </div>

                {open && (
                  <div className="space-y-3">
                    <label className="block">
                      <span className="font-mono text-[10px] font-bold uppercase text-stone-500">Name</span>
                      <input
                        value={draft.name}
                        onChange={(e) => setDraft(t, { name: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="block">
                      <span className="font-mono text-[10px] font-bold uppercase text-stone-500">Subject</span>
                      <input
                        value={draft.subject}
                        onChange={(e) => setDraft(t, { subject: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="block">
                      <span className="font-mono text-[10px] font-bold uppercase text-stone-500">Body</span>
                      <textarea
                        value={draft.body}
                        rows={16}
                        onChange={(e) => setDraft(t, { body: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm leading-relaxed"
                      />
                    </label>
                    <label className="block">
                      <span className="font-mono text-[10px] font-bold uppercase text-stone-500">
                        Merge keys (comma separated)
                      </span>
                      <input
                        value={draft.mergeKeys}
                        onChange={(e) => setDraft(t, { mergeKeys: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm font-mono text-xs"
                      />
                    </label>
                    <button
                      disabled={disabled}
                      onClick={() => save(t)}
                      className="rounded-lg bg-forest-800 px-4 py-2 text-sm font-bold text-white hover:bg-forest-900 disabled:opacity-40"
                    >
                      Save template
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
