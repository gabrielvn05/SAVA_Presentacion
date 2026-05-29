import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getUserProfile, requireAuth } from "@/lib/auth";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";

type Params = { id: string };

export default async function SolicitudDetallePage({ params }: Readonly<{ params: Params }>) {
  const { id } = params;
  const { user } = await requireAuth();
  const profile = await getUserProfile(user.id);
  const esStaff =
    profile.rol === "secretaria" || profile.rol === "decano" || profile.rol === "superusuario";
  const db = esStaff ? createSupabaseAdminClient() : createSupabaseServerClient();

  const { data } = await db
    .from("solicitudes")
    .select(
      "id, tipo, estado, fecha_inicio, fecha_fin, motivo, detalle, observaciones_secretaria, observaciones_decano, justificativo_path, justificativo_nombre, created_at, fecha_firma, creado_por"
    )
    .eq("id", id)
    .single();

  if (!data) {
    return (
      <section className="card">
        <p>Solicitud no encontrada.</p>
      </section>
    );
  }

  const hasJustificativo = Boolean(data.justificativo_path && data.justificativo_nombre);
  const justificativoUrl = hasJustificativo
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/justificativos/${data.justificativo_path}`
    : null;
  const justificativoEsPdf = Boolean(data.justificativo_nombre?.toLowerCase().endsWith(".pdf"));
  const tipoLabel =
    data.tipo === "permiso"
      ? "Permiso"
      : data.tipo === "justificacion"
        ? "Justificacion"
        : data.tipo === "viaje"
          ? "Por viaje"
          : data.tipo === "enfermedad"
            ? "Por enfermedad"
            : data.tipo === "calamidad_domestica"
              ? "Calamidad domestica"
              : data.tipo === "falta_marcado"
                ? "Falta de marcado"
                : data.tipo;

  return (
    <section className="stack">
      <PageHeader
        title="Detalle de solicitud"
        subtitle={`Referencia ${data.id.slice(0, 8)}...`}
        actions={
          <div className="row">
            {data.creado_por === user.id ? (
              <Link href={`/solicitudes/${id}/editar`} className="btn btn--primary">
                Editar
              </Link>
            ) : null}
            <Link href={esStaff ? "/solicitudes/proceso-aprobacion" : "/solicitudes"} className="btn btn--secondary">
              Volver
            </Link>
          </div>
        }
      />
      <article className="card stack">
        <div className="row">
          <span className="field-hint">Estado</span>
          <StatusBadge estado={data.estado} />
        </div>
        <div className="detail-grid">
          <div>
            <label>Tipo</label>
            <div>{tipoLabel}</div>
          </div>
          <div>
            <label>Periodo</label>
            <div>
              {data.fecha_inicio} - {data.fecha_fin}
            </div>
          </div>
          <div>
            <label>Justificativo</label>
            <div>
              {hasJustificativo && justificativoUrl ? (
                <a href={justificativoUrl} target="_blank" rel="noopener noreferrer">
                  {data.justificativo_nombre}
                </a>
              ) : (
                <span className="field-hint">—</span>
              )}
            </div>
          </div>
          <div>
            <label>Fecha firma</label>
            <div>{data.fecha_firma || "-"}</div>
          </div>
          <div className="motivo-box">
            <label>Motivo</label>
            <div>{data.motivo}</div>
          </div>
          <div className="motivo-box">
            <label>Documento PDF generado</label>
            <div>
              {hasJustificativo && justificativoUrl && justificativoEsPdf ? (
                <iframe
                  title="PDF de justificativo"
                  src={justificativoUrl}
                  style={{ width: "100%", height: 520, border: "1px solid var(--color-border)", borderRadius: 8 }}
                />
              ) : hasJustificativo && justificativoUrl ? (
                <a href={justificativoUrl} target="_blank" rel="noopener noreferrer">
                  Abrir documento adjunto
                </a>
              ) : (
                <span className="field-hint">—</span>
              )}
            </div>
          </div>
          <div>
            <label>Observacion Secretaria</label>
            <div>{data.observaciones_secretaria || "-"}</div>
          </div>
          <div>
            <label>Observacion Decano</label>
            <div>{data.observaciones_decano || "-"}</div>
          </div>
        </div>
      </article>
    </section>
  );
}
