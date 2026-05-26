import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function fieldText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

async function login(formData: FormData) {
  "use server";

  const email = fieldText(formData, "email");
  const password = fieldText(formData, "password");
  const supabase = createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect("/login?error=1");
  }

  redirect("/dashboard");
}

type LoginPageProps = Readonly<{
  searchParams: Record<string, string | string[] | undefined>;
}>;

export default function LoginPage({ searchParams }: LoginPageProps) {
  const hasError = searchParams.error === "1";
  const solicitudOk = searchParams.solicitud === "ok";

  return (
    <div className="login-page">
      <aside className="login-hero">
        <span className="login-hero__badge">Acceso institucional</span>
        <img
        src="/branding/LOGO-ULEAM-HORIZONTAL.png"
          alt="ULEAM"
          style={{ maxWidth: 450, width: "100%", height: "auto" }}
        />
        <h1> Sistema de Asistencia y Validaciones Académicas (SAVA)</h1>
        <p>Gestión de permisos y justificaciones</p>
      </aside>
      <div className="login-panel">
        <div className="card stack login-card">
          <div>
            <h2 style={{ margin: 0, fontSize: "1.35rem" }}>Iniciar sesión</h2>
            <p className="field-hint" style={{ margin: "0.4rem 0 0" }}>
              Usa el correo y contraseña que te asignó el sistema o tu unidad.
            </p>
          </div>

          {hasError ? (
            <div className="alert alert--error" role="alert">
              Credenciales incorrectas o usuario sin perfil. Si aún no tienes cuenta, puedes solicitarla abajo.
            </div>
          ) : null}

          {solicitudOk ? (
            <div className="alert alert--warning" role="status">
              Solicitud enviada. El Decano revisará tu pedido; cuando sea aprobado podrás iniciar sesión con el correo indicado.
            </div>
          ) : null}

          <form action={login} className="stack">
            <div>
              <label htmlFor="email">Correo institucional</label>
              <input id="email" name="email" type="email" placeholder="usuario@institucion.edu" required autoComplete="email" />
            </div>
            <div>
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            <button className="btn btn--primary" type="submit" style={{ width: "100%" }}>
              Entrar al sistema
            </button>
          </form>

          <div className="login-signup-cta">
            <p className="login-signup-cta__label">¿No tienes cuenta todavía?</p>
            <Link href="/solicitar-cuenta" className="btn btn--secondary">
              Solicitar cuenta
            </Link>
            <p className="field-hint" style={{ margin: "0.75rem 0 0", fontSize: "0.78rem" }}>
              Solo personal autorizado. Tu solicitud será revisada por el Decanato.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
