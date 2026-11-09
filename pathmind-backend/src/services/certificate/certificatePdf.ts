/**
 * Minimal PDF writer for completion certificates.
 *
 * A one-page, text-and-rectangles certificate does not justify a PDF
 * dependency: it needs no image decoding, no font embedding (the Base-14
 * fonts are built into every reader) and no layout engine. Emitting the file
 * directly keeps the dependency surface at zero and makes the output
 * byte-deterministic, which matters because the serial printed here is what a
 * certificate is verified against.
 *
 * Structure is a flat PDF 1.4: catalog -> pages -> one page -> content stream,
 * plus two Base-14 font objects, closed by a correct xref table. The xref
 * offsets must be exact byte positions, so the file is assembled through a
 * buffer list that tracks lengths as it goes rather than by string
 * concatenation after the fact.
 */

export interface CertificatePdfInput {
  recipientName: string;
  topic: string;
  stagesCompleted: number;
  issuedAt: Date;
  serial: string;
}

/** A4 landscape, in PDF points (1/72 inch). */
const PAGE_W = 841.89;
const PAGE_H = 595.28;

/** Brand orange, as PDF's 0–1 RGB. Mirrors --color-accent (249 115 22). */
const ACCENT = "0.976 0.451 0.086";

/**
 * Escapes a string for a PDF literal. Unescaped parentheses or backslashes
 * terminate the string early and corrupt the whole content stream, so this is
 * not optional cosmetics.
 */
function pdfText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/**
 * Drops characters the Base-14 WinAnsi encoding cannot represent. A learner's
 * name may contain anything; silently emitting invalid bytes would produce a
 * file that some readers reject, so unsupported characters are replaced rather
 * than passed through.
 */
function toWinAnsi(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[^\x20-\x7E\xA0-\xFF]/g, "");
}

function centeredText(text: string, font: string, size: number, y: number, color: string): string {
  // Base-14 Helvetica averages ~0.5em per glyph and bold ~0.55em. This is an
  // approximation, not metrics — good enough to centre a heading, and it keeps
  // the writer free of an AFM width table.
  const perChar = font === "F2" ? 0.55 : 0.5;
  const width = text.length * size * perChar;
  const x = (PAGE_W - width) / 2;
  return [
    "BT",
    `${color} rg`,
    `/${font} ${size} Tf`,
    `${x.toFixed(2)} ${y.toFixed(2)} Td`,
    `(${pdfText(text)}) Tj`,
    "ET",
  ].join("\n");
}

function buildContentStream(input: CertificatePdfInput): string {
  const issued = input.issuedAt.toISOString().slice(0, 10);
  const stageLabel = `${input.stagesCompleted} ${input.stagesCompleted === 1 ? "stage" : "stages"}`;

  return [
    // Near-black page, matching the product's dark canvas.
    "0.004 0.004 0.012 rg",
    `0 0 ${PAGE_W} ${PAGE_H} re f`,

    // Accent frame.
    `${ACCENT} RG`,
    "2 w",
    `24 24 ${(PAGE_W - 48).toFixed(2)} ${(PAGE_H - 48).toFixed(2)} re S`,
    "0.5 w",
    `34 34 ${(PAGE_W - 68).toFixed(2)} ${(PAGE_H - 68).toFixed(2)} re S`,

    centeredText("VIDHYORA", "F2", 13, PAGE_H - 92, ACCENT),
    centeredText("CERTIFICATE OF COMPLETION", "F2", 27, PAGE_H - 150, "1 1 1"),

    centeredText("This certifies that", "F1", 13, PAGE_H - 206, "0.62 0.65 0.70"),
    centeredText(toWinAnsi(input.recipientName), "F2", 34, PAGE_H - 262, ACCENT),

    centeredText("has completed the learning roadmap", "F1", 13, PAGE_H - 312, "0.62 0.65 0.70"),
    centeredText(toWinAnsi(input.topic), "F2", 22, PAGE_H - 358, "1 1 1"),

    centeredText(`${stageLabel} completed`, "F1", 12, PAGE_H - 398, "0.62 0.65 0.70"),

    // Signature rules.
    `${ACCENT} RG`,
    "1 w",
    `120 ${(PAGE_H - 470).toFixed(2)} m 320 ${(PAGE_H - 470).toFixed(2)} l S`,
    `${(PAGE_W - 320).toFixed(2)} ${(PAGE_H - 470).toFixed(2)} m ${(PAGE_W - 120).toFixed(2)} ${(PAGE_H - 470).toFixed(2)} l S`,

    "BT",
    "0.62 0.65 0.70 rg",
    "/F1 10 Tf",
    `140 ${(PAGE_H - 486).toFixed(2)} Td`,
    `(Issued ${pdfText(issued)}) Tj`,
    "ET",

    "BT",
    "0.62 0.65 0.70 rg",
    "/F1 10 Tf",
    `${(PAGE_W - 305).toFixed(2)} ${(PAGE_H - 486).toFixed(2)} Td`,
    `(Serial ${pdfText(input.serial)}) Tj`,
    "ET",

    centeredText("Verify this certificate with the serial above.", "F1", 9, 54, "0.40 0.43 0.48"),
  ].join("\n");
}

/** Renders the certificate as a complete PDF file. */
export function renderCertificatePdf(input: CertificatePdfInput): Buffer {
  const content = buildContentStream(input);

  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W.toFixed(2)} ${PAGE_H.toFixed(
      2
    )}] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>`,
    `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
  ];

  const chunks: Buffer[] = [];
  let offset = 0;
  const push = (text: string) => {
    const buf = Buffer.from(text, "latin1");
    chunks.push(buf);
    offset += buf.length;
  };

  push("%PDF-1.4\n");
  // A binary comment marks the file as containing 8-bit data, which stops some
  // transports from mangling it as text.
  push("%\xE2\xE3\xCF\xD3\n");

  const xref: number[] = [];
  objects.forEach((body, i) => {
    xref.push(offset);
    push(`${i + 1} 0 obj\n${body}\nendobj\n`);
  });

  const xrefStart = offset;
  const count = objects.length + 1;
  let table = `xref\n0 ${count}\n0000000000 65535 f \n`;
  for (const pos of xref) {
    table += `${pos.toString().padStart(10, "0")} 00000 n \n`;
  }
  push(table);
  push(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`);

  return Buffer.concat(chunks);
}
