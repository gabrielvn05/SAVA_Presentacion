import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { MisSolicitudesFilterTable } from "@/components/solicitudes/MisSolicitudesFilterTable";
import type { SolicitudListRow } from "@/lib/solicitudes-filters";

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

export default async function SolicitudesPage() {
  noStore();
  const { user } = await requireAuth();

  // Con la sesión anon, la política RLS de SELECT en `solicitudes` puede disparar lecturas a `profiles`
  // que en algunas configuraciones terminan en recursión Postgres ("stack depth limit exceeded").
  // Aquí sólo debe mostrarse lo creado por el usuario actual: después de authenticar usamos admin y
  // filtro estricto `creado_por = user.id` (igual seguridad funcional que RLS sobre filas propias).
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("solicitudes")
    .select(
      "id, creado_por, tipo, estado, fecha_inicio, fecha_fin, motivo, justificativo_nombre, created_at, detalle"
    )
    .eq("creado_por", user.id)
    .order("created_at", { ascending: false });

  const rows: SolicitudListRow[] = (data || [])
    .map((r) => normalizeRow(r as unknown as Record<string, unknown>))
    .filter((r) => r.creado_por === user.id);

  return (
    <section className="stack">
      <PageHeader
        title="Mis solicitudes"
        subtitle="Aquí aparecen únicamente las solicitudes que tú registraste. Si eres Secretaría o Decano, usa “Proceso de aprobación” para ver el resto."
        actions={
          <div className="page-header__actions">
            <Link href="/solicitudes/nueva" className="btn btn--primary btn--sm">
              Nueva solicitud
            </Link>
          </div>
        }
      />
      {error ? (
        <article className="card">
          <div className="alert alert--error" role="alert">
            No se pudieron cargar tus solicitudes: {error.message}
          </div>
        </article>
      ) : null}
      <MisSolicitudesFilterTable rows={rows} />
    </section>
  );
}
