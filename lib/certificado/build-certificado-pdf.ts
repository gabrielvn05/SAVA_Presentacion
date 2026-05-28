import fs from "fs";
import path from "path";
import { PassThrough } from "stream";
import { buildOficioDocxBuffer } from "@/lib/certificado/build-oficio-docx";
import { convertDocxToPdf } from "@/lib/certificado/convert-docx-to-pdf";
import { FACULTAD_DEFAULT } from "@/lib/certificado/constants";
import { oficioExtractedMediaDir } from "@/lib/certificado/pack-oficio-template";
import { convertHtmlToPdf } from "@/lib/certificado/convert-html-to-pdf";
import { renderOficioHtml } from "@/lib/certificado/render-oficio-html";
import { buildOficioReplacements, type OficioDestinatario } from "@/lib/certificado/oficio-placeholders";

export type CertificadoTipo = "enfermedad" | "viaje" | "calamidad_domestica" | "falta_marcado";

export type BuildCertificadoInput = Readonly<{
  solicitante: { nombres: string; apellidos: string; email?: string | null };
  tipo: CertificadoTipo;
  tipo_personal?: import("@/lib/certificado/tipo-personal").TipoPersonal;
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string;
  detalle: Record<string, unknown>;
}>;

export type BuildPdfResult = Readonly<{
  buffer: Buffer;
  source: "libreoffice" | "playwright" | "pdfkit";
}>;

/** Márgenes alineados con la plantilla Word (sectPr en twips → pt). */
const PAGE_MARGINS = { top: 71, left: 85, right: 45, bottom: 71 };

function mediaPath(name: string) {
  const dir = oficioExtractedMediaDir();
  const candidates = [
    path.join(dir, name),
    path.join(dir, "image1.png"),
    path.join(process.cwd(), "public", "templates", "oficio-media", name)
  ];
  if (name === "logo-facultad.png") {
    candidates.unshift(path.join(dir, "image1.png"));
  }
  if (name === "marca-uleam.png") {
    candidates.unshift(path.join(dir, "image2.png"));
  }
  return candidates.find((p) => fs.existsSync(p)) ?? null;
}

function parrafo(doc: any, text: string) {
  if (!text.trim()) return;
  doc.font("Helvetica").fontSize(11).text(text, { align: "both", lineGap: 2 });
  doc.moveDown(0.55);
}

function drawEncabezadoInstitucional(doc: any) {
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const startY = doc.y;
  const logoPath = mediaPath("logo-facultad.png");
  const marcaPath = mediaPath("marca-uleam.png");

  if (logoPath) {
    doc.image(logoPath, doc.page.margins.left, startY, { width: 200 });
  }

  const line1 = "Facultad Ciencias de la Vida y";
  const line2 = "Tecnologías.";
  doc.font("Helvetica-BoldOblique").fontSize(22);
  const textWidth = doc.widthOfString(line1);
  const textX = doc.page.margins.left + pageWidth - textWidth;
  doc.fillColor("#000000").text(line1, textX, startY + 4, { lineBreak: false });
  doc.text(line2, textX, startY + 28, { lineBreak: false });

  if (marcaPath) {
    const marcaW = 240;
    const marcaX = doc.page.margins.left + (pageWidth - marcaW) / 2;
    doc.save();
    doc.opacity(0.06);
    doc.image(marcaPath, marcaX, startY + 8, { width: marcaW });
    doc.restore();
    doc.opacity(1);
  }

  doc.y = startY + 88;
  doc.moveDown(1.2);
}

function drawTablaFirma(doc: any, r: ReturnType<typeof buildOficioReplacements>, decanoNombre: string) {
  const tableTop = doc.y;
  const innerWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colWidth = innerWidth / 2;
  const leftX = doc.page.margins.left;
  const rightX = leftX + colWidth;
  const rowH = 100;

  doc.strokeColor("#000000").lineWidth(0.5);
  doc.rect(leftX, tableTop, colWidth - 6, rowH).stroke();
  doc.rect(rightX + 6, tableTop, colWidth - 6, rowH).stroke();

  doc.font("Helvetica").fontSize(9.5).fillColor("#000000");
  doc.font("Helvetica-Bold").text(r.nombre_solicitante, leftX + 8, tableTop + 8, { width: colWidth - 16 });
  doc.font("Helvetica").text(r.cargo_firma, leftX + 8, tableTop + 24, { width: colWidth - 16 });
  doc.text(`Cédula: ${r.cedula}`, leftX + 8, tableTop + 40, { width: colWidth - 16 });
  doc.text(`Correo institucional: ${r.correo_docente}`, leftX + 8, tableTop + 54, { width: colWidth - 16 });
  doc.text(`Fecha de generación del documento: ${r.fecha_generacion}`, leftX + 8, tableTop + 68, {
    width: colWidth - 16
  });

  doc.text("Aprobado por:", rightX + 14, tableTop + 8, { width: colWidth - 16 });
  doc.font("Helvetica-Bold").text(decanoNombre, rightX + 14, tableTop + 52, { width: colWidth - 16 });
  doc.font("Helvetica").text(`Decano de la ${FACULTAD_DEFAULT}`, rightX + 14, tableTop + 68, { width: colWidth - 16 });

  doc.y = tableTop + rowH + 12;
}

function drawCuerpoOficio(doc: any, input: BuildCertificadoInput, destinatario: OficioDestinatario) {
  const r = buildOficioReplacements(input, destinatario);
  const decanoNombre = `${destinatario.nombres} ${destinatario.apellidos}`.trim();

  doc.font("Helvetica").fontSize(11);
  doc.text(`OFICIO N° ${r.numero_oficio}`, { align: "both" });
  doc.moveDown(0.9);

  doc.text(destinatario.titulo, { align: "both" });
  doc.text(decanoNombre, { align: "both" });
  doc.text(`Decano de la ${destinatario.facultad}`, { align: "both" });
  doc.moveDown(0.65);

  doc.text("De mis consideraciones.", { align: "both" });
  doc.moveDown(0.65);

  parrafo(doc, r.cuerpo_parrafo_1);
  parrafo(doc, r.cuerpo_parrafo_2);
  parrafo(doc, r.cuerpo_parrafo_3);
  if (r.cuerpo_parrafo_4?.trim()) parrafo(doc, r.cuerpo_parrafo_4);

  doc.moveDown(0.8);
  doc.text("Atentamente,", { align: "both" });
  doc.moveDown(2);
  drawTablaFirma(doc, r, decanoNombre);
}

async function buildPdfKitFallback(input: BuildCertificadoInput, destinatario: OficioDestinatario): Promise<Buffer> {
  const pdfkitMod = await import("pdfkit");
  const PDFDocument = (pdfkitMod as { default?: typeof import("pdfkit") }).default ?? (pdfkitMod as unknown as typeof import("pdfkit"));

  return await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: PAGE_MARGINS.top, bottom: PAGE_MARGINS.bottom, left: PAGE_MARGINS.left, right: PAGE_MARGINS.right }
    });

    const stream = new PassThrough();
    const chunks: Buffer[] = [];
    stream.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
    doc.pipe(stream);

    drawEncabezadoInstitucional(doc);
    drawCuerpoOficio(doc, input, destinatario);
    doc.end();
  });
}

/** Genera PDF desde plantilla Word (LibreOffice) o réplica visual con imágenes del XML original. */
export async function buildCertificadoPdf(
  input: BuildCertificadoInput,
  destinatario: OficioDestinatario
): Promise<BuildPdfResult> {
  const detalle = { facultad: FACULTAD_DEFAULT, ...input.detalle };

  try {
    const docx = await buildOficioDocxBuffer({ ...input, detalle }, destinatario);
    const pdfFromDocx = await convertDocxToPdf(docx);
    if (pdfFromDocx && pdfFromDocx.length > 0) {
      return { buffer: pdfFromDocx, source: "libreoffice" };
    }
  } catch {
    // siguiente motor
  }

  const html = renderOficioHtml({ ...input, detalle }, destinatario);
  const pdfFromHtml = await convertHtmlToPdf(html);
  if (pdfFromHtml && pdfFromHtml.length > 0) {
    return { buffer: pdfFromHtml, source: "playwright" };
  }

  const buffer = await buildPdfKitFallback({ ...input, detalle }, destinatario);
  return { buffer, source: "pdfkit" };
}

/** @deprecated Use buildCertificadoPdf */
export async function buildCertificadoPdfBuffer(
  input: BuildCertificadoInput,
  destinatario: OficioDestinatario
): Promise<Buffer> {
  const { buffer } = await buildCertificadoPdf(input, destinatario);
  return buffer;
}
