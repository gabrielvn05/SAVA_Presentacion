import type { BuildCertificadoInput } from "@/lib/certificado/build-certificado-pdf";
import { FACULTAD_DEFAULT } from "@/lib/certificado/constants";
import type { buildOficioReplacements } from "@/lib/certificado/oficio-placeholders";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function str(v: unknown) {
  return v != null && String(v).trim() ? String(v).trim() : "—";
}

/** Texto fijo de la plantilla Word (solo modelo docente + enfermedad). */
export function buildWordTemplateDocenteEnfermedadParagraphs(
  r: ReturnType<typeof buildOficioReplacements>,
  detalle: Record<string, unknown>
) {
  const facultad = FACULTAD_DEFAULT;
  return {
    cuerpo_parrafo_1: `Yo, ${r.nombre_solicitante}, portador de la cédula de identidad N° ${r.cedula}, docente de la ${facultad}, por medio del presente documento formal justifico mi ausencia a mis actividades académicas por razones de salud, conforme a los siguientes datos:`,
    cuerpo_parrafo_2: `Período de la falta: desde el día ${r.fecha_inicio} hasta el día ${r.fecha_fin}, lo que corresponde a un total de ${r.dias_ausencia} días hábiles/calendario de ausencia.`,
    cuerpo_parrafo_3: `Atención médica recibida: fui atendido(a) en ${str(detalle.institucion_medica)}, por el doctor(a) ${str(detalle.medico_tratante)} quien emitió el siguiente diagnóstico: ${str(detalle.diagnostico)}.`,
    cuerpo_parrafo_4:
      "Declaro bajo mi compromiso académico que la información aquí consignada es verídica y me comprometo a reincorporarme a mis labores en la fecha de retorno indicada, así como a realizar las gestiones de nivelación con mis estudiantes según lo establecido por la normativa institucional."
  };
}

export function normalizeDocenteFrase(xml: string) {
  return xml
    .split(escapeXml("docente de la  de la "))
    .join(escapeXml("docente de la "))
    .split("docente de la  de la ")
    .join("docente de la ");
}

export function swapDocxBodyForTipo(
  xml: string,
  r: ReturnType<typeof buildOficioReplacements>,
  input: BuildCertificadoInput
) {
  const plantilla = buildWordTemplateDocenteEnfermedadParagraphs(r, input.detalle);
  let out = normalizeDocenteFrase(xml);

  if (input.tipo === "enfermedad" && r.tipo_personal === "docente") {
    return out;
  }

  const swaps: Array<[string, string]> = [
    [plantilla.cuerpo_parrafo_1, r.cuerpo_parrafo_1],
    [plantilla.cuerpo_parrafo_2, r.cuerpo_parrafo_2],
    [plantilla.cuerpo_parrafo_3, r.cuerpo_parrafo_3],
    [plantilla.cuerpo_parrafo_4, r.cuerpo_parrafo_4]
  ];

  for (const [from, to] of swaps) {
    if (!to?.trim() || from === to) continue;
    out = out.split(escapeXml(from)).join(escapeXml(to));
    out = out.split(from).join(escapeXml(to));
  }

  return out;
}
