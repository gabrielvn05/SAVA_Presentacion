import Link from "next/link";
import { getUserProfile, hasCapability, requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchDashboardStats } from "@/lib/dashboard-stats";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DonutChart } from "@/components/dashboard/DonutChart";
import { BarChart } from "@/components/dashboard/BarChart";
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
    hasCapability(user.id, "aprobar_solicitudes")
  ]);

  const esStaffInstitucional = profile.rol === "secretaria" || profile.rol === "decano";
  const db = esStaffInstitucional ? createSupabaseAdminClient() : createSupabaseServerClient();
  const stats = await fetchDashboardStats(db, {
    userId: esStaffInstitucional ? undefined : user.id,
    includeAccountRequests: profile.rol === "decano" || profile.rol === "secretaria"
  });

  const scopeLabel = esStaffInstitucional ? "Institución" : "Mis trámites";

  return (
    <section className="stack dashboard-page">
      <PageHeader
        title={`Hola, ${profile.nombres}`}
        subtitle={`Panel de ${scopeLabel.toLowerCase()}: indicadores, porcentajes y accesos rápidos.`}
      />

      <div className="dash-metrics">
        <MetricCard label="Total solicitudes" value={stats.total} hint={`Alcance: ${scopeLabel}`} accent="primary" />
        <MetricCard
          label="En proceso"
          value={stats.enProceso}
          pct={stats.total > 0 ? Math.round((stats.enProceso / stats.total) * 1000) / 10 : 0}
          hint="Borrador, revisión o firma pendiente"
          accent="warning"
        />
        <MetricCard
          label="Aprobadas"
          value={stats.aprobadas}
          pct={stats.total > 0 ? Math.round((stats.aprobadas / stats.total) * 1000) / 10 : 0}
          hint={`Tasa de aprobación: ${stats.tasaAprobacion}%`}
          accent="success"
        />
        <MetricCard
          label="Últimos 30 días"
          value={stats.recientes30Dias}
          pct={stats.total > 0 ? Math.round((stats.recientes30Dias / stats.total) * 1000) / 10 : 0}
          hint={`Resueltas: ${stats.tasaResolucion}% del total`}
          accent="info"
        />
      </div>

      <div className="dash-charts">
        <article className="card dash-chart-card">
          <div className="dash-chart-card__head">
            <h2>Distribución por estado</h2>
            <p className="field-hint">Porcentaje de cada etapa del flujo.</p>
          </div>
          <div className="dash-chart-card__body dash-chart-card__body--split">
            <DonutChart segments={stats.byEstado} totalLabel={scopeLabel} />
            <div className="dash-legend">
              {stats.byEstado.map((segment) => (
                <div key={segment.key} className="dash-legend__item">
                  <span className="dash-legend__swatch" style={{ backgroundColor: segment.color }} />
                  <span className="dash-legend__label">{segment.label}</span>
                  <span className="dash-legend__value">
                    {segment.count} ({segment.pct}%)
                  </span>
                </div>
              ))}
              {stats.byEstado.length === 0 ? (
                <p className="field-hint dash-chart-empty">Aún no hay solicitudes registradas.</p>
              ) : null}
            </div>
          </div>
        </article>

        <article className="card dash-chart-card">
          <div className="dash-chart-card__head">
            <h2>Tipos de trámite</h2>
            <p className="field-hint">Composición por categoría de solicitud.</p>
          </div>
          <BarChart segments={stats.byTipo} />
        </article>
      </div>

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

        {puedeRevisar ? (
          <article className="card dashboard-tile stack" style={{ borderLeftColor: "var(--color-warning)" }}>
            <h2 style={{ margin: 0 }}>Revisión (Secretaría)</h2>
            <p className="field-hint">
              Pendientes: <strong>{stats.pendientesRevision}</strong>
              {stats.total > 0 ? ` · ${Math.round((stats.pendientesRevision / stats.total) * 1000) / 10}% del total` : ""}
            </p>
            <Link href="/solicitudes/proceso-aprobacion" className="btn btn--secondary btn--sm" style={{ width: "fit-content" }}>
              Abrir proceso
            </Link>
          </article>
        ) : null}

        {puedeAprobar ? (
          <article className="card dashboard-tile stack" style={{ borderLeftColor: "var(--color-success)" }}>
            <h2 style={{ margin: 0 }}>Aprobación y firma</h2>
            <p className="field-hint">
              Pendientes de firma: <strong>{stats.pendientesFirma}</strong>
              {stats.total > 0 ? ` · ${Math.round((stats.pendientesFirma / stats.total) * 1000) / 10}% del total` : ""}
            </p>
            <Link href="/solicitudes/proceso-aprobacion" className="btn btn--secondary btn--sm" style={{ width: "fit-content" }}>
              Atender pendientes
            </Link>
          </article>
        ) : null}

        {profile.rol === "decano" ? (
          <article className="card dashboard-tile stack" style={{ borderLeftColor: "var(--color-accent)" }}>
            <h2 style={{ margin: 0 }}>Solicitudes de cuenta</h2>
            <p className="field-hint">Pendientes por revisar: {stats.solicitudesCuentaPendientes}</p>
            <Link href="/admin/solicitudes-cuenta" className="btn btn--primary btn--sm" style={{ width: "fit-content" }}>
              Revisar solicitudes
            </Link>
          </article>
        ) : null}

        {profile.rol === "secretaria" ? (
          <article className="card dashboard-tile stack" style={{ borderLeftColor: "var(--color-warning)" }}>
            <h2 style={{ margin: 0 }}>Solicitudes de cuenta (rechazo)</h2>
            <p className="field-hint">Pendientes por resolver: {stats.solicitudesCuentaPendientes}</p>
            <Link href="/admin/solicitudes-cuenta" className="btn btn--secondary btn--sm" style={{ width: "fit-content" }}>
              Abrir bandeja
            </Link>
          </article>
        ) : null}

        <article className="card dashboard-tile stack" style={{ borderLeftColor: "var(--color-danger)" }}>
          <h2 style={{ margin: 0 }}>Rechazadas</h2>
          <p className="field-hint">
            Total: <strong>{stats.rechazadas}</strong>
            {stats.total > 0 ? ` · ${Math.round((stats.rechazadas / stats.total) * 1000) / 10}% del total` : ""}
          </p>
          <Link href="/solicitudes" className="btn btn--secondary btn--sm" style={{ width: "fit-content" }}>
            Ver historial
          </Link>
        </article>
      </div>
    </section>
  );
}
