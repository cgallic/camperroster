/**
 * Insurance card intake.
 *
 * The camp's complaint: half the uploaded insurance cards are one side only, or
 * a screenshot of something unreadable, and nobody finds out until a nurse
 * needs the group number. So this module is deliberately strict — an upload
 * that does not satisfy the rule is REJECTED, never quietly accepted:
 *
 *   - both sides must be present (two images), or a single PDF the family
 *     already assembled;
 *   - each file's type is decided by its MAGIC BYTES, not by the declared MIME
 *     type or the extension, both of which a client controls;
 *   - each file must be within the size cap and have sane pixel dimensions;
 *   - the two images are combined into ONE two-page PDF, front then back, so
 *     the record can never again hold half a card.
 */

import { buildImagePdf, decodeImage, type RasterImage } from "./pdf";

/** Per-file cap. Phone photos of a card land well under this. */
export const MAX_FILE_BYTES = 12 * 1024 * 1024;
/** A card photographed at fewer pixels than this is not going to be readable. */
export const MIN_IMAGE_EDGE = 300;

export type DetectedKind = "jpeg" | "png" | "pdf" | "unknown";

/** Sniffs the real format. Never trust `file.type` — the browser sends what it is told. */
export function sniffKind(buf: Buffer): DetectedKind {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (
    buf.length >= 8 &&
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return "png";
  }
  if (buf.length >= 5 && buf.subarray(0, 5).toString("latin1") === "%PDF-") return "pdf";
  return "unknown";
}

/** A PDF we accept has to actually terminate — a truncated scan is a rejection. */
function looksLikeCompletePdf(buf: Buffer): boolean {
  const tail = buf.subarray(Math.max(0, buf.length - 2048)).toString("latin1");
  return tail.includes("%%EOF");
}

export type InsuranceInput = {
  front?: { bytes: Buffer; declaredType?: string | null; filename?: string | null } | null;
  back?: { bytes: Buffer; declaredType?: string | null; filename?: string | null } | null;
  /** A pre-assembled PDF covering both sides. */
  pdf?: { bytes: Buffer; declaredType?: string | null; filename?: string | null } | null;
};

export type InsuranceResult =
  | { ok: true; bytes: Buffer; contentType: "application/pdf"; pages: number; notes: string[] }
  | { ok: false; errors: string[] };

function checkOneImage(
  label: "front" | "back",
  file: { bytes: Buffer; declaredType?: string | null },
  errors: string[],
): RasterImage | null {
  if (file.bytes.length === 0) {
    errors.push(`The ${label} of the card is empty.`);
    return null;
  }
  if (file.bytes.length > MAX_FILE_BYTES) {
    errors.push(
      `The ${label} of the card is ${(file.bytes.length / 1024 / 1024).toFixed(1)} MB; the limit is ${
        MAX_FILE_BYTES / 1024 / 1024
      } MB.`,
    );
    return null;
  }

  const kind = sniffKind(file.bytes);
  if (kind !== "jpeg" && kind !== "png") {
    errors.push(
      `The ${label} of the card is not a JPEG or PNG image` +
        (file.declaredType ? ` (it was sent as "${file.declaredType}").` : "."),
    );
    return null;
  }

  const image = decodeImage(file.bytes);
  if (!image) {
    errors.push(
      `The ${label} of the card could not be read. Re-take the photo, or save it as a standard ` +
        `8-bit JPEG or PNG.`,
    );
    return null;
  }
  if (image.width < MIN_IMAGE_EDGE || image.height < MIN_IMAGE_EDGE) {
    errors.push(
      `The ${label} of the card is only ${image.width}x${image.height} pixels — too small to read. ` +
        `Photograph the card filling the frame.`,
    );
    return null;
  }
  return image;
}

/**
 * Validates an insurance card upload and returns the single PDF to store.
 * Returns every problem at once, so the family fixes them in one pass.
 */
export function prepareInsuranceCard(input: InsuranceInput): InsuranceResult {
  const errors: string[] = [];
  const notes: string[] = [];

  if (input.pdf && input.pdf.bytes.length > 0) {
    const { bytes, declaredType } = input.pdf;
    if (bytes.length > MAX_FILE_BYTES) {
      errors.push(`The PDF is larger than the ${MAX_FILE_BYTES / 1024 / 1024} MB limit.`);
    }
    if (sniffKind(bytes) !== "pdf") {
      errors.push(
        `That file is not a PDF` + (declaredType ? ` (it was sent as "${declaredType}").` : "."),
      );
    } else if (!looksLikeCompletePdf(bytes)) {
      errors.push("That PDF looks truncated — re-export it and upload again.");
    }
    if (errors.length) return { ok: false, errors };
    notes.push(
      "Accepted a family-supplied PDF. Confirm on review that BOTH sides of the card are in it.",
    );
    return { ok: true, bytes, contentType: "application/pdf", pages: 0, notes };
  }

  const hasFront = !!input.front && input.front.bytes.length > 0;
  const hasBack = !!input.back && input.back.bytes.length > 0;
  if (!hasFront) errors.push("The front of the insurance card is missing.");
  if (!hasBack) errors.push("The back of the insurance card is missing.");
  if (errors.length) {
    errors.push("Both sides are required — the group and claims numbers are usually on the back.");
    return { ok: false, errors };
  }

  const front = checkOneImage("front", input.front!, errors);
  const back = checkOneImage("back", input.back!, errors);
  if (!front || !back || errors.length) return { ok: false, errors };

  let bytes: Buffer;
  try {
    bytes = buildImagePdf([front, back]);
  } catch {
    return { ok: false, errors: ["Could not combine the two sides into a PDF. Try re-uploading."] };
  }

  return { ok: true, bytes, contentType: "application/pdf", pages: 2, notes };
}

/**
 * General-purpose check for every other document (medical forms, VIRTUS
 * certificates, background checks). Same magic-byte discipline, but a single
 * file is fine.
 */
export function validateGenericUpload(
  bytes: Buffer,
  declaredType?: string | null,
): { ok: true; contentType: string } | { ok: false; errors: string[] } {
  if (bytes.length === 0) return { ok: false, errors: ["The file is empty."] };
  if (bytes.length > MAX_FILE_BYTES) {
    return { ok: false, errors: [`The file is larger than the ${MAX_FILE_BYTES / 1024 / 1024} MB limit.`] };
  }
  const kind = sniffKind(bytes);
  if (kind === "unknown") {
    return {
      ok: false,
      errors: [
        `Only PDF, JPEG and PNG files are accepted` +
          (declaredType ? ` (this one was sent as "${declaredType}").` : "."),
      ],
    };
  }
  if (kind === "pdf" && !looksLikeCompletePdf(bytes)) {
    return { ok: false, errors: ["That PDF looks truncated — re-export it and upload again."] };
  }
  return {
    ok: true,
    contentType: kind === "pdf" ? "application/pdf" : kind === "png" ? "image/png" : "image/jpeg",
  };
}
