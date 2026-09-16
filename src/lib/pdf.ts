/**
 * A deliberately tiny PDF writer.
 *
 * The camp wants an insurance card stored as ONE two-page PDF, front then back.
 * Pulling in a PDF library for that would mean touching package.json, which
 * another agent owns, so this module builds the file by hand. It supports
 * exactly what we need: a page per image, image drawn full-bleed on a
 * letter-sized page.
 *
 * JPEG bytes are embedded verbatim as a /DCTDecode stream (PDF speaks JPEG
 * natively). PNG is inflated, un-filtered and re-deflated as a raw
 * /FlateDecode RGB (or Gray) stream, because PDF cannot read the PNG container.
 */

import zlib from "node:zlib";

export type RasterImage = {
  /** Bytes of the stream as they go into the PDF. */
  data: Buffer;
  width: number;
  height: number;
  /** PDF filter name for the stream. */
  filter: "DCTDecode" | "FlateDecode";
  colorSpace: "DeviceRGB" | "DeviceGray";
  bitsPerComponent: number;
};

const PAGE_WIDTH = 612; // US Letter, 72dpi
const PAGE_HEIGHT = 792;

/* ------------------------------------------------------------------ JPEG -- */

/**
 * Reads width/height/components out of a JPEG's SOF marker. Also doubles as a
 * structural check: a file that claims to be a JPEG but has no frame header is
 * not a JPEG we can embed.
 */
export function readJpegInfo(buf: Buffer): { width: number; height: number; components: number } | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;

  let i = 2;
  while (i + 3 < buf.length) {
    if (buf[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = buf[i + 1];
    // Standalone markers carry no length.
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    if (marker === 0xd9) break;
    const length = buf.readUInt16BE(i + 2);
    // SOF0..SOF15, excluding the DHT/JPG/DAC markers that share the range.
    const isSof =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) {
      if (i + 9 >= buf.length) return null;
      return {
        height: buf.readUInt16BE(i + 5),
        width: buf.readUInt16BE(i + 7),
        components: buf[i + 9],
      };
    }
    i += 2 + length;
  }
  return null;
}

function jpegToImage(buf: Buffer): RasterImage | null {
  const info = readJpegInfo(buf);
  if (!info || !info.width || !info.height) return null;
  if (info.components !== 1 && info.components !== 3) return null; // CMYK scans are out of scope.
  return {
    data: buf,
    width: info.width,
    height: info.height,
    filter: "DCTDecode",
    colorSpace: info.components === 1 ? "DeviceGray" : "DeviceRGB",
    bitsPerComponent: 8,
  };
}

/* ------------------------------------------------------------------- PNG -- */

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

type PngHeader = { width: number; height: number; bitDepth: number; colorType: number; interlace: number };

export function readPngHeader(buf: Buffer): PngHeader | null {
  if (buf.length < 33 || !buf.subarray(0, 8).equals(PNG_MAGIC)) return null;
  if (buf.subarray(12, 16).toString("latin1") !== "IHDR") return null;
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    bitDepth: buf[24],
    colorType: buf[25],
    interlace: buf[28],
  };
}

function concatIdat(buf: Buffer): Buffer {
  const parts: Buffer[] = [];
  let offset = 8;
  while (offset + 8 <= buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.subarray(offset + 4, offset + 8).toString("latin1");
    const start = offset + 8;
    if (start + length > buf.length) break;
    if (type === "IDAT") parts.push(buf.subarray(start, start + length));
    if (type === "IEND") break;
    offset = start + length + 4; // skip CRC
  }
  return Buffer.concat(parts);
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

/**
 * Reverses the PNG per-scanline filters and drops any alpha channel (PDF would
 * need a separate soft mask; an insurance card does not need transparency).
 */
function pngToImage(buf: Buffer): RasterImage | null {
  const header = readPngHeader(buf);
  if (!header || !header.width || !header.height) return null;
  // Only the common case: 8-bit, non-interlaced, gray / RGB / gray+A / RGBA.
  if (header.bitDepth !== 8 || header.interlace !== 0) return null;
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[header.colorType];
  if (!channels) return null;

  let raw: Buffer;
  try {
    raw = zlib.inflateSync(concatIdat(buf));
  } catch {
    return null;
  }

  const { width, height } = header;
  const stride = width * channels;
  if (raw.length < height * (stride + 1)) return null;

  const out = Buffer.alloc(height * stride);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const cur = Buffer.alloc(stride);
    for (let x = 0; x < stride; x += 1) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev[x];
      const c = x >= channels ? prev[x - channels] : 0;
      const v = line[x];
      switch (filter) {
        case 0: cur[x] = v; break;
        case 1: cur[x] = (v + a) & 0xff; break;
        case 2: cur[x] = (v + b) & 0xff; break;
        case 3: cur[x] = (v + ((a + b) >> 1)) & 0xff; break;
        case 4: cur[x] = (v + paeth(a, b, c)) & 0xff; break;
        default: return null;
      }
    }
    cur.copy(out, y * stride);
    prev = cur;
  }

  const opaqueChannels = header.colorType === 4 ? 1 : header.colorType === 6 ? 3 : channels;
  let pixels = out;
  if (opaqueChannels !== channels) {
    pixels = Buffer.alloc(width * height * opaqueChannels);
    for (let p = 0; p < width * height; p += 1) {
      for (let c = 0; c < opaqueChannels; c += 1) {
        pixels[p * opaqueChannels + c] = out[p * channels + c];
      }
    }
  }

  return {
    data: zlib.deflateSync(pixels, { level: 6 }),
    width,
    height,
    filter: "FlateDecode",
    colorSpace: opaqueChannels === 1 ? "DeviceGray" : "DeviceRGB",
    bitsPerComponent: 8,
  };
}

/** Decodes a JPEG or PNG into something embeddable, or null if we cannot. */
export function decodeImage(buf: Buffer): RasterImage | null {
  if (buf.length > 1 && buf[0] === 0xff && buf[1] === 0xd8) return jpegToImage(buf);
  if (buf.length > 8 && buf.subarray(0, 8).equals(PNG_MAGIC)) return pngToImage(buf);
  return null;
}

/* --------------------------------------------------------------- Writing -- */

/** Fits an image inside the page with a small margin, preserving aspect ratio. */
function placement(image: RasterImage) {
  const margin = 24;
  const maxW = PAGE_WIDTH - margin * 2;
  const maxH = PAGE_HEIGHT - margin * 2;
  const scale = Math.min(maxW / image.width, maxH / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  return { w, h, x: (PAGE_WIDTH - w) / 2, y: (PAGE_HEIGHT - h) / 2 };
}

/**
 * Builds a PDF with one page per image, in order. Object numbering:
 * 1 = catalog, 2 = page tree, then three objects per page.
 */
export function buildImagePdf(images: RasterImage[]): Buffer {
  if (images.length === 0) throw new Error("buildImagePdf needs at least one image");

  const chunks: Buffer[] = [];
  const offsets: number[] = [0]; // index 0 is the free object
  let position = 0;

  const push = (b: Buffer) => {
    chunks.push(b);
    position += b.length;
  };
  const pushObject = (n: number, body: Buffer) => {
    offsets[n] = position;
    push(Buffer.concat([Buffer.from(`${n} 0 obj\n`, "latin1"), body, Buffer.from("\nendobj\n", "latin1")]));
  };

  push(Buffer.from("%PDF-1.4\n%\xe2\xe3\xcf\xd3\n", "latin1"));

  const pageIds = images.map((_, i) => 3 + i * 3);
  pushObject(1, Buffer.from("<< /Type /Catalog /Pages 2 0 R >>", "latin1"));
  pushObject(
    2,
    Buffer.from(
      `<< /Type /Pages /Count ${images.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] >>`,
      "latin1",
    ),
  );

  images.forEach((image, i) => {
    const pageId = pageIds[i];
    const contentId = pageId + 1;
    const imageId = pageId + 2;
    const { w, h, x, y } = placement(image);

    pushObject(
      pageId,
      Buffer.from(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
          `/Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`,
        "latin1",
      ),
    );

    const content = Buffer.from(
      `q\n${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm\n/Im0 Do\nQ\n`,
      "latin1",
    );
    pushObject(
      contentId,
      Buffer.concat([
        Buffer.from(`<< /Length ${content.length} >>\nstream\n`, "latin1"),
        content,
        Buffer.from("endstream", "latin1"),
      ]),
    );

    pushObject(
      imageId,
      Buffer.concat([
        Buffer.from(
          `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} ` +
            `/ColorSpace /${image.colorSpace} /BitsPerComponent ${image.bitsPerComponent} ` +
            `/Filter /${image.filter} /Length ${image.data.length} >>\nstream\n`,
          "latin1",
        ),
        image.data,
        Buffer.from("\nendstream", "latin1"),
      ]),
    );
  });

  const objectCount = 3 + images.length * 3;
  const xrefStart = position;
  let xref = `xref\n0 ${objectCount}\n0000000000 65535 f \n`;
  for (let n = 1; n < objectCount; n += 1) {
    xref += `${String(offsets[n] ?? 0).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${objectCount} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  push(Buffer.from(xref, "latin1"));

  return Buffer.concat(chunks);
}
