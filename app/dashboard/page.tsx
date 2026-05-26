import Link from "next/link";
import { getUserProfile, hasCapability, requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { unstable_noStore as noStore } from "next/cache";

export default async function DashboardPage() {
  noStore();
  const { user } = await requireAuth();
  const profile = await getUserProfile(user.id);
  if (profile.rol === "superusuario") {
    return (
      <section className="stack">
        <PageHeader title="Superusuario" subtitle="Cuenta de respaldo sin módulos operativos visibles." />
        <article className="card">
          <p className="field-hint" style={{ margin: 0 }}>
            Este perfil se mantiene disponible solo para contingencias.
          </p>
        </article>
      </section>
    );
  }

  const [puedeRevisar, puedeAprobar] = await Promise.all([
    hasCapability(user.id, "revisar_solicitudes"),
    hasCapability(user.id, "aprobar_solicitudes"),
  ]);

  const esStaffInstitucional = profile.rol === "secretaria" || profile.rol === "decano";
  const db = esStaffInstitucional ? createSupabaseAdminClient() : createSupabaseServerClient();

  const [
    { count: solicitudesPendientesFirma = 0 },
    { count: solicitudesPendientesSecretaria = 0 },
    { count: solicitudesCuentaPendientes = 0 }
  ] = await Promise.all([
    db
      .from("solicitudes")
      .select("*", { head: true, count: "exact" })
      .eq("estado", "pendiente_aprobacion_decano"),
    db
      .from("solicitudes")
      .select("*", { head: true, count: "exact" })
      .eq("estado", "en_revision_secretaria"),
    db
      .from("account_requests")
      .select("*", { head: true, count: "exact" })
      .eq("status", "pendiente")
  ]);

  return (
    <section className="stack">
      <PageHeader
        title={`Hola, ${profile.nombres}`}
        subtitle="Resumen de tu rol en el flujo de permisos y justificaciones."
      />
      <div className="dashboard-grid">
        <article className="card dashboard-tile stack">
          <h2 style={{ margin: 0 }}>Mis solicitudes</h2>
          <p className="field-hint">Consulta, crea y edita tus solicitudes y certificados.</p>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <Link href="/solicitudes" className="btn btn--secondary btn--sm" style={{ width: "fit-content" }}>
              Ver mis solicitudes
            </Link>
            <Link href="/solicitudes/nueva" className="btn btn--primary btn--sm" style={{ width: "fit-content" }}>
              Nueva solicitud
            </Link>
          </div>
        </article>
        {!Number.isNaN(solicitudesPendientesSecretaria) && profile.rol !== "superusuario" && puedeRevisar ? (
          <article className="card dashboard-tile stack" style={{ borderLeftColor: "var(--color-warning)" }}>
            <h2 style={{ margin: 0 }}>Revision (Secretaria)</h2>
            <p className="field-hint">Pendientes por revisar: {solicitudesPendientesSecretaria}</p>
            <Link href="/solicitudes/proceso-aprobacion" className="btn btn--secondary btn--sm" style={{ width: "fit-content" }}>
              Abrir proceso
            </Link>
          </article>
        ) : null}
        {puedeAprobar && profile.rol !== "superusuario" ? (
          <article className="card dashboard-tile stack" style={{ borderLeftColor: "var(--color-success)" }}>
            <h2 style={{ margin: 0 }}>Aprobacion y firma</h2>
            <p className="field-hint">Pendientes de firma: {solicitudesPendientesFirma}</p>
            <Link href="/solicitudes/proceso-aprobacion" className="btn btn--secondary btn--sm" style={{ width: "fit-content" }}>
              Atender pendientes
            </Link>
          </article>
        ) : null}
        {profile.rol === "decano" ? (
          <article className="card dashboard-tile stack" style={{ borderLeftColor: "var(--color-accent)" }}>
            <h2 style={{ margin: 0 }}>Usuarios y solicitudes de cuenta</h2>
            <p className="field-hint">Solicitudes de cuenta pendientes: {solicitudesCuentaPendientes}</p>
            <div className="row">
              <Link href="/admin/usuarios" className="btn btn--secondary btn--sm" style={{ width: "fit-content" }}>
                Gestionar usuarios
              </Link>
              <Link href="/admin/solicitudes-cuenta" className="btn btn--primary btn--sm" style={{ width: "fit-content" }}>
                Revisar solicitudes
              </Link>
            </div>
          </article>
        ) : null}
        {profile.rol === "secretaria" ? (
          <article className="card dashboard-tile stack" style={{ borderLeftColor: "var(--color-warning)" }}>
            <h2 style={{ margin: 0 }}>Solicitudes de cuenta (rechazo)</h2>
            <p className="field-hint">Pendientes por resolver: {solicitudesCuentaPendientes}</p>
            <Link href="/admin/solicitudes-cuenta" className="btn btn--secondary btn--sm" style={{ width: "fit-content" }}>
              Abrir bandeja
            </Link>
          </article>
        ) : null}
      </div>
    </section>
  );
}
