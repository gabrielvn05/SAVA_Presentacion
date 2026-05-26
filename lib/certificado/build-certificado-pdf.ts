import { PassThrough } from "stream";

export type CertificadoTipo = "enfermedad" | "viaje" | "calamidad_domestica" | "falta_marcado";

export type BuildCertificadoInput = Readonly<{
  solicitante: { nombres: string; apellidos: string; email?: string | null };
  tipo: CertificadoTipo;
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string;
  detalle: Record<string, unknown>;
}>;

// pdfkit typings varían según versión/CJS; mantenemos el doc sin tipar fino.
function texto(doc: any, label: string, value: string) {
  doc.font("Helvetica-Bold").fontSize(10).text(`${label}: `, { continued: true });
  doc.font("Helvetica").text(value || "—");
  doc.moveDown(0.35);
}

export async function buildCertificadoPdfBuffer(input: BuildCertificadoInput): Promise<Buffer> {
  const pdfkitMod = await import("pdfkit");
  const PDFDocument = (pdfkitMod as { default?: typeof import("pdfkit") }).default ?? (pdfkitMod as unknown as typeof import("pdfkit"));

  return await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 56 });
    const stream = new PassThrough();
    const chunks: Buffer[] = [];
    stream.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
    doc.pipe(stream);

    doc.font("Helvetica-Bold").fontSize(16).text("Certificado de justificación", { align: "center" });
    doc.moveDown(0.75);
    doc.font("Helvetica").fontSize(10).fillColor("#444444").text("Documento generado por SAVA (permisos y justificaciones).", { align: "center" });
    doc.fillColor("#000000");
    doc.moveDown(1.25);

    doc.font("Helvetica-Bold").fontSize(11).text("Datos generales");
    doc.moveDown(0.35);
    doc.font("Helvetica").fontSize(10);
    texto(doc, "Solicitante", `${input.solicitante.nombres} ${input.solicitante.apellidos}`);
    if (input.solicitante.email) texto(doc, "Correo", String(input.solicitante.email));
    texto(doc, "Tipo de trámite", input.tipo);
    texto(doc, "Periodo registrado", `${input.fecha_inicio} al ${input.fecha_fin}`);
    texto(doc, "Resumen / motivo", input.motivo);
    doc.moveDown(0.75);

    doc.font("Helvetica-Bold").fontSize(11).text("Detalle del trámite");
    doc.moveDown(0.35);
    doc.font("Helvetica").fontSize(10);

    const d = input.detalle;

    if (input.tipo === "enfermedad") {
      texto(doc, "Fecha de inasistencia", String(d.fecha_inasistencia ?? ""));
      texto(doc, "Institución médica", String(d.institucion_medica ?? ""));
      texto(doc, "Médico tratante", String(d.medico_tratante ?? ""));
      texto(doc, "Fecha emisión del certificado", String(d.fecha_emision_certificado ?? ""));
      texto(doc, "Días de reposo", String(d.dias_reposo ?? ""));
      texto(doc, "Diagnóstico", String(d.diagnostico ?? ""));
      texto(doc, "Observaciones", String(d.observaciones ?? ""));
    } else if (input.tipo === "viaje") {
      texto(doc, "Fecha de inasistencia", String(d.fecha_inasistencia ?? ""));
      texto(doc, "Destino", String(d.destino ?? ""));
      texto(doc, "Institución organizadora", String(d.institucion_organizadora ?? ""));
      texto(doc, "Fecha inicio (viaje)", String(d.fecha_inicio_viaje ?? ""));
      texto(doc, "Fecha fin (viaje)", String(d.fecha_fin_viaje ?? ""));
      texto(doc, "Motivo del viaje", String(d.motivo_viaje ?? ""));
      texto(doc, "Observaciones", String(d.observaciones ?? ""));
    } else if (input.tipo === "calamidad_domestica") {
      texto(doc, "Fecha de inasistencia", String(d.fecha_inasistencia ?? ""));
      texto(doc, "Tipo de calamidad", String(d.tipo_calamidad ?? ""));
      texto(doc, "Descripción", String(d.descripcion ?? ""));
      texto(doc, "Observaciones", String(d.observaciones ?? ""));
    } else if (input.tipo === "falta_marcado") {
      texto(doc, "Fecha de inasistencia", String(d.fecha_inasistencia ?? ""));
      texto(doc, "Fecha del marcado", String(d.fecha_marcado ?? ""));
      texto(doc, "Hora aproximada", String(d.hora_aproximada ?? ""));
      texto(doc, "Tipo de marcado", String(d.tipo_marcado ?? ""));
      texto(doc, "Motivo del olvido", String(d.motivo_olvido ?? ""));
      texto(doc, "Observaciones", String(d.observaciones ?? ""));
    }

    doc.moveDown(1);
    doc.font("Helvetica").fontSize(9).fillColor("#666666").text(
      "Este certificado debe acompañar el archivo firmado (si aplica) y será revisado por Secretaría y Decanato según el flujo institucional.",
      { align: "left" }
    );

    doc.end();
  });
}
