import type { BuildCertificadoInput } from "@/lib/certificado/build-certificado-pdf";
import { FACULTAD_DEFAULT } from "@/lib/certificado/constants";
import {
  buildParrafosOficio,
  etiquetaCargoFirma,
  labelTipoPersonal,
  parseTipoPersonal
} from "@/lib/certificado/tipo-personal";
import { labelTipoSolicitud } from "@/lib/solicitud-tipo-labels";

export type OficioDestinatario = Readonly<{
  titulo: string;
  nombres: string;
  apellidos: string;
  facultad: string;
}>;

function str(v: unknown) {
  return v != null && String(v).trim() ? String(v).trim() : "—";
}

function formatFecha(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function diasEntre(inicio: string, fin: string) {
  const a = new Date(`${inicio}T12:00:00`);
  const b = new Date(`${fin}T12:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return "—";
  const diff = Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
  return String(Math.max(1, diff));
}

export function generarNumeroOficio() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  const seq = String(now.getTime()).slice(-4);
  return `FCVT-${mm}${yyyy}-${seq}`;
}

export function resolveTipoPersonalFromInput(input: BuildCertificadoInput) {
  return parseTipoPersonal(input.detalle.tipo_personal ?? input.tipo_personal);
}

export function buildOficioReplacements(
  input: BuildCertificadoInput,
  destinatario: OficioDestinatario
): Record<string, string> {
  const d = input.detalle;
  const tipoPersonal = resolveTipoPersonalFromInput(input);
  const nombreSolicitante = `${input.solicitante.nombres} ${input.solicitante.apellidos}`.trim();
  const cedula = str(d.cedula);
  const facultad = FACULTAD_DEFAULT;
  const numeroOficio = generarNumeroOficio();
  const fechaGeneracion = formatFecha(new Date().toISOString().slice(0, 10));
  const fechaInicio = formatFecha(input.fecha_inicio);
  const fechaFin = formatFecha(input.fecha_fin);
  const diasAusencia = diasEntre(input.fecha_inicio, input.fecha_fin);

  const parrafos = buildParrafosOficio({
    tipoPersonal,
    tipoTramite: input.tipo,
    nombreCompleto: nombreSolicitante,
    cedula,
    facultad,
    fechaInicio,
    fechaFin,
    diasAusencia,
    detalle: d
  });

  return {
    numero_oficio: numeroOficio,
    decano_titulo: destinatario.titulo,
    decano_nombres: destinatario.nombres,
    decano_apellidos: destinatario.apellidos,
    decano_facultad: destinatario.facultad,
    nombre_docente: nombreSolicitante,
    nombre_solicitante: nombreSolicitante,
    cedula,
    facultad,
    tipo_personal: tipoPersonal,
    tipo_personal_label: labelTipoPersonal(tipoPersonal),
    cargo_firma: etiquetaCargoFirma(tipoPersonal, facultad),
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
    dias_ausencia: diasAusencia,
    correo_docente: str(input.solicitante.email),
    correo_solicitante: str(input.solicitante.email),
    fecha_generacion: fechaGeneracion,
    tipo_tramite: labelTipoSolicitud(input.tipo),
    ...parrafos
  };
}

/** Datos para docxtemplater (delimitadores [campo] en la plantilla Word). */
export function buildDocxTemplateData(
  input: BuildCertificadoInput,
  destinatario: OficioDestinatario,
  r: ReturnType<typeof buildOficioReplacements>
) {
  const d = input.detalle;
  return {
    "Nombre completo del docente": r.nombre_solicitante,
    "Número de cédula": r.cedula,
    Cédula: r.cedula,
    Carrera: "",
    facultad: FACULTAD_DEFAULT,
    Facultad: FACULTAD_DEFAULT,
    "Fecha de inicio de la falta": r.fecha_inicio,
    "Fecha de retorno a clases": r.fecha_fin,
    "Número de días": r.dias_ausencia,
    "Lugar donde se realizó la atención médica": str(d.institucion_medica),
    "Nombre completo del doctor(a)": str(d.medico_tratante),
    "Diagnóstico principal": str(d.diagnostico),
    Correo: r.correo_solicitante,
    "Fecha automática del sistema": r.fecha_generacion,
    decano_nombres: destinatario.nombres,
    decano_apellidos: destinatario.apellidos
  };
}
