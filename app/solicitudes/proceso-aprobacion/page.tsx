import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getUserProfile, hasCapability, requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { ProcesoSolicitudesFilterTable } from "@/components/solicitudes/ProcesoSolicitudesFilterTable";
import type { SolicitudListRow } from "@/lib/solicitudes-filters";

function puedeAccederProceso(rol: string) {
  return rol === "secretaria" || rol === "decano" || rol === "superusuario";
}

function normalizeRow(raw: Record<string, unknown>): SolicitudListRow {
  let profiles = raw.profiles as SolicitudListRow["profiles"] | SolicitudListRow["profiles"][] | null | undefined;
  if (Array.isArray(profiles)) {
    profiles = profiles[0] ?? null;
  }
  const detalle = raw.detalle;
  return {
    id: String(raw.id),
    creado_por: String(raw.creado_por ?? ""),
    tipo: String(raw.tipo),
    estado: String(raw.estado),
    fecha_inicio: String(raw.fecha_inicio),
    fecha_fin: String(raw.fecha_fin),
    motivo: String(raw.motivo),
    justificativo_nombre: raw.justificativo_nombre != null ? String(raw.justificativo_nombre) : null,
    created_at: String(raw.created_at),
    detalle: detalle && typeof detalle === "object" && !Array.isArray(detalle) ? (detalle as Record<string, unknown>) : null,
    profiles: profiles ?? null
  };
}

export default async function ProcesoAprobacionPage() {
  noStore();
  const { user } = await requireAuth();
  const profile = await getUserProfile(user.id);
  if (!puedeAccederProceso(profile.rol)) {
    redirect("/solicitudes");
  }

  const puedeRevisar = await hasCapability(user.id, "revisar_solicitudes");
  const puedeAprobar = await hasCapability(user.id, "aprobar_solicitudes");

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("solicitudes")
    .select(
      "id, creado_por, tipo, estado, fecha_inicio, fecha_fin, motivo, justificativo_nombre, created_at, detalle, profiles!solicitudes_creado_por_fkey(nombres, apellidos, email, rol)"
    )
    .order("created_at", { ascending: false });

  const rows: SolicitudListRow[] = (data || []).map((r) => normalizeRow(r as unknown as Record<string, unknown>));

  return (
    <section className="stack">
      <PageHeader
        title="Proceso de aprobación"
        subtitle="Bandeja institucional: aquí ves solicitudes de todos los usuarios y avanzas el flujo (Secretaría → Decanato). Tus propias solicitudes también aparecen en “Mis solicitudes”."
        actions={
          <div className="page-header__actions">
            <Link href="/solicitudes" className="btn btn--secondary btn--sm">
              Mis solicitudes
            </Link>
            <Link href="/solicitudes/nueva" className="btn btn--primary btn--sm">
              Nueva solicitud
            </Link>
          </div>
        }
      />

      {error ? (
        <article className="card">
          <div className="alert alert--error" role="alert">
            No se pudieron cargar las solicitudes. {error.message}
          </div>
        </article>
      ) : null}

      <ProcesoSolicitudesFilterTable
        rows={rows}
        puedeRevisar={puedeRevisar}
        puedeAprobar={puedeAprobar}
        userId={user.id}
      />
    </section>
  );
}
