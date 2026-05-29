import { PDFDocument } from "pdf-lib";

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg"]);
const PDF_TYPE = "application/pdf";

async function anexoComoPaginasPdf(anexo: Buffer, mime: string): Promise<PDFDocument> {
  if (mime === PDF_TYPE) {
    return PDFDocument.load(anexo);
  }

  if (!IMAGE_TYPES.has(mime)) {
    throw new Error("Formato no soportado. Use PDF, PNG o JPG.");
  }

  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  const bytes = new Uint8Array(anexo);
  const image =
    mime === "image/png" ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
  const maxW = page.getWidth() - 80;
  const maxH = page.getHeight() - 120;
  const scale = Math.min(maxW / image.width, maxH / image.height, 1);
  const w = image.width * scale;
  const h = image.height * scale;
  page.drawImage(image, {
    x: (page.getWidth() - w) / 2,
    y: page.getHeight() - h - 60,
    width: w,
    height: h
  });
  page.drawText("Anexo", { x: 40, y: page.getHeight() - 40, size: 12 });
  return doc;
}

/** Añade las páginas del anexo al final del certificado PDF. */
export async function mergeCertificadoConAnexo(
  certificadoPdf: Buffer,
  anexo: Buffer,
  mime: string
): Promise<Buffer> {
  const principal = await PDFDocument.load(certificadoPdf);
  const anexoDoc = await anexoComoPaginasPdf(anexo, mime);
  const paginas = await principal.copyPages(anexoDoc, anexoDoc.getPageIndices());
  for (const p of paginas) principal.addPage(p);
  return Buffer.from(await principal.save());
}

export function mimeAnexoFromFile(file: { type: string; name: string }): string {
  const t = file.type?.trim().toLowerCase();
  if (t) return t;
  const n = file.name.toLowerCase();
  if (n.endsWith(".pdf")) return PDF_TYPE;
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  return "";
}

export function validarAnexoObligatorio(
  tipo: string,
  file: { size: number; type: string; name: string } | null | undefined
): string | null {
  if (tipo !== "enfermedad") return null;
  if (!file || file.size === 0) {
    return "Para cita médica debes adjuntar el certificado o documento de respaldo (PDF, PNG o JPG).";
  }
  const mime = mimeAnexoFromFile(file);
  if (mime !== PDF_TYPE && !IMAGE_TYPES.has(mime)) {
    return "El anexo debe ser PDF, PNG o JPG.";
  }
  return null;
}

export function validarAnexoOpcional(file: { size: number; type: string; name: string } | null | undefined): string | null {
  if (!file || file.size === 0) return null;
  const mime = mimeAnexoFromFile(file);
  if (mime !== PDF_TYPE && !IMAGE_TYPES.has(mime)) {
    return "El archivo adjunto debe ser PDF, PNG o JPG.";
  }
  return null;
}
