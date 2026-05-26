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
  profiles?: { nombres: string; apellidos: string; email?: string | null } | null;
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
  facultad: string;
  fechaDesde: string;
  fechaHasta: string;
  estado: ProcesoEstadoFiltro;
}>;

export function nombreSolicitante(row: SolicitudListRow): string {
  const p = row.profiles;
  if (p && (p.nombres || p.apellidos)) {
    return `${p.nombres ?? ""} ${p.apellidos ?? ""}`.trim();
  }
  return "";
}

export function facultadFromDetalle(row: SolicitudListRow): string {
  const d = row.detalle;
  if (!d || typeof d !== "object") return "";
  const keys = ["facultad", "unidad", "facultad_academica", "dependencia"] as const;
  for (const k of keys) {
    const v = d[k];
    if (typeof v === "string" && v.trim()) return v.trim();
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

  const fac = facultadFromDetalle(row).toLowerCase();
  const qFac = f.facultad.trim().toLowerCase();
  if (qFac && !fac.includes(qFac)) return false;

  if (!overlapsRange(row.fecha_inicio, row.fecha_fin, f.fechaDesde.trim(), f.fechaHasta.trim())) {
    return false;
  }

  if (f.estado && row.estado !== f.estado) return false;

  return true;
}
