import { labelTipoPersonal, parseTipoPersonal } from "@/lib/certificado/tipo-personal";

export type SolicitudListRow = Readonly<{
  id: string;
  creado_por: string;
  tipo: string;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string;
  justificativo_nombre: string | null;
  created_at: string;
  detalle: Record<string, unknown> | null;
  profiles?: { nombres: string; apellidos: string; email?: string | null; rol?: string } | null;
}>;

export type ProcesoEstadoFiltro =
  | ""
  | "en_borrador"
  | "en_revision_secretaria"
  | "pendiente_aprobacion_decano"
  | "aprobada"
  | "rechazada";

export type SolicitudFiltros = Readonly<{
  nombre: string;
  rol: string;
  fechaDesde: string;
  fechaHasta: string;
  estado: ProcesoEstadoFiltro;
}>;

const APP_ROLE_LABELS: Record<string, string> = {
  superusuario: "Superusuario",
  decano: "Decano",
  secretaria: "Secretaría",
  administrativo: "Administrativo"
};

export function nombreSolicitante(row: SolicitudListRow): string {
  const p = row.profiles;
  if (p && (p.nombres || p.apellidos)) {
    return `${p.nombres ?? ""} ${p.apellidos ?? ""}`.trim();
  }
  return "";
}

/** Rol de personal en el oficio (docente, administrativo, mantenimiento) o rol del sistema en perfil. */
export function rolFromSolicitud(row: SolicitudListRow): string {
  const d = row.detalle;
  if (d && typeof d === "object") {
    const tp = d.tipo_personal;
    if (typeof tp === "string" && tp.trim()) {
      return labelTipoPersonal(parseTipoPersonal(tp));
    }
  }
  const rolPerfil = (row.profiles as { rol?: string } | null | undefined)?.rol;
  if (rolPerfil && typeof rolPerfil === "string") {
    return APP_ROLE_LABELS[rolPerfil] ?? rolPerfil;
  }
  return "";
}

function overlapsRange(fechaInicio: string, fechaFin: string, desde: string, hasta: string): boolean {
  if (!desde && !hasta) return true;
  if (desde && fechaFin < desde) return false;
  if (hasta && fechaInicio > hasta) return false;
  return true;
}

export function rowMatchesSolicitudFilters(row: SolicitudListRow, f: SolicitudFiltros): boolean {
  const nombre = nombreSolicitante(row).toLowerCase();
  const motivo = row.motivo.toLowerCase();
  const qNombre = f.nombre.trim().toLowerCase();
  if (qNombre && !nombre.includes(qNombre) && !motivo.includes(qNombre)) return false;

  const rol = rolFromSolicitud(row).toLowerCase();
  const qRol = f.rol.trim().toLowerCase();
  if (qRol && !rol.includes(qRol)) return false;

  if (!overlapsRange(row.fecha_inicio, row.fecha_fin, f.fechaDesde.trim(), f.fechaHasta.trim())) {
    return false;
  }

  if (f.estado && row.estado !== f.estado) return false;

  return true;
}
