import { ESTADO_LABELS } from "@/lib/estados";
import { labelTipoSolicitud } from "@/lib/solicitud-tipo-labels";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

export type DashboardSegment = {
  key: string;
  label: string;
  count: number;
  pct: number;
  color: string;
};

export type DashboardStats = {
  total: number;
  byEstado: DashboardSegment[];
  byTipo: DashboardSegment[];
  pendientesRevision: number;
  pendientesFirma: number;
  aprobadas: number;
  rechazadas: number;
  enProceso: number;
  tasaAprobacion: number;
  tasaResolucion: number;
  solicitudesCuentaPendientes: number;
  recientes30Dias: number;
};

const ESTADO_COLORS: Record<string, string> = {
  en_borrador: "#94a3b8",
  en_revision_secretaria: "#b45309",
  pendiente_aprobacion_decano: "#1d6fb8",
  aprobada: "#0d7a4f",
  rechazada: "#b42318"
};

const TIPO_COLORS: Record<string, string> = {
  permiso: "#0c3d7a",
  justificacion: "#1d6fb8",
  viaje: "#6366f1",
  enfermedad: "#b45309",
  calamidad_domestica: "#9333ea",
  falta_marcado: "#0d9488"
};

function pct(count: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((count / total) * 1000) / 10;
}

function supabaseErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const msg = (error as { message: unknown }).message;
    if (typeof msg === "string" && msg.length > 0) return msg;
  }
  return "Error al consultar solicitudes.";
}

function isRlsRecursionError(message: string) {
  return /stack depth limit exceeded/i.test(message);
}

async function loadSolicitudesRows(
  db: SupabaseClient,
  userId?: string
): Promise<{ rows: { estado: unknown; tipo: unknown; created_at: unknown }[]; error: unknown }> {
  let q = db.from("solicitudes").select("estado, tipo, created_at");
  if (userId) q = q.eq("creado_por", userId);
  const { data, error } = await q;
  return { rows: data ?? [], error };
}

function buildSegments(
  rows: { key: string; label: string; count: number }[],
  total: number,
  colors: Record<string, string>,
  fallbackColor: string
): DashboardSegment[] {
  return rows
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((row) => ({
      ...row,
      pct: pct(row.count, total),
      color: colors[row.key] ?? fallbackColor
    }));
}

export async function fetchDashboardStats(
  db: SupabaseClient,
  options: { userId?: string; includeAccountRequests?: boolean } = {}
): Promise<DashboardStats> {
  let { rows, error } = await loadSolicitudesRows(db, options.userId);

  if (error) {
    const message = supabaseErrorMessage(error);
    if (isRlsRecursionError(message)) {
      const admin = createSupabaseAdminClient();
      const retry = await loadSolicitudesRows(admin, options.userId);
      rows = retry.rows;
      error = retry.error;
    }
    if (error) {
      const finalMessage = supabaseErrorMessage(error);
      if (isRlsRecursionError(finalMessage)) {
        throw new Error(
          "Error de permisos en la base de datos (recursión RLS). Ejecuta en Supabase el script sql/supabase-hotfix-rls-y-detalle.sql."
        );
      }
      throw new Error(finalMessage);
    }
  }

  const accountRequestsResult = await (options.includeAccountRequests
    ? db.from("account_requests").select("status").eq("status", "pendiente")
    : Promise.resolve({ data: null, error: null }));
  const total = rows.length;

  const estadoCounts = new Map<string, number>();
  const tipoCounts = new Map<string, number>();
  let recientes30Dias = 0;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  for (const row of rows) {
    const estado = String(row.estado);
    const tipo = String(row.tipo);
    estadoCounts.set(estado, (estadoCounts.get(estado) ?? 0) + 1);
    tipoCounts.set(tipo, (tipoCounts.get(tipo) ?? 0) + 1);

    const createdAt = row.created_at ? new Date(String(row.created_at)) : null;
    if (createdAt && createdAt >= cutoff) recientes30Dias += 1;
  }

  const pendientesRevision = estadoCounts.get("en_revision_secretaria") ?? 0;
  const pendientesFirma = estadoCounts.get("pendiente_aprobacion_decano") ?? 0;
  const aprobadas = estadoCounts.get("aprobada") ?? 0;
  const rechazadas = estadoCounts.get("rechazada") ?? 0;
  const enProceso = pendientesRevision + pendientesFirma + (estadoCounts.get("en_borrador") ?? 0);
  const finalizadas = aprobadas + rechazadas;

  const byEstado = buildSegments(
    Array.from(estadoCounts.entries()).map(([key, count]) => ({
      key,
      label: ESTADO_LABELS[key] ?? key,
      count
    })),
    total,
    ESTADO_COLORS,
    "#64748b"
  );

  const byTipo = buildSegments(
    Array.from(tipoCounts.entries()).map(([key, count]) => ({
      key,
      label: labelTipoSolicitud(key),
      count
    })),
    total,
    TIPO_COLORS,
    "#64748b"
  );

  return {
    total,
    byEstado,
    byTipo,
    pendientesRevision,
    pendientesFirma,
    aprobadas,
    rechazadas,
    enProceso,
    tasaAprobacion: pct(aprobadas, finalizadas),
    tasaResolucion: pct(finalizadas, total),
    solicitudesCuentaPendientes: accountRequestsResult.data?.length ?? 0,
    recientes30Dias
  };
}
