import Link from "next/link";
import { solicitarCuenta } from "@/app/actions";
import { PageHeader } from "@/components/PageHeader";

type PageProps = Readonly<{
  searchParams: Record<string, string | string[] | undefined>;
}>;

function avisoText(aviso: string | undefined, detalle?: string | undefined) {
  if (aviso === "usuario_existe") {
    return "Este correo ya está registrado en el sistema. Inicia sesión o usa otro correo institucional.";
  }
  if (aviso === "solicitud_pendiente") {
    return "Ya existe una solicitud de cuenta pendiente de aprobación para este correo. Espera la respuesta del Decano o contacta a Secretaría.";
  }
  if (aviso === "correo_invalido") {
    return "Indica un correo electrónico válido.";
  }
  if (aviso === "error") {
    return detalle ? `No se pudo enviar la solicitud: ${detalle}` : "No se pudo enviar la solicitud. Intenta de nuevo más tarde.";
  }
  return null;
}

export default function SolicitarCuentaPage({ searchParams }: PageProps) {
  const avisoParam = typeof searchParams.aviso === "string" ? searchParams.aviso : undefined;
  const detalleParam = typeof searchParams.detalle === "string" ? searchParams.detalle : undefined;
  const mensaje = avisoText(avisoParam, detalleParam ? decodeURIComponent(detalleParam) : undefined);

  return (
    <div className="login-page">
      <aside className="login-hero">
        <span className="login-hero__badge">Acceso institucional</span>
        <img
        src="/branding/LOGO-ULEAM-HORIZONTAL.png"
          alt="ULEAM"
          style={{ maxWidth: 450, width: "100%", height: "auto" }}
        />
        <h1>Solicitar cuenta</h1>
        <p>
          Si trabajas o colaboras con la facultad y aun no tienes acceso, envia tu solicitud. El Decanato la
          revisara y si corresponde se creara tu usuario.
        </p>
      </aside>
      <div className="login-panel">
        <div className="card stack" style={{ width: "100%", maxWidth: 760 }}>
          <PageHeader
            title="Datos de la solicitud"
            subtitle="Usa un correo institucional valido para registrar tu pedido."
            actions={
              <Link href="/login" className="btn btn--secondary">
                Volver al login
              </Link>
            }
          />

          <p className="field-hint" style={{ margin: "-0.5rem 0 0" }}>
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" style={{ fontWeight: 600 }}>
              Inicia sesion aqui
            </Link>
            .
          </p>

          {mensaje ? (
            <div className="alert alert--error" role="alert">
              {mensaje}
            </div>
          ) : null}

          <form action={solicitarCuenta} className="stack">
            <div className="form-grid form-grid--2">
              <div>
                <label htmlFor="nombres">Nombres</label>
                <input id="nombres" name="nombres" required autoComplete="given-name" />
              </div>
              <div>
                <label htmlFor="apellidos">Apellidos</label>
                <input id="apellidos" name="apellidos" required autoComplete="family-name" />
              </div>
            </div>
            <div className="form-grid form-grid--2">
              <div>
                <label htmlFor="email">Correo institucional</label>
                <input id="email" name="email" type="email" placeholder="correo@institucion.edu" required autoComplete="email" />
              </div>
              <div>
                <label htmlFor="rol_solicitado">Rol solicitado</label>
                <select id="rol_solicitado" name="rol_solicitado" defaultValue="administrativo">
                  <option value="administrativo">Administrativo</option>
                  <option value="secretaria">Secretaria</option>
                  <option value="decano">Decano</option>
                  <option value="superusuario">Superusuario</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="motivo">Motivo / unidad / cargo</label>
              <textarea id="motivo" name="motivo" rows={4} placeholder="Ej: Departamento, cargo, motivo de acceso..." />
            </div>
            <button className="btn btn--primary" type="submit" style={{ width: "100%", maxWidth: 320 }}>
              Enviar solicitud
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
