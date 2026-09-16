"use client";

import { useMemo, useState } from "react";

/**
 * Typed-name e-signature.
 *
 * The statement is displayed in full and posted back verbatim with the
 * signature, so the server can store both the wording and its SHA-256. Editing
 * the waiver tomorrow does not change what this person signed today.
 */
export default function SignaturePad({
  recordId,
  registrationId,
  statement,
  documentName,
  defaultSignerName = "",
  onSigned,
}: {
  recordId: string;
  registrationId?: string;
  statement: string;
  documentName: string;
  defaultSignerName?: string;
  onSigned?: (result: { signatureId: string; signedAt: string; statementSha256: string }) => void;
}) {
  const [signerName, setSignerName] = useState(defaultSignerName);
  const [typed, setTyped] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signed, setSigned] = useState<{ signedAt: string; statementSha256: string } | null>(null);

  const matches = useMemo(
    () => typed.trim().length > 1 && typed.trim().toLowerCase() === signerName.trim().toLowerCase(),
    [typed, signerName],
  );
  const canSign = agreed && matches && !busy;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/documents/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId,
          registrationId,
          // Verbatim — the hash on the server must cover exactly this text.
          statement,
          signerName: signerName.trim(),
          typedConfirmation: typed.trim(),
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "That signature could not be recorded.");
        return;
      }
      setSigned({ signedAt: body.signedAt, statementSha256: body.statementSha256 });
      onSigned?.(body);
    } catch {
      setError("Network problem — nothing was recorded. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (signed) {
    return (
      <div className="rounded-2xl border border-forest-100 bg-forest-50 p-5">
        <h3 className="font-display font-bold text-forest-800">{documentName} signed</h3>
        <p className="mt-1 text-sm text-stone-600">
          Signed by {signerName} on {new Date(signed.signedAt).toLocaleString()}.
        </p>
        <p className="mt-2 font-mono text-[10px] text-stone-500 break-all">
          Statement fingerprint {signed.statementSha256}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <h3 className="font-display font-bold text-stone-900">{documentName}</h3>

      <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm leading-relaxed text-stone-700 whitespace-pre-wrap">
        {statement}
      </div>

      <label className="mt-4 flex items-start gap-2.5 text-sm text-stone-700">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-stone-300 text-forest-700 focus:ring-forest-600"
        />
        <span>I have read the statement above and I agree to it on behalf of my household.</span>
      </label>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-stone-500">
            Your full legal name
          </label>
          <input
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-forest-600 focus:outline-none focus:ring-1 focus:ring-forest-600"
            placeholder="Dana Whitfield"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-stone-500">
            Type it again to sign
          </label>
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-display text-lg italic focus:border-forest-600 focus:outline-none focus:ring-1 focus:ring-forest-600"
            placeholder="Dana Whitfield"
          />
        </div>
      </div>

      {typed.trim().length > 1 && !matches && (
        <p className="mt-2 text-xs text-alert-red">The typed signature has to match the name above exactly.</p>
      )}
      {error && (
        <p className="mt-3 rounded-lg border border-alert-red-border bg-alert-red-bg px-3 py-2 text-sm text-alert-red">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={!canSign}
        onClick={submit}
        className="mt-4 rounded-full bg-forest-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-forest-700 disabled:cursor-not-allowed disabled:bg-stone-300"
      >
        {busy ? "Recording…" : "Sign and submit"}
      </button>
      <p className="mt-2 text-[11px] text-stone-500">
        We record the exact wording you agreed to, the time, and the device you signed from.
      </p>
    </div>
  );
}
