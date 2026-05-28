import type { BuildCertificadoInput } from "@/lib/certificado/build-certificado-pdf";
import { FACULTAD_DEFAULT } from "@/lib/certificado/constants";
import type { buildOficioReplacements } from "@/lib/certificado/oficio-placeholders";
import { buildParrafosOficio } from "@/lib/certificado/tipo-personal";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Párrafos como quedarían con la plantilla Word original (modelo docente). */
export function buildPlantillaDocenteParagraphsFilled(
  r: ReturnType<typeof buildOficioReplacements>,
  input: BuildCertificadoInput
) {
  const d = input.detalle;
  return buildParrafosOficio({
    tipoPersonal: "docente",
    tipoTramite: input.tipo,
    nombreCompleto: r.nombre_solicitante,
    cedula: r.cedula,
    facultad: FACULTAD_DEFAULT,
    fechaInicio: r.fecha_inicio,
    fechaFin: r.fecha_fin,
    diasAusencia: r.dias_ausencia,
    detalle: d
  });
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
  const plantilla = buildPlantillaDocenteParagraphsFilled(r, input);
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
