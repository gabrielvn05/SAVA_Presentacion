import { actualizarSolicitud } from "@/app/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getUserProfile, requireAuth } from "@/lib/auth";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { isoDateUTC, threeMonthsAgoUTC } from "@/lib/fechas";

type Params = { id: string };

export default async function EditarSolicitudPage({ params }: Readonly<{ params: Params }>) {
  const { user } = await requireAuth();
  const profile = await getUserProfile(user.id);
  const esStaff =
    profile.rol === "secretaria" || profile.rol === "decano" || profile.rol === "superusuario";
  const db = esStaff ? createSupabaseAdminClient() : createSupabaseServerClient();
  const minFechaInicio = isoDateUTC(threeMonthsAgoUTC());

  const { data } = await db
    .from("solicitudes")
    .select("id, tipo, fecha_inicio, fecha_fin, motivo, justificativo_nombre, creado_por")
    .eq("id", params.id)
    .single();

  if (!data || (!esStaff && data.creado_por !== user.id)) {
    return (
      <section className="card">
        <p>Solicitud no encontrada.</p>
      </section>
    );
  }

  const updateAction = actualizarSolicitud.bind(null, params.id);

  return (
    <section className="stack">
      <PageHeader
        title="Editar solicitud"
        subtitle="Actualiza los datos o reemplaza el justificativo."
        actions={
          <Link href={`/solicitudes/${params.id}`} className="btn btn--secondary">
            Ver detalle
          </Link>
        }
      />
      <article className="card stack" style={{ maxWidth: 720 }}>
        <form action={updateAction} className="stack" encType="multipart/form-data">
          <div>
            <label htmlFor="tipo">Tipo de tramite</label>
            <select id="tipo" name="tipo" required defaultValue={data.tipo}>
              <option value="justificacion">Justificacion</option>
              <option value="viaje">Por viaje</option>
              <option value="enfermedad">Por enfermedad</option>
              <option value="calamidad_domestica">Calamidad domestica</option>
              <option value="falta_marcado">Falta de marcado</option>
              <option value="permiso">Permiso</option>
            </select>
          </div>
          <div className="form-grid form-grid--2">
            <div>
              <label htmlFor="fecha_inicio">Fecha inicio</label>
              <input
                id="fecha_inicio"
                name="fecha_inicio"
                type="date"
                required
                min={minFechaInicio}
                defaultValue={data.fecha_inicio}
              />
              <p className="field-hint">Máximo 3 meses hacia atrás (mínimo permitido: {minFechaInicio}).</p>
            </div>
            <div>
              <label htmlFor="fecha_fin">Fecha fin</label>
              <input id="fecha_fin" name="fecha_fin" type="date" required defaultValue={data.fecha_fin} />
            </div>
          </div>
          <div>
            <label htmlFor="motivo">Motivo y detalle</label>
            <textarea id="motivo" name="motivo" rows={5} required defaultValue={data.motivo} />
          </div>
          <div>
            <label htmlFor="justificativo">Reemplazar justificativo (opcional)</label>
            <p className="field-hint">Archivo actual: {data.justificativo_nombre}</p>
            <input id="justificativo" className="file-input" name="justificativo" type="file" />
          </div>
          <div className="row">
            <button className="btn btn--primary" type="submit">
              Guardar cambios
            </button>
            <Link href="/solicitudes" className="btn btn--secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </article>
    </section>
  );
}
