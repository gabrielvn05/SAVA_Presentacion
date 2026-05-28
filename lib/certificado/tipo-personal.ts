import { FACULTAD_DEFAULT } from "@/lib/certificado/constants";
import type { CertificadoTipo } from "@/lib/certificado/build-certificado-pdf";

export type TipoPersonal = "docente" | "administrativo" | "mantenimiento";

const TIPOS_VALIDOS: TipoPersonal[] = ["docente", "administrativo", "mantenimiento"];

export function parseTipoPersonal(value: unknown, fallback: TipoPersonal = "docente"): TipoPersonal {
  const v = String(value ?? "").trim().toLowerCase();
  if (TIPOS_VALIDOS.includes(v as TipoPersonal)) return v as TipoPersonal;
  return fallback;
}

export function labelTipoPersonal(tipo: TipoPersonal): string {
  if (tipo === "administrativo") return "Personal administrativo";
  if (tipo === "mantenimiento") return "Personal de mantenimiento";
  return "Docente";
}

export function fraseVinculacionFacultad(tipo: TipoPersonal, facultad = FACULTAD_DEFAULT): string {
  if (tipo === "administrativo") return `personal administrativo de la ${facultad}`;
  if (tipo === "mantenimiento") return `personal de mantenimiento de la ${facultad}`;
  return `docente de la ${facultad}`;
}

export function etiquetaCargoFirma(tipo: TipoPersonal, facultad = FACULTAD_DEFAULT): string {
  return `${labelTipoPersonal(tipo)} de la ${facultad}`;
}

function declaracionCierre(tipo: TipoPersonal, contexto: "salud" | "viaje" | "calamidad" | "marcado"): string {
  if (tipo === "docente") {
    if (contexto === "salud") {
      return "Declaro bajo mi compromiso académico que la información aquí consignada es verídica y me comprometo a reincorporarme a mis labores en la fecha de retorno indicada, así como a realizar las gestiones de nivelación con mis estudiantes según lo establecido por la normativa institucional.";
    }
    if (contexto === "viaje") {
      return "Declaro bajo mi compromiso académico que la información aquí consignada es verídica y me comprometo a reincorporarme a mis actividades en la fecha indicada.";
    }
    return "Declaro bajo mi compromiso académico que la información aquí consignada es verídica y me comprometo a cumplir con mis obligaciones institucionales en la fecha indicada.";
  }

  const compromiso = "compromiso institucional";
  if (contexto === "salud") {
    return `Declaro bajo mi ${compromiso} que la información aquí consignada es verídica y me comprometo a reincorporarme a mis funciones laborales en la fecha de retorno indicada, conforme a la normativa de la facultad.`;
  }
  if (contexto === "viaje") {
    return `Declaro bajo mi ${compromiso} que la información aquí consignada es verídica y me comprometo a reincorporarme a mis funciones en la fecha indicada.`;
  }
  if (contexto === "marcado") {
    return `Declaro bajo mi ${compromiso} que la información aquí consignada es verídica y que me ajustaré al registro biométrico conforme a las disposiciones vigentes.`;
  }
  return `Declaro bajo mi ${compromiso} que la información aquí consignada es verídica y me comprometo a reincorporarme a mis funciones laborales en la fecha indicada.`;
}

export type OficioTextoContext = Readonly<{
  tipoPersonal: TipoPersonal;
  tipoTramite: CertificadoTipo;
  nombreCompleto: string;
  cedula: string;
  facultad: string;
  fechaInicio: string;
  fechaFin: string;
  diasAusencia: string;
  detalle: Record<string, unknown>;
}>;

function str(v: unknown) {
  return v != null && String(v).trim() ? String(v).trim() : "—";
}

export function buildParrafosOficio(ctx: OficioTextoContext): {
  cuerpo_parrafo_1: string;
  cuerpo_parrafo_2: string;
  cuerpo_parrafo_3: string;
  cuerpo_parrafo_4: string;
} {
  const { tipoPersonal, tipoTramite, nombreCompleto, cedula, facultad, fechaInicio, fechaFin, diasAusencia, detalle } =
    ctx;
  const vinculo = fraseVinculacionFacultad(tipoPersonal, facultad);
  const intro = `Yo, ${nombreCompleto}, portador(a) de la cédula de identidad N° ${cedula}, ${vinculo},`;

  if (tipoTramite === "enfermedad") {
    const actividad =
      tipoPersonal === "docente"
        ? "mis actividades académicas por razones de salud"
        : "mis funciones laborales por motivo de atención médica o cita médica";

    return {
      cuerpo_parrafo_1: `${intro} por medio del presente documento formal justifico mi ausencia a ${actividad}, conforme a los siguientes datos:`,
      cuerpo_parrafo_2: `Período de la ausencia: desde el día ${fechaInicio} hasta el día ${fechaFin}, lo que corresponde a un total de ${diasAusencia} día(s) hábiles/calendario.`,
      cuerpo_parrafo_3: `Atención médica: fui atendido(a) en ${str(detalle.institucion_medica)}, por el/la doctor(a) ${str(detalle.medico_tratante)}, con diagnóstico o motivo: ${str(detalle.diagnostico)}.`,
      cuerpo_parrafo_4: declaracionCierre(tipoPersonal, "salud")
    };
  }

  if (tipoTramite === "viaje") {
    const clase = String(detalle.motivo_viaje_clase ?? "personal");
    const esAcademico = clase === "academico" && tipoPersonal === "docente";
    let tipoPermiso: string;
    if (tipoPersonal === "docente") {
      tipoPermiso = esAcademico ? "permiso por viaje de carácter académico" : "permiso por viaje por motivos personales";
    } else {
      tipoPermiso =
        esAcademico || clase === "academico"
          ? "permiso por comisión de servicio o actividad institucional fuera de la ciudad"
          : "permiso por viaje por motivos personales";
    }

    const p3 = esAcademico
      ? `Institución organizadora: ${str(detalle.institucion_organizadora)}. Motivo del viaje: ${str(detalle.motivo_viaje)}.`
      : `Motivo del viaje: ${str(detalle.motivo_viaje)}.`;

    return {
      cuerpo_parrafo_1: `${intro} solicito ${tipoPermiso}, conforme a los siguientes datos:`,
      cuerpo_parrafo_2: `Período: desde el día ${fechaInicio} hasta el día ${fechaFin}. Destino: ${str(detalle.destino)}.`,
      cuerpo_parrafo_3: p3,
      cuerpo_parrafo_4: declaracionCierre(tipoPersonal, "viaje")
    };
  }

  if (tipoTramite === "calamidad_domestica") {
    const fechaInas =
      str(detalle.fecha_inasistencia) !== "—" ? String(detalle.fecha_inasistencia) : fechaInicio;
    const motivoAusencia =
      tipoPersonal === "docente"
        ? "justifico mi ausencia a mis actividades por calamidad doméstica"
        : "justifico mi ausencia a mis funciones laborales por calamidad doméstica";

    const p4 =
      str(detalle.observaciones) !== "—"
        ? `${declaracionCierre(tipoPersonal, "calamidad")} Observaciones: ${str(detalle.observaciones)}.`
        : declaracionCierre(tipoPersonal, "calamidad");

    return {
      cuerpo_parrafo_1: `${intro} ${motivoAusencia}, conforme a los siguientes datos:`,
      cuerpo_parrafo_2: `Fecha de inasistencia: ${fechaInas}.`,
      cuerpo_parrafo_3: `Tipo de calamidad: ${str(detalle.tipo_calamidad)}. Descripción: ${str(detalle.descripcion)}.`,
      cuerpo_parrafo_4: p4
    };
  }

  const marcadoIntro =
    tipoPersonal === "docente"
      ? "justifico la falta de registro en el marcado biométrico de entrada y/o salida relacionada con mis actividades"
      : "justifico la falta de registro en el marcado biométrico de entrada y/o salida en el ejercicio de mis funciones laborales";

  const p4Marcado =
    str(detalle.observaciones) !== "—"
      ? `${declaracionCierre(tipoPersonal, "marcado")} Observaciones: ${str(detalle.observaciones)}.`
      : declaracionCierre(tipoPersonal, "marcado");

  return {
    cuerpo_parrafo_1: `${intro} ${marcadoIntro}, conforme a los siguientes datos:`,
    cuerpo_parrafo_2: `Fecha del marcado: ${fechaInicio}. Tipo de registro: ${str(detalle.tipo_marcado)}.`,
    cuerpo_parrafo_3: `Motivo del olvido o incidencia: ${str(detalle.motivo_olvido)}.`,
    cuerpo_parrafo_4: p4Marcado
  };
}

export const TIPOS_PERSONAL_OPCIONES: ReadonlyArray<{ value: TipoPersonal; label: string; hint: string }> = [
  {
    value: "docente",
    label: "Docente",
    hint: "Actividades académicas, congresos y nivelación con estudiantes."
  },
  {
    value: "administrativo",
    label: "Personal administrativo",
    hint: "Funciones administrativas, citas médicas y permisos laborales."
  },
  {
    value: "mantenimiento",
    label: "Personal de mantenimiento",
    hint: "Servicios de mantenimiento, marcado biométrico y permisos operativos."
  }
];
