import { crearSolicitud } from "@/app/actions";
import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { isoDateUTC, threeMonthsAgoUTC } from "@/lib/fechas";

export default async function NuevaSolicitudSimplePage() {
  await requireAuth();
  const minFechaInicio = isoDateUTC(threeMonthsAgoUTC());

  return (
    <section className="stack">
      <PageHeader
        title="Nueva solicitud (formulario simple)"
        subtitle="Versión clásica: tipo, fechas, motivo y adjunto opcional. Para el flujo con certificado PDF y firma .p12, usa la nueva solicitud."
        actions={
          <Link href="/solicitudes/nueva" className="btn btn--secondary">
            Ir al flujo guiado
          </Link>
        }
      />

      <article className="card stack" style={{ maxWidth: 720 }}>
        <p className="field-hint" style={{ marginTop: 0 }}>
          Este formulario conserva el comportamiento anterior del sistema. Úsalo si ya tienes un documento externo y solo necesitas registrar la solicitud.
        </p>
        <form action={crearSolicitud} className="stack" encType="multipart/form-data">
          <div>
            <label htmlFor="tipo">Tipo de tramite</label>
            <select id="tipo" name="tipo" required defaultValue="justificacion">
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
              <input id="fecha_inicio" name="fecha_inicio" type="date" required min={minFechaInicio} />
              <p className="field-hint">Máximo 3 meses hacia atrás (mínimo permitido: {minFechaInicio}).</p>
            </div>
            <div>
              <label htmlFor="fecha_fin">Fecha fin</label>
              <input id="fecha_fin" name="fecha_fin" type="date" required />
            </div>
          </div>
          <div>
            <label htmlFor="motivo">Motivo y detalle</label>
            <textarea id="motivo" name="motivo" placeholder="Describe el motivo..." rows={5} required />
          </div>
          <div>
            <label htmlFor="justificativo">Documento justificativo</label>
            <input id="justificativo" className="file-input" name="justificativo" type="file" />
            <p className="field-hint">Opcional. Formatos habituales: PDF, JPG o PNG.</p>
          </div>
          <button className="btn btn--primary" type="submit">
            Enviar a revision
          </button>
        </form>
      </article>
    </section>
  );
}
