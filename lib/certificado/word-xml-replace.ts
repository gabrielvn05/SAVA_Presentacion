import { FACULTAD_DEFAULT } from "@/lib/certificado/constants";
import type { BuildCertificadoInput } from "@/lib/certificado/build-certificado-pdf";
import type { OficioDestinatario } from "@/lib/certificado/oficio-placeholders";
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

function replaceAll(xml: string, pairs: Array<[string, string]>) {
  let out = xml;
  for (const [from, to] of pairs) {
    if (!from) continue;
    out = out.split(from).join(to);
  }
  return out;
}

/** Rellena marcadores [campo] en document.xml (soporta texto partido en varios &lt;w:t&gt;). */
export function applyOficioDocumentXml(
  xml: string,
  input: BuildCertificadoInput,
  destinatario: OficioDestinatario,
  r: ReturnType<typeof buildOficioReplacements>
) {
  const d = input.detalle;
  const decanoNombre = `${destinatario.nombres} ${destinatario.apellidos}`.trim();

  let out = replaceAll(xml, [
    ["FCVT-032026-0005", escapeXml(r.numero_oficio)],
    ["Ángel Cristian", escapeXml(destinatario.nombres)],
    ["Mera Macias", escapeXml(destinatario.apellidos)],
    ["[Nombre completo del docente]", escapeXml(r.nombre_docente)],
    ["[Número de cédula]", escapeXml(r.cedula)],
    ["[Cédula]", escapeXml(r.cedula)],
    ["[Carrera]", ""],
    ["<w:t>Carrera</w:t>", "<w:t></w:t>"],
    ["la [facultad]", escapeXml(`la ${FACULTAD_DEFAULT}`)],
    ["[facultad]", escapeXml(FACULTAD_DEFAULT)],
    ["[Facultad]", escapeXml(FACULTAD_DEFAULT)],
    ["[Fecha de inicio de la falta]", escapeXml(r.fecha_inicio)],
    ["[Fecha de retorno a clases]", escapeXml(r.fecha_fin)],
    ["[Número de días]", escapeXml(r.dias_ausencia)],
    ["[Lugar donde se realizó la atención médica]", escapeXml(str(d.institucion_medica))],
    ["[Nombre completo del doctor(a)]", escapeXml(str(d.medico_tratante))],
    ["[Diagnóstico principal]", escapeXml(str(d.diagnostico))],
    ["[Correo]", escapeXml(r.correo_docente)],
    ["[Fecha automática del sistema]", escapeXml(r.fecha_generacion)],
    [
      "Docente de la facultad [Facultad]",
      escapeXml(`${r.nombre_solicitante} — ${r.cargo_firma}`)
    ],
    ["Decano de la facultad [Facultad]", escapeXml(`Decano de la ${FACULTAD_DEFAULT}`)],
    ["Ciencias de la vida y ", escapeXml(`${FACULTAD_DEFAULT} `)],
    ["tecnologias", ""]
  ]);

  out = out
    .split(escapeXml("docente de la  de la "))
    .join(escapeXml(`docente de la ${FACULTAD_DEFAULT}, `))
    .split("docente de la  de la ")
    .join(`docente de la ${FACULTAD_DEFAULT}, `)
    .split("docente de la [] de la ")
    .join(`docente de la ${FACULTAD_DEFAULT}, `);

  return out;
}
