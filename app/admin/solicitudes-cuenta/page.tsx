import { PageHeader } from "@/components/PageHeader";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getUserProfile, requireAuth } from "@/lib/auth";
import { aprobarSolicitudCuenta, rechazarSolicitudCuenta } from "@/app/actions";
import { unstable_noStore as noStore } from "next/cache";

export default async function SolicitudesCuentaPage() {
  noStore();
  const { user } = await requireAuth();
  const profile = await getUserProfile(user.id);
  const esDecano = profile.rol === "decano";
  const esSecretaria = profile.rol === "secretaria";
  const esSuper = profile.rol === "superusuario";

  if (!esDecano && !esSecretaria && !esSuper) {
    return (
      <section className="stack">
        <PageHeader title="Solicitudes de cuenta" subtitle="Modulo reservado para Decano y Secretaria." />
        <article className="card">
          <p>No tienes permiso para aprobar solicitudes.</p>
        </article>
      </section>
    );
  }

  const admin = createSupabaseAdminClient();
  const withComment = await admin
    .from("account_requests")
    .select("id, email, nombres, apellidos, rol_solicitado, motivo, status, rechazo_comentario, created_at")
    .order("created_at", { ascending: false });
  const fallback = await admin
    .from("account_requests")
    .select("id, email, nombres, apellidos, rol_solicitado, motivo, status, created_at")
    .order("created_at", { ascending: false });
  const [{ count: totalSolicitudes = 0 }, { count: pendientes = 0 }] = await Promise.all([
    admin.from("account_requests").select("*", { head: true, count: "exact" }),
    admin.from("account_requests").select("*", { head: true, count: "exact" }).eq("status", "pendiente")
  ]);
  const data =
    (withComment.data && withComment.data.length > 0
      ? withComment.data
      : (fallback.data || []).map((r) => ({ ...r, rechazo_comentario: null }))) || [];
  const error = withComment.error && fallback.error ? withComment.error : null;

  return (
    <section className="stack">
      <PageHeader
        title="Solicitudes de cuenta"
        subtitle="Rechaza solicitudes o, si eres superusuario, aprueba y crea la cuenta con contraseña temporal."
      />

      {error ? (
        <article className="card">
          <div className="alert alert--error" role="alert">
            No se pudieron cargar las solicitudes. {error.message}
            <div className="field-hint" style={{ marginTop: "0.75rem" }}>
              Revisa que <code>SUPABASE_SERVICE_ROLE_KEY</code> esté definida en el servidor. Si el error menciona “stack depth”, aplica{" "}
              <code>sql/supabase-hotfix-rls-y-detalle.sql</code>.
            </div>
          </div>
        </article>
      ) : null}
      {!error && data.length === 0 && (totalSolicitudes ?? 0) > 0 ? (
        <article className="card" style={{ borderLeft: "4px solid var(--color-warning)" }}>
          <p className="field-hint" style={{ margin: 0 }}>
            Se detectaron {totalSolicitudes} registros en BD ({pendientes} pendientes), pero no se renderizaron en esta
            vista. Reinicia el servidor de Next.js y recarga con Ctrl+F5.
          </p>
        </article>
      ) : null}

      <article className="card card--flat">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Solicitante</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Motivo</th>
                <th>Estado</th>
                <th>Comentario</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(data || []).length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
                    No hay solicitudes.
                  </td>
                </tr>
              ) : (
                (data || []).map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>
                        {r.nombres} {r.apellidos}
                      </strong>
                    </td>
                    <td>{r.email}</td>
                    <td>{r.rol_solicitado}</td>
                    <td>
                      <span className="text-truncate">{r.motivo || "-"}</span>
                    </td>
                    <td>{r.status}</td>
                    <td>
                      {r.status === "rechazada" ? (
                        <span className="text-truncate">{r.rechazo_comentario || "Rechazada sin comentario"}</span>
                      ) : (
                        <span className="field-hint">—</span>
                      )}
                    </td>
                    <td>
                      <div className="cell-actions">
                        {r.status === "pendiente" ? (
                          <>
                            {esSuper ? (
                              <form action={aprobarSolicitudCuenta}>
                                <input type="hidden" name="request_id" value={r.id} />
                                <button className="btn btn--success btn--sm" type="submit">
                                  Aprobar
                                </button>
                              </form>
                            ) : null}

                            {(esDecano || esSecretaria) ? (
                              <form action={rechazarSolicitudCuenta} className="stack" style={{ width: 220 }}>
                                <input type="hidden" name="request_id" value={r.id} />
                                <textarea
                                  name="comentario"
                                  placeholder="Comentario de rechazo"
                                  rows={2}
                                  required={esSecretaria}
                                  style={{ width: "100%", resize: "vertical" }}
                                />
                                <button className="btn btn--danger btn--sm" type="submit">
                                  Rechazar
                                </button>
                              </form>
                            ) : null}
                          </>
                        ) : (
                          <span className="field-hint">Sin acciones</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

